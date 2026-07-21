package com.onlinestore.thinktank.security.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RequestRateLimitFilter extends OncePerRequestFilter {

    private record Limit(int requests, long windowSeconds) {}
    private record Counter(long windowStartedAt, int requests) {}

    private static final Map<String, Limit> LIMITS = Map.of(
            "POST /api/auth/login", new Limit(10, 60),
            "POST /api/auth/register", new Limit(5, 3600),
            "POST /api/auth/refresh", new Limit(30, 60),
            "POST /api/orders", new Limit(10, 60),
            "GET /api/orders/track", new Limit(20, 60)
    );

    // ponytail: single-node limiter; replace with a shared gateway/Redis limiter when scaling horizontally.
    private final ConcurrentHashMap<String, Counter> counters = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String route = request.getMethod() + " " + request.getRequestURI();
        Limit limit = LIMITS.get(route);
        if (limit == null) {
            filterChain.doFilter(request, response);
            return;
        }

        long now = Instant.now().getEpochSecond();
        String key = route + "|" + request.getRemoteAddr();
        Counter counter = counters.compute(key, (ignored, current) -> {
            if (current == null || now - current.windowStartedAt() >= limit.windowSeconds()) {
                return new Counter(now, 1);
            }
            return new Counter(current.windowStartedAt(), current.requests() + 1);
        });

        if (counters.size() > 10_000) {
            counters.entrySet().removeIf(entry -> now - entry.getValue().windowStartedAt() > 3600);
        }

        if (counter.requests() > limit.requests()) {
            long retryAfter = Math.max(1, limit.windowSeconds() - (now - counter.windowStartedAt()));
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(retryAfter));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"message\":\"Quá nhiều yêu cầu. Vui lòng thử lại sau.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
