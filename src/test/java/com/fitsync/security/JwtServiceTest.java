package com.fitsync.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.jsonwebtoken.JwtException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    private static final String SECRET = Base64.getEncoder().encodeToString(
            "fitsync-test-signing-key-with-at-least-32-bytes".getBytes(StandardCharsets.UTF_8));
    private static final String OTHER_SECRET = Base64.getEncoder().encodeToString(
            "a-different-test-signing-key-with-32-bytes-or-more".getBytes(StandardCharsets.UTF_8));

    @Test
    void issuesTokenWithSubjectAndConfiguredExpiration() {
        JwtService service = new JwtService(SECRET, 60_000);
        Instant beforeIssuing = Instant.now();

        JwtService.IssuedToken issuedToken = service.issueToken("member@example.com");

        assertEquals("member@example.com", service.extractSubject(issuedToken.value()));
        assertTrue(issuedToken.expiresAt().isAfter(beforeIssuing.plusSeconds(59)));
        assertTrue(issuedToken.expiresAt().isBefore(beforeIssuing.plusSeconds(61)));
    }

    @Test
    void rejectsTokensSignedWithAnotherKey() {
        JwtService issuer = new JwtService(SECRET, 60_000);
        JwtService verifier = new JwtService(OTHER_SECRET, 60_000);

        String token = issuer.issueToken("member@example.com").value();

        assertThrows(JwtException.class, () -> verifier.extractSubject(token));
    }
}