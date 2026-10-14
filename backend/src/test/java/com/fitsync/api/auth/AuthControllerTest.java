package com.fitsync.api.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.UUID;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "fitsync.jwt.secret=01234567890123456789012345678901")
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:fitsync-test;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void registersAndLogsInWithoutReturningPassword() throws Exception {
        String email = "auth-" + UUID.randomUUID() + "@example.com";
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RegisterRequest(
                                "Fit Tester", email, "password123", new BigDecimal("72.5"),
                                new BigDecimal("175.2"), 28, "NON_BINARY", "BUILD_STRENGTH"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.weightKg").value(72.5))
                .andExpect(jsonPath("$.heightCm").value(175.2))
                .andExpect(jsonPath("$.age").value(28))
                .andExpect(jsonPath("$.gender").value("NON_BINARY"))
                .andExpect(jsonPath("$.fitnessGoal").value("BUILD_STRENGTH"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        String login = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, "password123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.displayName").value("Fit Tester"))
                .andExpect(jsonPath("$.user.password").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        String token = objectMapper.readTree(login).get("token").asText();

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.weightKg").value(72.5))
                .andExpect(jsonPath("$.fitnessGoal").value("BUILD_STRENGTH"));

        mockMvc.perform(put("/api/auth/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new FitnessProfileRequest(
                                new BigDecimal("70.3"), new BigDecimal("175.2"), 29,
                                "PREFER_NOT_TO_SAY", "IMPROVE_ENDURANCE"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.weightKg").value(70.3))
                .andExpect(jsonPath("$.age").value(29))
                .andExpect(jsonPath("$.gender").value("PREFER_NOT_TO_SAY"))
                .andExpect(jsonPath("$.fitnessGoal").value("IMPROVE_ENDURANCE"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void rejectsBadCredentialsAndInvalidRegistration() throws Exception {
        String email = "invalid-" + UUID.randomUUID() + "@example.com";
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RegisterRequest("Fit Tester", email, "short"))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, "incorrect-password"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void rejectsDuplicateEmailRegistration() throws Exception {
        String email = "duplicate-" + UUID.randomUUID() + "@example.com";
        String body = objectMapper.writeValueAsString(new RegisterRequest("Fit Tester", email, "password123"));
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void rejectsProtectedProfileWithoutToken() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Authentication required"));
        mockMvc.perform(put("/api/auth/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new FitnessProfileRequest(
                                null, null, null, null, null))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsOutOfRangeFitnessDetails() throws Exception {
        String email = "invalid-profile-" + UUID.randomUUID() + "@example.com";
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RegisterRequest(
                                "Fit Tester", email, "password123", new BigDecimal("0"), null, null, null, null))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsExpiredAndMalformedTokens() throws Exception {
        byte[] keyBytes = "01234567890123456789012345678901".getBytes(StandardCharsets.UTF_8);
        String expiredToken = Jwts.builder()
                .subject("expired@example.com")
                .expiration(new Date(System.currentTimeMillis() - 1_000))
                .signWith(Keys.hmacShaKeyFor(keyBytes))
                .compact();

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized());
    }
}
