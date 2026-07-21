package com.onlinestore.thinktank.security.jwt;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    @Test
    void shouldRejectMissingOrWeakSecrets() {
        assertThrows(IllegalStateException.class, () -> new JwtService("", 60_000));
        assertThrows(IllegalStateException.class, () -> new JwtService("too-short", 60_000));
    }

    @Test
    void shouldGenerateAndValidateSignedToken() {
        JwtService service = new JwtService("test-secret-with-at-least-thirty-two-bytes", 60_000);
        String token = service.generateToken("user@example.com");

        assertTrue(service.isValid(token));
        assertEquals("user@example.com", service.extractEmail(token));
    }
}
