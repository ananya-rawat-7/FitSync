package com.fitsync.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;

import java.io.IOException;
import java.io.Reader;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

public final class EnvironmentConfigValidator {

    private static final Logger logger = LoggerFactory.getLogger(EnvironmentConfigValidator.class);
    private static final List<String> REQUIRED_ENV_KEYS = List.of(
            "FITSYNC_DB_URL",
            "FITSYNC_DB_USER",
            "FITSYNC_DB_PASSWORD",
            "JWT_SECRET",
            "JWT_EXPIRATION_MS",
            "PORT",
            "FITSYNC_CORS_ALLOWED_ORIGINS");

    private EnvironmentConfigValidator() {
    }

    static void validate(Environment environment) {
        List<String> errors = new ArrayList<>();
        if (!isH2Datasource(environment) && !hasRequiredValues(environment)) {
            errors.addAll(findEnvFileErrors(findEnvFile()));
        }
        errors.addAll(findConfigurationErrors(environment));
        if (errors.isEmpty()) {
            return;
        }

        logger.error("Backend configuration is invalid:");
        errors.forEach(error -> logger.error(" - {}", error));
        throw new IllegalStateException("Correct the environment configuration errors listed above.");
    }

    private static boolean hasRequiredValues(Environment environment) {
        return REQUIRED_ENV_KEYS.stream()
                .map(key -> environment.getProperty(key))
                .allMatch(value -> value != null && !value.isBlank());
    }

    private static Path findEnvFile() {
        Path backendRelative = Path.of("..", "..", ".env").toAbsolutePath().normalize();
        if (Files.isRegularFile(backendRelative)) {
            return backendRelative;
        }
        Path workingDirectoryRelative = Path.of(".env").toAbsolutePath().normalize();
        if (Files.isRegularFile(workingDirectoryRelative)) {
            return workingDirectoryRelative;
        }
        return backendRelative;
    }

    static List<String> findEnvFileErrors(Path envFile) {
        if (!Files.isRegularFile(envFile)) {
            return List.of("Required root .env file was not found at " + envFile
                    + ". Create it from src/backend/.env.example.");
        }

        Properties properties = new Properties();
        try (Reader reader = Files.newBufferedReader(envFile, StandardCharsets.UTF_8)) {
            properties.load(reader);
        } catch (IOException | IllegalArgumentException exception) {
            return List.of("Could not read the root .env file at " + envFile
                    + ". Check that it uses KEY=value entries.");
        }

        List<String> errors = new ArrayList<>();
        for (String key : REQUIRED_ENV_KEYS) {
            String value = properties.getProperty(key);
            if (value == null || value.isBlank()) {
                errors.add(key + " is missing or empty in the root .env file.");
            }
        }
        return errors;
    }

    static List<String> findConfigurationErrors(Environment environment) {
        List<String> errors = new ArrayList<>();
        validateDatasource(environment, errors);
        validateJwtSecret(environment, errors);
        validateJwtExpiration(environment, errors);
        validatePort(environment, errors);
        validateCorsOrigins(environment, errors);
        return errors;
    }

    private static void validateDatasource(Environment environment, List<String> errors) {
        String datasourceUrl = environment.getProperty("FITSYNC_DB_URL", "").trim();
        boolean isH2 = datasourceUrl.startsWith("jdbc:h2:");

        if (datasourceUrl.isEmpty()) {
            errors.add("FITSYNC_DB_URL is missing or empty.");
        } else if (!isH2 && !isValidMySqlUrl(datasourceUrl)) {
            errors.add("FITSYNC_DB_URL must be a valid MySQL JDBC URL beginning with jdbc:mysql:// and include a host.");
        }

        if (isH2) {
            return;
        }
        if (environment.getProperty("FITSYNC_DB_USER", "").isBlank()) {
            errors.add("FITSYNC_DB_USER is missing or empty.");
        }
        if (environment.getProperty("FITSYNC_DB_PASSWORD", "").isBlank()) {
            errors.add("FITSYNC_DB_PASSWORD is missing or empty.");
        }
    }

    private static void validateJwtSecret(Environment environment, List<String> errors) {
        String jwtSecret = environment.getProperty("JWT_SECRET", "");
        if (jwtSecret.isBlank()) {
            errors.add("JWT_SECRET is missing or empty.");
        } else if (jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
            errors.add("JWT_SECRET must contain at least 32 UTF-8 bytes.");
        }
    }

    private static void validateJwtExpiration(Environment environment, List<String> errors) {
        String expirationValue = environment.getProperty("JWT_EXPIRATION_MS", "");
        if (expirationValue.isBlank()) {
            errors.add("JWT_EXPIRATION_MS is missing or empty.");
            return;
        }
        try {
            if (Long.parseLong(expirationValue) < 60_000) {
                errors.add("JWT_EXPIRATION_MS must be at least 60000 milliseconds.");
            }
        } catch (NumberFormatException exception) {
            errors.add("JWT_EXPIRATION_MS must be a whole number of milliseconds.");
        }
    }

    private static void validatePort(Environment environment, List<String> errors) {
        String portValue = environment.getProperty("PORT", "");
        if (portValue.isBlank()) {
            errors.add("PORT is missing or empty.");
            return;
        }
        try {
            int port = Integer.parseInt(portValue);
            if (port < 1 || port > 65_535) {
                errors.add("PORT must be a number between 1 and 65535.");
            }
        } catch (NumberFormatException exception) {
            errors.add("PORT must be a whole number between 1 and 65535.");
        }
    }

    private static boolean isH2Datasource(Environment environment) {
        return environment.getProperty("FITSYNC_DB_URL", "").startsWith("jdbc:h2:");
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
        String origins = environment.getProperty("FITSYNC_CORS_ALLOWED_ORIGINS", "");
        if (origins.isBlank()) {
            errors.add("FITSYNC_CORS_ALLOWED_ORIGINS is missing or empty.");
            return;
        }
        for (String origin : origins.split(",", -1)) {
            try {
                URI uri = URI.create(origin.trim());
                if (origin.isBlank()
                        || !("http".equals(uri.getScheme()) || "https".equals(uri.getScheme()))
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
