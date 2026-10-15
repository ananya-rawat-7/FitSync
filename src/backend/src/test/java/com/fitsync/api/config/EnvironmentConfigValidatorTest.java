package com.fitsync.api.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EnvironmentConfigValidatorTest {

    @Test
    void acceptsValidMySqlAndApplicationConfiguration() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("spring.datasource.url", "jdbc:mysql://localhost:3306/fitsync")
                .withProperty("spring.datasource.username", "fitsync_app")
                .withProperty("spring.datasource.password", "local-test-password")
                .withProperty("fitsync.jwt.secret", "a-secret-with-at-least-32-utf8-bytes")
                .withProperty("fitsync.jwt.expiration-ms", "900000")
                .withProperty("server.port", "8080");

        assertThat(EnvironmentConfigValidator.findConfigurationErrors(environment)).isEmpty();
    }

    @Test
    void reportsEachInvalidSettingByItsEnvironmentVariableName() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("spring.datasource.url", "not-a-jdbc-url")
                .withProperty("spring.datasource.username", "")
                .withProperty("spring.datasource.password", "")
                .withProperty("fitsync.jwt.secret", "short")
                .withProperty("fitsync.jwt.expiration-ms", "not-a-number")
                .withProperty("server.port", "70000")
                .withProperty("fitsync.cors.allowed-origins", "ftp://example.com");

        List<String> errors = EnvironmentConfigValidator.findConfigurationErrors(environment);

        assertThat(errors)
                .anyMatch(error -> error.startsWith("FITSYNC_DB_URL"))
                .anyMatch(error -> error.startsWith("FITSYNC_DB_USER"))
                .anyMatch(error -> error.startsWith("FITSYNC_DB_PASSWORD"))
                .anyMatch(error -> error.startsWith("JWT_SECRET"))
                .anyMatch(error -> error.startsWith("JWT_EXPIRATION_MS"))
                .anyMatch(error -> error.startsWith("PORT"))
                .anyMatch(error -> error.startsWith("FITSYNC_CORS_ALLOWED_ORIGINS"));
    }

    @Test
    void allowsTheH2DatasourceUsedByIntegrationTests() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("spring.datasource.url", "jdbc:h2:mem:fitsync-test")
                .withProperty("spring.datasource.username", "sa")
                .withProperty("fitsync.jwt.secret", "a-secret-with-at-least-32-utf8-bytes")
                .withProperty("fitsync.jwt.expiration-ms", "900000")
                .withProperty("server.port", "8080");

        assertThat(EnvironmentConfigValidator.findConfigurationErrors(environment)).isEmpty();
    }
}
