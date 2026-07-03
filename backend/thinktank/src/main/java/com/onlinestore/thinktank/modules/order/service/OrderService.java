package com.onlinestore.thinktank.modules.order.service;

import com.onlinestore.thinktank.common.exception.InsufficientStockException;
import com.onlinestore.thinktank.common.exception.InvalidRequestException;
import com.onlinestore.thinktank.common.exception.ResourceNotFoundException;
import com.onlinestore.thinktank.modules.customer.entity.Customer;
import com.onlinestore.thinktank.modules.customer.repository.CustomerRepository;
import com.onlinestore.thinktank.modules.customertier.service.CustomerTierResolver;
import com.onlinestore.thinktank.modules.order.dto.CheckoutItemRequest;
import com.onlinestore.thinktank.modules.order.dto.CheckoutRequest;
import com.onlinestore.thinktank.modules.order.dto.UpdateOrderRequest;
import com.onlinestore.thinktank.modules.order.entity.Order;
import com.onlinestore.thinktank.modules.order.entity.OrderItem;
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
import lombok.extern.slf4j.Slf4j;
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
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {

    private static final Set<String> VALID_STATUSES = Set.of("PENDING", "PROCESSING", "SHIPPING", "DELIVERED", "CANCELLED");

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CustomerTierResolver customerTierResolver;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final PasswordEncoder passwordEncoder;

    public Order createOrder(CheckoutRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new InvalidRequestException("Đơn hàng phải chứa ít nhất một sản phẩm.");
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

        List<CheckoutItemRequest> sortedItems = new ArrayList<>(request.getItems());
        sortedItems.sort((a, b) -> {
            int cmp = a.getProductId().compareTo(b.getProductId());
            if (cmp != 0) return cmp;
            Long vIdA = a.getVariantId() != null ? a.getVariantId() : 0L;
            Long vIdB = b.getVariantId() != null ? b.getVariantId() : 0L;
            return vIdA.compareTo(vIdB);
        });

        for (CheckoutItemRequest itemReq : sortedItems) {
            productRepository.initializeVersionIfNull(itemReq.getProductId());
            Product product = productRepository.findWithLockById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm: " + itemReq.getProductId()));
            normalizeProductInventory(product);

            ProductVariant variant = null;
            BigDecimal price = product.getPrice();

            if (itemReq.getVariantId() != null) {
                productVariantRepository.initializeVersionIfNull(itemReq.getVariantId());
                variant = productVariantRepository.findWithLockById(itemReq.getVariantId())
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên bản sản phẩm: " + itemReq.getVariantId()));
                if (variant.getProduct() == null || !product.getId().equals(variant.getProduct().getId())) {
                    throw new InvalidRequestException("Phiên bản sản phẩm không thuộc về sản phẩm " + product.getId());
                }
                normalizeVariantInventory(variant);
                price = variant.getPrice();
            }

            int qty = itemReq.getQuantity();
            if (qty <= 0) {
                throw new InvalidRequestException("Số lượng sản phẩm phải lớn hơn 0.");
            }

            // Deduct stock immediately while the product/variant rows are locked.
            if (variant != null) {
                if (variant.getStock() < qty) {
                    throw new InsufficientStockException("Số lượng sản phẩm trong kho không đủ cho phiên bản " + variant.getName() + " (SKU: " + variant.getSku() + ")");
                }
                variant.setStock(variant.getStock() - qty);
                productVariantRepository.save(variant);
                syncProductStock(product);
                productRepository.save(product);
            } else {
                if (product.getStock() < qty) {
                    throw new InsufficientStockException("Số lượng sản phẩm trong kho không đủ cho sản phẩm " + product.getName() + " (SKU: " + product.getSku() + ")");
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
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        String newStatus = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        if (!VALID_STATUSES.contains(newStatus)) {
            throw new InvalidRequestException("Trạng thái đơn hàng không hợp lệ: " + status);
        }

        String oldStatus = order.getStatus();
        if (newStatus.equals(oldStatus)) {
            return order;
        }

        if ("CANCELLED".equals(oldStatus)) {
            adjustStock(order, false);
        } else if ("CANCELLED".equals(newStatus)) {
            adjustStock(order, true);
        }

        if ("DELIVERED".equals(oldStatus)) {
            adjustCustomerSpent(order, false);
        }
        if ("DELIVERED".equals(newStatus)) {
            adjustCustomerSpent(order, true);
        }

        order.setStatus(newStatus);
        return orderRepository.save(order);
    }

    public Order updateOrder(Long id, UpdateOrderRequest request) {
        // Admin edit flow keeps only the editable contact fields in sync.
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

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
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        String oldStatus = order.getStatus();

        // Restore stock if the order was not already cancelled.
        if (!"CANCELLED".equals(oldStatus)) {
            adjustStock(order, true);
        }

        // Roll back customer lifetime spending if this order had already contributed to it.
        if ("DELIVERED".equals(oldStatus)) {
            adjustCustomerSpent(order, false);
        }

        // The entity annotation converts this into a soft delete update.
        // Touch the item collection first so cascade soft-delete is applied to the line items too.
        order.getItems().size();
        orderRepository.delete(order);
    }

    public Order trackOrder(String orderIdStr, String phone) {
        if (orderIdStr == null || orderIdStr.trim().isEmpty() || phone == null || phone.trim().isEmpty()) {
            throw new InvalidRequestException("Mã đơn hàng và số điện thoại không được để trống.");
        }
        
        String cleanId = orderIdStr.toUpperCase().replace("TT-", "").trim();
        Long id;
        try {
            id = Long.parseLong(cleanId);
        } catch (NumberFormatException e) {
            throw new InvalidRequestException("Mã đơn hàng không hợp lệ.");
        }

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng nào với mã cung cấp."));

        if (order.getCustomer() == null || order.getCustomer().getUser() == null) {
            throw new InvalidRequestException("Dữ liệu đơn hàng bị lỗi (không có thông tin khách hàng).");
        }

        String orderPhone = order.getCustomer().getUser().getPhone();
        if (!phone.trim().equals(orderPhone)) {
            throw new InvalidRequestException("Số điện thoại không khớp với thông tin đặt hàng.");
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
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với email: " + auth.getName()));

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
        Optional<Customer> existingCustomer = customerRepository.findByUserPhone(request.getPhone())
                .filter(customer -> customer.getUser() != null && Boolean.FALSE.equals(customer.getUser().getEnabled()));
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
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quyền ROLE_CUSTOMER"));

        String guestId = UUID.randomUUID().toString();

        User user = User.builder()
                .email("guest-" + guestId + "@thinktank.invalid")
                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .address(request.getAddress())
                .enabled(false)
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

    private void adjustStock(Order order, boolean restore) {
        for (OrderItem item : order.getItems()) {
            int qty = item.getQuantity();
            Product product = productRepository.findWithLockById(item.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với id: " + item.getProduct().getId()));
            ProductVariant variant = item.getVariant() == null ? null
                    : productVariantRepository.findWithLockById(item.getVariant().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên bản sản phẩm với id: " + item.getVariant().getId()));

            if (variant != null) {
                if (!restore && variant.getStock() < qty) {
                    throw new InsufficientStockException("Số lượng trong kho không đủ cho phiên bản " + variant.getName());
                }
                variant.setStock(variant.getStock() + (restore ? qty : -qty));
                productVariantRepository.save(variant);
                syncProductStock(product);
            } else {
                if (!restore && product.getStock() < qty) {
                    throw new InsufficientStockException("Số lượng trong kho không đủ cho sản phẩm " + product.getName());
                }
                product.setStock(product.getStock() + (restore ? qty : -qty));
            }
            productRepository.save(product);
        }
    }

    private void adjustCustomerSpent(Order order, boolean add) {
        Customer customer = order.getCustomer();
        if (customer == null) return;

        BigDecimal totalSpent = customer.getTotalSpent() == null ? BigDecimal.ZERO : customer.getTotalSpent();
        totalSpent = add ? totalSpent.add(order.getFinalAmount()) : totalSpent.subtract(order.getFinalAmount()).max(BigDecimal.ZERO);
        customer.setTotalSpent(totalSpent);
        customer.setTier(customerTierResolver.resolveBySpent(totalSpent));
        customerRepository.save(customer);
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
