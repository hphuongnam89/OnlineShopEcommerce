package com.onlinestore.thinktank.security.filter;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;

class RequestRateLimitFilterTest {

    @Test
    void shouldRateLimitRepeatedLoginAttemptsPerIp() throws Exception {
        RequestRateLimitFilter filter = new RequestRateLimitFilter();
        FilterChain chain = mock(FilterChain.class);

        for (int i = 0; i < 10; i++) {
            filter.doFilter(loginRequest(), new MockHttpServletResponse(), chain);
        }
        MockHttpServletResponse blocked = new MockHttpServletResponse();
        filter.doFilter(loginRequest(), blocked, chain);

        verify(chain, times(10)).doFilter(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
        assertEquals(429, blocked.getStatus());
        assertEquals("application/json", blocked.getContentType());
    }

    private MockHttpServletRequest loginRequest() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setRemoteAddr("203.0.113.10");
        return request;
    }
}
