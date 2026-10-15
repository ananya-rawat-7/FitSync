package com.fitsync.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public final class EnvironmentConfigValidator {

    private static final Logger logger = LoggerFactory.getLogger(EnvironmentConfigValidator.class);

    private EnvironmentConfigValidator() {
    }

    static void validate(Environment environment) {
        List<String> errors = findConfigurationErrors(environment);
        if (errors.isEmpty()) {
            return;
        }

        logger.error("Backend configuration is invalid:");
        errors.forEach(error -> logger.error(" - {}", error));
        throw new IllegalStateException("Correct the environment configuration errors listed above.");
    }

    static List<String> findConfigurationErrors(Environment environment) {
        List<String> errors = new ArrayList<>();
        String datasourceUrl = environment.getProperty("spring.datasource.url", "").trim();
        boolean isH2 = datasourceUrl.startsWith("jdbc:h2:");

        if (datasourceUrl.isEmpty()) {
            errors.add("FITSYNC_DB_URL is missing or empty.");
        } else if (!isH2 && !isValidMySqlUrl(datasourceUrl)) {
            errors.add("FITSYNC_DB_URL must be a valid MySQL JDBC URL beginning with jdbc:mysql:// and include a host.");
        }

        if (!isH2) {
            if (environment.getProperty("spring.datasource.username", "").isBlank()) {
                errors.add("FITSYNC_DB_USER is missing or empty.");
            }
            if (environment.getProperty("spring.datasource.password", "").isBlank()) {
                errors.add("FITSYNC_DB_PASSWORD is missing or empty.");
            }
        }

        String jwtSecret = environment.getProperty("fitsync.jwt.secret", "");
        if (jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
            errors.add("JWT_SECRET must contain at least 32 UTF-8 bytes.");
        }

        String expirationValue = environment.getProperty("fitsync.jwt.expiration-ms", "900000");
        try {
            if (Long.parseLong(expirationValue) < 60_000) {
                errors.add("JWT_EXPIRATION_MS must be at least 60000 milliseconds.");
            }
        } catch (NumberFormatException exception) {
            errors.add("JWT_EXPIRATION_MS must be a whole number of milliseconds.");
        }

        String portValue = environment.getProperty("server.port", "8080");
        try {
            int port = Integer.parseInt(portValue);
            if (port < 1 || port > 65_535) {
                errors.add("PORT must be a number between 1 and 65535.");
            }
        } catch (NumberFormatException exception) {
            errors.add("PORT must be a whole number between 1 and 65535.");
        }

        validateCorsOrigins(environment, errors);
        return errors;
    }

    private static boolean isValidMySqlUrl(String url) {
        if (!url.startsWith("jdbc:mysql://")) {
            return false;
        }
        try {
            URI uri = URI.create(url.substring("jdbc:".length()));
            return uri.getHost() != null && !uri.getHost().isBlank();
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private static void validateCorsOrigins(Environment environment, List<String> errors) {
        String origins = environment.getProperty(
                "fitsync.cors.allowed-origins",
                "http://localhost:5173,http://127.0.0.1:5173");
        for (String origin : origins.split(",")) {
            try {
                URI uri = URI.create(origin.trim());
                if (!("http".equals(uri.getScheme()) || "https".equals(uri.getScheme()))
                        || uri.getHost() == null
                        || uri.getRawPath() != null && !uri.getRawPath().isEmpty()
                        || uri.getRawQuery() != null
                        || uri.getRawFragment() != null) {
                    errors.add("FITSYNC_CORS_ALLOWED_ORIGINS must contain comma-separated HTTP(S) origins only.");
                    return;
                }
            } catch (IllegalArgumentException exception) {
                errors.add("FITSYNC_CORS_ALLOWED_ORIGINS must contain comma-separated HTTP(S) origins only.");
                return;
            }
        }
    }
}
