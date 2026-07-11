package com.onlinestore.thinktank.security.config;

import com.onlinestore.thinktank.security.jwt.JwtAuthFilter;
import com.onlinestore.thinktank.security.filter.RequestRateLimitFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.*;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    // Central Spring Security setup for public routes, admin routes, JWT, CORS, and password hashing.
    private final JwtAuthFilter jwtAuthFilter;
    private final RequestRateLimitFilter requestRateLimitFilter;

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // Stateless JWT authentication: public store APIs stay open, admin APIs require ROLE_ADMIN.

        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(headers -> headers
                        .contentSecurityPolicy(csp -> csp.policyDirectives(
                                "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
                                "img-src 'self' data: https://cdn.hstatic.net https://images.unsplash.com; " +
                                "connect-src 'self' https://provinces.open-api.vn; frame-src https://www.youtube.com; " +
                                "object-src 'none'; base-uri 'self'; frame-ancestors 'none'"))
                        .frameOptions(frame -> frame.deny())
                        .referrerPolicy(referrer -> referrer.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.SAME_ORIGIN))
                        .permissionsPolicyHeader(policy -> policy.policy("camera=(), microphone=(), geolocation=()")))
                .authorizeHttpRequests(auth -> auth
                        // Swagger UI and API Docs
                        .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/api-docs/**", "/v3/api-docs/**", "/v3/api-docs.yaml").hasRole("ADMIN")
                        // Static Resources
                        .requestMatchers("/", "/index.html", "/favicon.ico", "/assets/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()
                        // Public REST APIs
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/products", "/api/products/**").permitAll()
                        .requestMatchers("/api/categories", "/api/categories/**").permitAll()
                        .requestMatchers("/api/reviews/product/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/orders").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/orders/track").permitAll()
                        // Admin-only REST APIs
                        .requestMatchers("/api/admin/uploads/**").hasRole("ADMIN")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        // Secure other REST APIs
                        .anyRequest().authenticated()
                )
                .addFilterBefore(requestRateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(jwtAuthFilter, RequestRateLimitFilter.class)
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        // Allow the local Vite dev servers to call the Spring Boot API during development.
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.stream(allowedOrigins.split(",")).map(String::trim).toList());
        configuration.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(java.util.List.of("Authorization", "Content-Type", "Cache-Control"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config
    ) throws Exception {
        return config.getAuthenticationManager();
    }
}
