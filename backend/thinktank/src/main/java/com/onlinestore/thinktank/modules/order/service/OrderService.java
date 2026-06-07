package com.onlinestore.thinktank.modules.order.service;

import com.onlinestore.thinktank.modules.customer.entity.Customer;
import com.onlinestore.thinktank.modules.customer.repository.CustomerRepository;
import com.onlinestore.thinktank.modules.customertier.entity.CustomerTier;
import com.onlinestore.thinktank.modules.customertier.repository.CustomerTierRepository;
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
    private final CustomerTierRepository customerTierRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final PasswordEncoder passwordEncoder;

    public Order createOrder(CheckoutRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new RuntimeException("Order must contain at least one item.");
        }

        // 1. Look up or create Customer by phone
        Customer customer = lookupOrCreateCustomer(request);

        // 2. Map items and calculate total amount
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
            Product product = productRepository.findWithLockById(itemReq.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + itemReq.getProductId()));

            ProductVariant variant = null;
            BigDecimal price = product.getPrice();

            if (itemReq.getVariantId() != null) {
                variant = productVariantRepository.findWithLockById(itemReq.getVariantId())
                        .orElseThrow(() -> new RuntimeException("Product variant not found: " + itemReq.getVariantId()));
                price = variant.getPrice();
            }

            int qty = itemReq.getQuantity();
            if (qty <= 0) {
                throw new RuntimeException("Quantity must be greater than zero.");
            }

            // Stock Deduction
            if (variant != null) {
                if (variant.getStock() < qty) {
                    throw new RuntimeException("Insufficient stock for variant " + variant.getName() + " (SKU: " + variant.getSku() + ")");
                }
                variant.setStock(variant.getStock() - qty);
                productVariantRepository.save(variant);

                // Deduct main product stock too to keep sync
                if (product.getStock() >= qty) {
                    product.setStock(product.getStock() - qty);
                } else {
                    product.setStock(0);
                }
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

        // 3. Compute discount based on current customer's tier
        int discountPercent = 0;
        if (customer.getTier() != null) {
            discountPercent = customer.getTier().getDiscountPercent();
        }

        BigDecimal discountAmount = totalAmount.multiply(BigDecimal.valueOf(discountPercent))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal finalAmount = totalAmount.subtract(discountAmount);

        order.setDiscountAmount(discountAmount);
        order.setFinalAmount(finalAmount);

        // 4. Save order
        return orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public List<Order> getMyOrders(Long userId) {
        return orderRepository.findByCustomerUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<Order> getAdminOrders(String search, LocalDateTime startDate, LocalDateTime endDate, String status) {
        Specification<Order> spec = OrderSpecification.filter(search, startDate, endDate, status);
        return orderRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    public Order updateOrderStatus(Long id, String status) {
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

                List<CustomerTier> tiers = customerTierRepository.findAllByOrderByMinSpendingAsc();
                CustomerTier matchedTier = customer.getTier();
                for (CustomerTier tier : tiers) {
                    if (newTotalSpent.compareTo(tier.getMinSpending()) >= 0) {
                        matchedTier = tier;
                    }
                }
                customer.setTier(matchedTier);
                customerRepository.save(customer);
            }
        }

        if ("CANCELLED".equals(status) && !"CANCELLED".equals(oldStatus)) {
            // Refund stock
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
                    
                    product.setStock(product.getStock() + qty);
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
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));

        String oldStatus = order.getStatus();

        // 1. If the order was not CANCELLED, restore stock
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

                    if (product != null) {
                        product.setStock(product.getStock() + qty);
                        productRepository.save(product);
                    }
                } else if (product != null) {
                    product.setStock(product.getStock() + qty);
                    productRepository.save(product);
                }
            }
        }

        // 2. If the order was DELIVERED, we need to subtract finalAmount from customer's totalSpent and update tier
        if ("DELIVERED".equals(oldStatus)) {
            Customer customer = order.getCustomer();
            if (customer != null) {
                BigDecimal newTotalSpent = customer.getTotalSpent().subtract(order.getFinalAmount());
                if (newTotalSpent.compareTo(BigDecimal.ZERO) < 0) {
                    newTotalSpent = BigDecimal.ZERO;
                }
                customer.setTotalSpent(newTotalSpent);

                List<CustomerTier> tiers = customerTierRepository.findAllByOrderByMinSpendingAsc();
                CustomerTier matchedTier = customer.getTier();
                for (CustomerTier tier : tiers) {
                    if (newTotalSpent.compareTo(tier.getMinSpending()) >= 0) {
                        matchedTier = tier;
                    }
                }
                customer.setTier(matchedTier);
                customerRepository.save(customer);
            }
        }

        // 3. Delete order
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
        // Check if there is an authenticated user
        String authenticatedEmail = null;
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            authenticatedEmail = auth.getName();
        }

        if (authenticatedEmail != null) {
            User loggedInUser = userRepository.findByEmail(authenticatedEmail)
                    .orElseThrow(() -> new RuntimeException("Current user not found with email: " + auth.getName()));

            // Find or create customer for this user
            Customer customer = customerRepository.findByUserId(loggedInUser.getId())
                    .orElseGet(() -> {
                        List<CustomerTier> tiers = customerTierRepository.findAllByOrderByMinSpendingAsc();
                        CustomerTier bronzeTier = tiers.stream()
                                .filter(t -> "BRONZE".equals(t.getName()))
                                .findFirst()
                                .orElse(null);
                        Customer newCustomer = Customer.builder()
                                .user(loggedInUser)
                                .tier(bronzeTier)
                                .totalSpent(BigDecimal.ZERO)
                                .build();
                        return customerRepository.save(newCustomer);
                    });

            // Update user details if provided in checkout request and currently empty
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
            if (changed) {
                userRepository.save(loggedInUser);
            }

            return customer;
        }

        // Guest checkout path: find by phone number
        Optional<Customer> existingCustomer = customerRepository.findByUserPhone(request.getPhone());
        if (existingCustomer.isPresent()) {
            Customer customer = existingCustomer.get();
            User user = customer.getUser();
            if (user != null) {
                // update user's full name if it was empty/null
                if (user.getFullName() == null || user.getFullName().trim().isEmpty()) {
                    user.setFullName(request.getFullName());
                    userRepository.save(user);
                }
            }
            return customer;
        }

        // Customer does not exist, create new guest user
        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseThrow(() -> new RuntimeException("ROLE_CUSTOMER role not found"));

        String email = request.getEmail();
        if (email == null || email.trim().isEmpty()) {
            email = request.getPhone() + "@thinktank.com";
        }

        // If email is already taken, generate a unique one
        if (userRepository.existsByEmail(email)) {
            email = request.getPhone() + "_" + System.currentTimeMillis() + "@thinktank.com";
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPhone()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .enabled(true)
                .roles(Set.of(customerRole))
                .build();
        userRepository.save(user);

        // Get BRONZE tier (default)
        List<CustomerTier> tiers = customerTierRepository.findAllByOrderByMinSpendingAsc();
        CustomerTier bronzeTier = tiers.stream()
                .filter(t -> "BRONZE".equals(t.getName()))
                .findFirst()
                .orElseGet(() -> tiers.isEmpty() ? null : tiers.get(0));

        Customer customer = Customer.builder()
                .user(user)
                .tier(bronzeTier)
                .totalSpent(BigDecimal.ZERO)
                .build();

        return customerRepository.save(customer);
    }
}
