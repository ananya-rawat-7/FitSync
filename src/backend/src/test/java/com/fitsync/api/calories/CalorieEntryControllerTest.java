package com.fitsync.api.calories;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitsync.api.auth.LoginRequest;
import com.fitsync.api.auth.RegisterRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
class CalorieEntryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String token;

    @BeforeEach
    void registerAndAuthenticate() throws Exception {
        String email = "calorie-" + UUID.randomUUID() + "@example.com";
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("Calorie Tester", email, "password123"))))
                .andExpect(status().isCreated());

        String login = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, "password123"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        token = "Bearer " + objectMapper.readTree(login).get("token").asText();
    }

    @Test
    void createsListsAndDeletesCalorieEntries() throws Exception {
        String request = objectMapper.writeValueAsString(new CalorieEntryRequest(
                "Oatmeal", MealType.BREAKFAST, 350, LocalDate.now()));
        String response = mockMvc.perform(post("/api/calories")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.foodName").value("Oatmeal"))
                .andExpect(jsonPath("$.mealType").value("BREAKFAST"))
                .andExpect(jsonPath("$.calories").value(350))
                .andReturn().getResponse().getContentAsString();
        long id = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(get("/api/calories").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(delete("/api/calories/{id}", id).header("Authorization", token))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/calories").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void rejectsInvalidAndUnauthenticatedCalorieEntries() throws Exception {
        String invalidRequest = objectMapper.writeValueAsString(
                new CalorieEntryRequest("Snack", MealType.SNACK, 0, LocalDate.now()));
        mockMvc.perform(post("/api/calories")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidRequest))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/calories"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void onlyTheOwnerCanSeeOrDeleteAnEntry() throws Exception {
        String response = mockMvc.perform(post("/api/calories")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CalorieEntryRequest(
                                "Lunch", MealType.LUNCH, 600, LocalDate.now()))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = objectMapper.readTree(response).get("id").asLong();

        String otherEmail = "other-calorie-" + UUID.randomUUID() + "@example.com";
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegisterRequest("Other Tester", otherEmail, "password123"))))
                .andExpect(status().isCreated());
        String otherLogin = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(otherEmail, "password123"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String otherToken = "Bearer " + objectMapper.readTree(otherLogin).get("token").asText();

        mockMvc.perform(get("/api/calories").header("Authorization", otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(delete("/api/calories/{id}", id).header("Authorization", otherToken))
                .andExpect(status().isNotFound());
    }
}
