package com.fitsync.api.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.env.MockEnvironment;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EnvironmentConfigValidatorTest {

    @TempDir
    Path temporaryDirectory;

    @Test
    void acceptsValidMySqlAndApplicationConfiguration() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("FITSYNC_DB_URL", "jdbc:mysql://localhost:3306/fitsync")
                .withProperty("FITSYNC_DB_USER", "fitsync_app")
                .withProperty("FITSYNC_DB_PASSWORD", "local-test-password")
                .withProperty("JWT_SECRET", "a-secret-with-at-least-32-utf8-bytes")
                .withProperty("JWT_EXPIRATION_MS", "900000")
                .withProperty("PORT", "8080")
                .withProperty("FITSYNC_CORS_ALLOWED_ORIGINS", "http://localhost:5173");

        assertThat(EnvironmentConfigValidator.findConfigurationErrors(environment)).isEmpty();
    }

    @Test
    void reportsEachInvalidSettingByItsEnvironmentVariableName() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("FITSYNC_DB_URL", "not-a-jdbc-url")
                .withProperty("FITSYNC_DB_USER", "")
                .withProperty("FITSYNC_DB_PASSWORD", "")
                .withProperty("JWT_SECRET", "short")
                .withProperty("JWT_EXPIRATION_MS", "not-a-number")
                .withProperty("PORT", "70000")
                .withProperty("FITSYNC_CORS_ALLOWED_ORIGINS", "ftp://example.com");

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
                .withProperty("FITSYNC_DB_URL", "jdbc:h2:mem:fitsync-test")
                .withProperty("JWT_SECRET", "a-secret-with-at-least-32-utf8-bytes")
                .withProperty("JWT_EXPIRATION_MS", "900000")
                .withProperty("PORT", "8080")
                .withProperty("FITSYNC_CORS_ALLOWED_ORIGINS", "http://localhost:5173");

        assertThat(EnvironmentConfigValidator.findConfigurationErrors(environment)).isEmpty();
    }

    @Test
    void reportsMissingRequiredEnvironmentValues() {
        assertThat(EnvironmentConfigValidator.findConfigurationErrors(new MockEnvironment()))
                .contains("FITSYNC_DB_URL is missing or empty.",
                        "JWT_SECRET is missing or empty.",
                        "JWT_EXPIRATION_MS is missing or empty.",
                        "PORT is missing or empty.",
                        "FITSYNC_CORS_ALLOWED_ORIGINS is missing or empty.");
    }

    @Test
    void checksTheRootEnvFileExistsAndContainsRequiredKeys() throws Exception {
        Path envFile = temporaryDirectory.resolve(".env");
        assertThat(EnvironmentConfigValidator.findEnvFileErrors(envFile))
                .singleElement()
                .asString()
                .contains("Required root .env file was not found");

        Files.writeString(envFile, "FITSYNC_DB_URL=jdbc:mysql://localhost:3306/fitsync\n");
        assertThat(EnvironmentConfigValidator.findEnvFileErrors(envFile))
                .contains("FITSYNC_DB_USER is missing or empty in the root .env file.",
                        "JWT_SECRET is missing or empty in the root .env file.",
                        "FITSYNC_CORS_ALLOWED_ORIGINS is missing or empty in the root .env file.");
    }
}
