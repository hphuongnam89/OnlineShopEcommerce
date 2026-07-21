package com.onlinestore.thinktank.security.jwt;

import com.onlinestore.thinktank.security.service.CustomUserDetailsService;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    // Reads Bearer tokens and places the authenticated user into Spring Security context.
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        // Validate token FIRST before hitting the database — avoids wasted DB queries for invalid tokens
        if (!jwtService.isValid(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        String email;
        try {
            email = jwtService.extractEmail(token);
        } catch (Exception e) {
            // Token is invalid or expired, proceed as anonymous user
            filterChain.doFilter(request, response);
            return;
        }

        Authentication currentAuthentication = SecurityContextHolder.getContext().getAuthentication();
        boolean hasRealAuthentication = currentAuthentication != null
                && currentAuthentication.isAuthenticated()
                && !(currentAuthentication instanceof AnonymousAuthenticationToken);

        if (email != null && !hasRealAuthentication) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);

            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );

            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }
}
