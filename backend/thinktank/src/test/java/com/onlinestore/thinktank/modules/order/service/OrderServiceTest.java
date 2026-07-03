package com.onlinestore.thinktank.modules.order.service;

import com.onlinestore.thinktank.common.exception.InvalidRequestException;
import com.onlinestore.thinktank.modules.customer.entity.Customer;
import com.onlinestore.thinktank.modules.customer.repository.CustomerRepository;
import com.onlinestore.thinktank.modules.customertier.entity.CustomerTier;
import com.onlinestore.thinktank.modules.customertier.service.CustomerTierResolver;
import com.onlinestore.thinktank.modules.order.dto.CheckoutItemRequest;
import com.onlinestore.thinktank.modules.order.dto.CheckoutRequest;
import com.onlinestore.thinktank.modules.order.entity.Order;
import com.onlinestore.thinktank.modules.order.repository.OrderItemRepository;
import com.onlinestore.thinktank.modules.order.repository.OrderRepository;
import com.onlinestore.thinktank.modules.product.entity.Product;
import com.onlinestore.thinktank.modules.product.entity.ProductVariant;
import com.onlinestore.thinktank.modules.product.repository.ProductRepository;
import com.onlinestore.thinktank.modules.product.repository.ProductVariantRepository;
import com.onlinestore.thinktank.modules.role.entity.Role;
import com.onlinestore.thinktank.modules.role.repository.RoleRepository;
import com.onlinestore.thinktank.modules.user.entity.User;
import com.onlinestore.thinktank.modules.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private OrderItemRepository orderItemRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private CustomerTierResolver customerTierResolver;
    @Mock private ProductRepository productRepository;
    @Mock private ProductVariantRepository productVariantRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private OrderService orderService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createOrder_withVariantShouldSyncAggregateProductStock() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("anonymousUser", null));

        Role customerRole = Role.builder().name("ROLE_CUSTOMER").build();
        CustomerTier defaultTier = CustomerTier.builder().name("SILVER").discountPercent(0).minSpending(BigDecimal.ZERO).build();
        User guestUser = User.builder()
                .email("0912345678@thinktank.com")
                .passwordHash("hashed")
                .fullName("Guest")
                .phone("0912345678")
                .enabled(true)
                .roles(Set.of(customerRole))
                .build();
        Customer guestCustomer = Customer.builder().user(guestUser).tier(defaultTier).totalSpent(BigDecimal.ZERO).build();

        Product product = Product.builder().id(10L).name("Bag").price(BigDecimal.valueOf(100000)).stock(5).build();
        ProductVariant variant = ProductVariant.builder().id(20L).product(product).name("Black").price(BigDecimal.valueOf(120000)).stock(5).build();

        when(customerRepository.findByUserPhone("0912345678")).thenReturn(Optional.empty());
        when(roleRepository.findByName("ROLE_CUSTOMER")).thenReturn(Optional.of(customerRole));
        when(userRepository.save(any(User.class))).thenReturn(guestUser);
        when(customerTierResolver.resolveDefaultCustomerTier()).thenReturn(defaultTier);
        when(customerRepository.save(any(Customer.class))).thenReturn(guestCustomer);
        when(productRepository.findWithLockById(10L)).thenReturn(Optional.of(product));
        when(productVariantRepository.findWithLockById(20L)).thenReturn(Optional.of(variant));
        when(productVariantRepository.sumStockByProductId(10L)).thenReturn(4);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CheckoutRequest request = CheckoutRequest.builder()
                .fullName("Guest")
                .phone("0912345678")
                .email("guest@example.com")
                .address("HCM")
                .items(List.of(CheckoutItemRequest.builder().productId(10L).variantId(20L).quantity(1).build()))
                .build();

        Order order = orderService.createOrder(request);

        ArgumentCaptor<Product> productCaptor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository).save(productCaptor.capture());
        assertEquals(4, productCaptor.getValue().getStock());
        assertEquals(4, order.getItems().get(0).getProduct().getStock());
    }

    @Test
    void createOrder_shouldRejectVariantFromAnotherProduct() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("customer@example.com", null, List.of()));

        User user = User.builder().id(1L).email("customer@example.com").enabled(true).build();
        Customer customer = Customer.builder().user(user).totalSpent(BigDecimal.ZERO).build();
        Product requestedProduct = Product.builder().id(10L).name("Bag").price(BigDecimal.valueOf(100000)).stock(5).build();
        Product otherProduct = Product.builder().id(11L).name("Wallet").price(BigDecimal.valueOf(10000)).stock(5).build();
        ProductVariant wrongVariant = ProductVariant.builder()
                .id(20L).product(otherProduct).name("Cheap").price(BigDecimal.valueOf(1000)).stock(5).build();

        when(userRepository.findByEmail("customer@example.com")).thenReturn(Optional.of(user));
        when(customerRepository.findByUserId(1L)).thenReturn(Optional.of(customer));
        when(productRepository.findWithLockById(10L)).thenReturn(Optional.of(requestedProduct));
        when(productVariantRepository.findWithLockById(20L)).thenReturn(Optional.of(wrongVariant));

        CheckoutRequest request = CheckoutRequest.builder()
                .fullName("Customer")
                .phone("0912345678")
                .address("HCM")
                .items(List.of(CheckoutItemRequest.builder().productId(10L).variantId(20L).quantity(1).build()))
                .build();

        assertThrows(InvalidRequestException.class, () -> orderService.createOrder(request));
    }

    @Test
    void updateOrderStatus_leavingDeliveredShouldRemoveCustomerSpending() {
        Customer customer = Customer.builder().totalSpent(BigDecimal.valueOf(200)).build();
        Order order = Order.builder()
                .id(1L)
                .customer(customer)
                .finalAmount(BigDecimal.valueOf(100))
                .status("DELIVERED")
                .items(List.of())
                .build();

        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        orderService.updateOrderStatus(1L, "CANCELLED");

        assertEquals("CANCELLED", order.getStatus());
        assertEquals(0, BigDecimal.valueOf(100).compareTo(customer.getTotalSpent()));
    }
}
