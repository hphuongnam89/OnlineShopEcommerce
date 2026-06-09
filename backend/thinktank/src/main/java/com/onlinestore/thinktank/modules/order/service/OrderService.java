package com.onlinestore.thinktank.modules.order.service;

import com.onlinestore.thinktank.modules.customer.entity.Customer;
import com.onlinestore.thinktank.modules.customer.repository.CustomerRepository;
import com.onlinestore.thinktank.modules.customertier.service.CustomerTierResolver;
import com.onlinestore.thinktank.modules.order.dto.CheckoutItemRequest;
import com.onlinestore.thinktank.modules.order.dto.CheckoutRequest;
import com.onlinestore.thinktank.modules.order.dto.UpdateOrderRequest;
import com.onlinestore.thinktank.modules.order.entity.Order;
import com.onlinestore.thinktank.modules.order.entity.OrderItem;
import com.onlinestore.thinktank.modules.order.repository.OrderItemRepository;
import com.onlinestore.thinktank.modules.order.repository.OrderRepository;
import com.onlinestore.thinktank.modules.order.specification.OrderSpecification;
import com.onlinestore.thinktank.modules.product.entity.Product;
import com.onlinestore.thinktank.modules.product.entity.ProductVariant;
import com.onlinestore.thinktank.modules.product.repository.ProductRepository;
import com.onlinestore.thinktank.modules.product.repository.ProductVariantRepository;
import com.onlinestore.thinktank.modules.role.entity.Role;
import com.onlinestore.thinktank.modules.role.repository.RoleRepository;
import com.onlinestore.thinktank.modules.user.entity.User;
import com.onlinestore.thinktank.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CustomerTierResolver customerTierResolver;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final PasswordEncoder passwordEncoder;

    public Order createOrder(CheckoutRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new RuntimeException("Order must contain at least one item.");
        }

        // Checkout flow:
        // 1) resolve the customer account
        // 2) lock inventory rows
        // 3) compute discount and final amount
        // 4) persist the order and order items together
        Customer customer = lookupOrCreateCustomer(request);

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        Order order = Order.builder()
                .customer(customer)
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .address(request.getAddress())
                .email(request.getEmail())
                .notes(request.getNotes())
                .status("PENDING")
                .build();

        for (CheckoutItemRequest itemReq : request.getItems()) {
            productRepository.initializeVersionIfNull(itemReq.getProductId());
            Product product = productRepository.findWithLockById(itemReq.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + itemReq.getProductId()));
            normalizeProductInventory(product);

            ProductVariant variant = null;
            BigDecimal price = product.getPrice();

            if (itemReq.getVariantId() != null) {
                productVariantRepository.initializeVersionIfNull(itemReq.getVariantId());
                variant = productVariantRepository.findWithLockById(itemReq.getVariantId())
                        .orElseThrow(() -> new RuntimeException("Product variant not found: " + itemReq.getVariantId()));
                normalizeVariantInventory(variant);
                price = variant.getPrice();
            }

            int qty = itemReq.getQuantity();
            if (qty <= 0) {
                throw new RuntimeException("Quantity must be greater than zero.");
            }

            // Deduct stock immediately while the product/variant rows are locked.
            if (variant != null) {
                if (variant.getStock() < qty) {
                    throw new RuntimeException("Insufficient stock for variant " + variant.getName() + " (SKU: " + variant.getSku() + ")");
                }
                variant.setStock(variant.getStock() - qty);
                productVariantRepository.save(variant);
                syncProductStock(product);
                productRepository.save(product);
            } else {
                if (product.getStock() < qty) {
                    throw new RuntimeException("Insufficient stock for product " + product.getName() + " (SKU: " + product.getSku() + ")");
                }
                product.setStock(product.getStock() - qty);
                productRepository.save(product);
            }

            BigDecimal subtotal = price.multiply(BigDecimal.valueOf(qty));
            totalAmount = totalAmount.add(subtotal);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .variant(variant)
                    .quantity(qty)
                    .price(price)
                    .subtotal(subtotal)
                    .build();

            orderItems.add(orderItem);
        }

        order.setItems(orderItems);
        order.setTotalAmount(totalAmount);

        // Apply loyalty discount from the customer's current tier.
        int discountPercent = 0;
        if (customer.getTier() != null) {
            discountPercent = customer.getTier().getDiscountPercent();
        }

        BigDecimal discountAmount = totalAmount.multiply(BigDecimal.valueOf(discountPercent))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal finalAmount = totalAmount.subtract(discountAmount);

        order.setDiscountAmount(discountAmount);
        order.setFinalAmount(finalAmount);

        // Save the order last so the calculated totals and child rows are consistent.
        return orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public List<Order> getMyOrders(Long userId) {
        // Customer-facing order history uses the soft-delete filtered Order entity.
        return orderRepository.findByCustomerUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<Order> getAdminOrders(String search, LocalDateTime startDate, LocalDateTime endDate, String status) {
        // Admin search combines free-text, date range, and status filters.
        Specification<Order> spec = OrderSpecification.filter(search, startDate, endDate, status);
        return orderRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    public Order updateOrderStatus(Long id, String status) {
        // Status changes can affect stock and customer lifetime spending, so we handle them here.
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
        
        String oldStatus = order.getStatus();
        if (status.equals(oldStatus)) {
            return order;
        }

        order.setStatus(status);

        if ("DELIVERED".equals(status)) {
            Customer customer = order.getCustomer();
            if (customer != null) {
                BigDecimal newTotalSpent = customer.getTotalSpent().add(order.getFinalAmount());
                customer.setTotalSpent(newTotalSpent);

                customer.setTier(customerTierResolver.resolveBySpent(newTotalSpent));
                customerRepository.save(customer);
            }
        }

        if ("CANCELLED".equals(status) && !"CANCELLED".equals(oldStatus)) {
            // Refund stock when an order transitions into the cancelled state.
            for (OrderItem item : order.getItems()) {
                int qty = item.getQuantity();
                ProductVariant variant = item.getVariant() != null
                        ? productVariantRepository.findWithLockById(item.getVariant().getId())
                        .orElseThrow(() -> new RuntimeException("Product variant not found with id: " + item.getVariant().getId()))
                        : null;
                Product product = productRepository.findWithLockById(item.getProduct().getId())
                        .orElseThrow(() -> new RuntimeException("Product not found with id: " + item.getProduct().getId()));

                if (variant != null) {
                    variant.setStock(variant.getStock() + qty);
                    productVariantRepository.save(variant);
                    syncProductStock(product);
                    productRepository.save(product);
                } else if (product != null) {
                    product.setStock(product.getStock() + qty);
                    productRepository.save(product);
                }
            }
        }

        return orderRepository.save(order);
    }

    public Order updateOrder(Long id, UpdateOrderRequest request) {
        // Admin edit flow keeps only the editable contact fields in sync.
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));

        if (request.getFullName() != null) {
            order.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null) {
            order.setPhone(request.getPhone().trim());
        }
        if (request.getAddress() != null) {
            order.setAddress(request.getAddress().trim());
        }
        if (request.getEmail() != null) {
            order.setEmail(request.getEmail().trim());
        }
        if (request.getNotes() != null) {
            order.setNotes(request.getNotes().trim());
        }

        return orderRepository.save(order);
    }

    public void deleteOrder(Long id) {
        // Soft delete the order after stock and loyalty adjustments are settled.
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));

        String oldStatus = order.getStatus();

        // Restore stock if the order was not already cancelled.
        if (!"CANCELLED".equals(oldStatus)) {
            for (OrderItem item : order.getItems()) {
                int qty = item.getQuantity();
                ProductVariant variant = item.getVariant() != null
                        ? productVariantRepository.findWithLockById(item.getVariant().getId()).orElse(null)
                        : null;
                Product product = productRepository.findWithLockById(item.getProduct().getId()).orElse(null);

                if (variant != null) {
                    variant.setStock(variant.getStock() + qty);
                    productVariantRepository.save(variant);
                    syncProductStock(product);
                    productRepository.save(product);
                } else if (product != null) {
                    product.setStock(product.getStock() + qty);
                    productRepository.save(product);
                }
            }
        }

        // Roll back customer lifetime spending if this order had already contributed to it.
        if ("DELIVERED".equals(oldStatus)) {
            Customer customer = order.getCustomer();
            if (customer != null) {
                BigDecimal newTotalSpent = customer.getTotalSpent().subtract(order.getFinalAmount());
                if (newTotalSpent.compareTo(BigDecimal.ZERO) < 0) {
                    newTotalSpent = BigDecimal.ZERO;
                }
                customer.setTotalSpent(newTotalSpent);

                customer.setTier(customerTierResolver.resolveBySpent(newTotalSpent));
                customerRepository.save(customer);
            }
        }

        // The entity annotation converts this into a soft delete update.
        // Touch the item collection first so cascade soft-delete is applied to the line items too.
        order.getItems().size();
        orderRepository.delete(order);
    }

    public Order trackOrder(String orderIdStr, String phone) {
        if (orderIdStr == null || orderIdStr.trim().isEmpty() || phone == null || phone.trim().isEmpty()) {
            throw new RuntimeException("Mã đơn hàng và số điện thoại không được để trống.");
        }
        
        String cleanId = orderIdStr.toUpperCase().replace("TT-", "").trim();
        Long id;
        try {
            id = Long.parseLong(cleanId);
        } catch (NumberFormatException e) {
            throw new RuntimeException("Mã đơn hàng không hợp lệ.");
        }

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng nào với mã cung cấp."));

        if (order.getCustomer() == null || order.getCustomer().getUser() == null) {
            throw new RuntimeException("Dữ liệu đơn hàng bị lỗi (không có thông tin khách hàng).");
        }

        String orderPhone = order.getCustomer().getUser().getPhone();
        if (!phone.trim().equals(orderPhone)) {
            throw new RuntimeException("Số điện thoại không khớp với thông tin đặt hàng.");
        }

        return order;
    }

    private Customer lookupOrCreateCustomer(CheckoutRequest request) {
        // Authenticated checkout uses the logged-in account when available.
        String authenticatedEmail = null;
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            authenticatedEmail = auth.getName();
        }

        if (authenticatedEmail != null) {
            User loggedInUser = userRepository.findByEmail(authenticatedEmail)
                    .orElseThrow(() -> new RuntimeException("Current user not found with email: " + auth.getName()));

            // Find or create the customer profile attached to the logged-in user.
            Customer customer = customerRepository.findByUserId(loggedInUser.getId())
                    .orElseGet(() -> {
                        Customer newCustomer = Customer.builder()
                                .user(loggedInUser)
                                .tier(customerTierResolver.resolveDefaultCustomerTier())
                                .totalSpent(BigDecimal.ZERO)
                                .build();
                        return customerRepository.save(newCustomer);
                    });

            // Fill empty profile fields from the checkout form without overwriting existing data.
            boolean changed = false;
            if (request.getPhone() != null && !request.getPhone().trim().isEmpty() && 
                    (loggedInUser.getPhone() == null || loggedInUser.getPhone().trim().isEmpty())) {
                loggedInUser.setPhone(request.getPhone().trim());
                changed = true;
            }
            if (request.getFullName() != null && !request.getFullName().trim().isEmpty() && 
                    (loggedInUser.getFullName() == null || loggedInUser.getFullName().trim().isEmpty())) {
                loggedInUser.setFullName(request.getFullName().trim());
                changed = true;
            }
            if (request.getAddress() != null && !request.getAddress().trim().isEmpty()) {
                loggedInUser.setAddress(request.getAddress().trim());
                changed = true;
            }
            if (changed) {
                userRepository.save(loggedInUser);
            }

            return customer;
        }

        // Guest checkout path: match by phone number first so repeat buyers stay on the same profile.
        Optional<Customer> existingCustomer = customerRepository.findByUserPhone(request.getPhone());
        if (existingCustomer.isPresent()) {
            Customer customer = existingCustomer.get();
            User user = customer.getUser();
            if (user != null) {
                // Backfill missing full name only; keep any existing profile data intact.
                if (user.getFullName() == null || user.getFullName().trim().isEmpty()) {
                    user.setFullName(request.getFullName());
                    userRepository.save(user);
                }
                if (request.getAddress() != null && !request.getAddress().trim().isEmpty()) {
                    user.setAddress(request.getAddress().trim());
                    userRepository.save(user);
                }
            }
            return customer;
        }

        // Create a new guest customer account when no phone match exists.
        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseThrow(() -> new RuntimeException("ROLE_CUSTOMER role not found"));

        String email = request.getEmail();
        if (email == null || email.trim().isEmpty()) {
            email = request.getPhone() + "@thinktank.com";
        }

        // If email is already taken, generate a unique guest email as a fallback.
        if (userRepository.existsByEmail(email)) {
            email = request.getPhone() + "_" + System.currentTimeMillis() + "@thinktank.com";
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPhone()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .address(request.getAddress())
                .enabled(true)
                .roles(Set.of(customerRole))
                .build();
        userRepository.save(user);

        // New guest customers start at the configured default customer tier.
        Customer customer = Customer.builder()
                .user(user)
                .tier(customerTierResolver.resolveDefaultCustomerTier())
                .totalSpent(BigDecimal.ZERO)
                .build();

        return customerRepository.save(customer);
    }

    private void syncProductStock(Product product) {
        Integer total = productVariantRepository.sumStockByProductId(product.getId());
        product.setStock(total != null ? total : 0);
    }

    private void normalizeProductInventory(Product product) {
        // Older seeded/imported rows may have null stock/version values; stock updates require concrete numbers.
        if (product.getStock() == null) {
            product.setStock(0);
        }
        if (product.getVersion() == null) {
            product.setVersion(0L);
        }
    }

    private void normalizeVariantInventory(ProductVariant variant) {
        // Keep variant checkout safe for imported rows with missing optimistic-lock version.
        if (variant.getStock() == null) {
            variant.setStock(0);
        }
        if (variant.getVersion() == null) {
            variant.setVersion(0L);
        }
    }
}
