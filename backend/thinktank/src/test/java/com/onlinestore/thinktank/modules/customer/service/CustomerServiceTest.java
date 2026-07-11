package com.onlinestore.thinktank.modules.customer.service;

import com.onlinestore.thinktank.modules.customer.entity.Customer;
import com.onlinestore.thinktank.modules.customer.dto.CustomerRequest;
import com.onlinestore.thinktank.modules.customer.repository.CustomerRepository;
import com.onlinestore.thinktank.modules.customertier.service.CustomerTierResolver;
import com.onlinestore.thinktank.modules.role.repository.RoleRepository;
import com.onlinestore.thinktank.modules.role.entity.Role;
import com.onlinestore.thinktank.modules.user.entity.User;
import com.onlinestore.thinktank.modules.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
// Kiểm tra nghiệp vụ tạo, cập nhật và xóa mềm khách hàng.
class CustomerServiceTest {

    @Mock private CustomerRepository customerRepository;
    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private CustomerTierResolver customerTierResolver;
    @Mock private com.onlinestore.thinktank.modules.order.repository.OrderRepository orderRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private CustomerService customerService;

    @Test
    void deleteCustomer_shouldSoftDeleteCustomerAndDisableUser() {
        User user = User.builder().id(10L).email("user@example.com").enabled(true).build();
        Customer customer = Customer.builder().id(20L).user(user).totalSpent(BigDecimal.ZERO).build();
        customer.setDeleted(false);

        when(customerRepository.findById(20L)).thenReturn(Optional.of(customer));
        when(customerRepository.save(org.mockito.ArgumentMatchers.any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.save(org.mockito.ArgumentMatchers.any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        customerService.deleteCustomer(20L);

        ArgumentCaptor<Customer> customerCaptor = ArgumentCaptor.forClass(Customer.class);
        verify(customerRepository).save(customerCaptor.capture());
        assertTrue(customerCaptor.getValue().isDeleted());
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertTrue(userCaptor.getValue().isDeleted());
        assertFalse(Boolean.TRUE.equals(userCaptor.getValue().getEnabled()));
    }

    @Test
    void createCustomer_shouldNormalizeEmailBeforeLookupAndSave() {
        CustomerRequest request = CustomerRequest.builder()
                .email("  Customer@Example.COM ")
                .password("password123")
                .fullName("Customer")
                .phone("0912345678")
                .build();
        Role role = Role.builder().name("ROLE_CUSTOMER").build();

        when(userRepository.existsByEmail("customer@example.com")).thenReturn(false);
        when(roleRepository.findByName("ROLE_CUSTOMER")).thenReturn(Optional.of(role));
        when(passwordEncoder.encode("password123")).thenReturn("hash");
        when(userRepository.save(org.mockito.ArgumentMatchers.any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(customerRepository.save(org.mockito.ArgumentMatchers.any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        customerService.createCustomer(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertEquals("customer@example.com", userCaptor.getValue().getEmail());
    }
}
