package com.onlinestore.thinktank.modules.order.service;

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
        when(userRepository.existsByEmail("guest@example.com")).thenReturn(false);
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
}
