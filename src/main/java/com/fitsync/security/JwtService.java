package com.fitsync.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private static final String ISSUER = "fitsync";

    private final SecretKey signingKey;
    private final long expirationMillis;

    public JwtService(@Value("${fitsync.jwt.secret}") String secret,
            @Value("${fitsync.jwt.expiration-ms:1800000}") long expirationMillis) {
        if (expirationMillis <= 0) {
            throw new IllegalArgumentException("JWT expiration must be positive");
        }
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.expirationMillis = expirationMillis;
    }

    public IssuedToken issueToken(String subject) {
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plusMillis(expirationMillis);
        String value = Jwts.builder()
                .issuer(ISSUER)
                .subject(subject)
                .issuedAt(Date.from(issuedAt))
                .expiration(Date.from(expiresAt))
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
        return new IssuedToken(value, expiresAt);
    }

    public String extractSubject(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .requireIssuer(ISSUER)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }

    public record IssuedToken(String value, Instant expiresAt) {
    }
}