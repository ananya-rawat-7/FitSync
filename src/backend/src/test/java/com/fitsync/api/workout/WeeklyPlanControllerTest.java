package com.fitsync.api.workout;

import com.fasterxml.jackson.databind.JsonNode;
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

import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "FITSYNC_DB_URL=jdbc:h2:mem:fitsync-test;DB_CLOSE_DELAY=-1",
        "FITSYNC_DB_USER=sa",
        "FITSYNC_DB_PASSWORD=test",
        "JWT_SECRET=01234567890123456789012345678901",
        "JWT_EXPIRATION_MS=900000",
        "PORT=8080",
        "FITSYNC_CORS_ALLOWED_ORIGINS=http://localhost:5173"
})
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class WeeklyPlanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private WorkoutPlanRepository planRepository;

    @Autowired
    private WorkoutSessionRepository sessionRepository;

    private String token;

    @BeforeEach
    void clearPlansAndAuthenticate() throws Exception {
        sessionRepository.deleteAll();
        planRepository.deleteAll();
        String email = "weekly-" + UUID.randomUUID() + "@example.com";
        register(email, "GAIN_WEIGHT");
        token = login(email);
    }

    @Test
    void generatesAGoalBasedWeekWithExercises() throws Exception {
        mockMvc.perform(post("/api/workout-plans/generate-week")
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"startDate\":\"2026-10-20\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(7)))
                .andExpect(jsonPath("$[0].goal").value("GAIN_WEIGHT"))
                .andExpect(jsonPath("$[0].generated").value(true))
                .andExpect(jsonPath("$[0].dayOfWeek").value("TUESDAY"))
                .andExpect(jsonPath("$[0].plannedAt").value(startsWith("2026-10-20T09:00")))
                .andExpect(jsonPath("$[0].exercises", hasSize(5)))
                .andExpect(jsonPath("$[0].exercises[0].name").value("Push-Up"))
                .andExpect(jsonPath("$[0].exercises[0].setCount").isNumber())
                .andExpect(jsonPath("$[6].dayOfWeek").value("MONDAY"));
    }

    @Test
    void regeneratingReplacesOnlyGeneratedPlans() throws Exception {
        mockMvc.perform(post("/api/workout-plans")
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Manual walk","category":"Cardio","durationMinutes":20,
                                 "plannedAt":"2026-10-22T10:00:00","notes":"Keep this one"}
                                """))
                .andExpect(status().isOk());

        for (int run = 0; run < 2; run++) {
            mockMvc.perform(post("/api/workout-plans/generate-week")
                            .header("Authorization", bearer())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"startDate\":\"2026-10-20\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(7)));
        }

        String response = mockMvc.perform(get("/api/workout-plans").header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode plans = objectMapper.readTree(response);
        org.junit.jupiter.api.Assertions.assertEquals(8, plans.size());
        org.junit.jupiter.api.Assertions.assertTrue(plans.findValuesAsText("name").contains("Manual walk"));
    }

    @Test
    void exerciseLibraryFiltersByGoal() throws Exception {
        String response = mockMvc.perform(get("/api/exercises").param("goal", "GAIN_WEIGHT")
                        .header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode exercises = objectMapper.readTree(response);
        org.junit.jupiter.api.Assertions.assertTrue(exercises.size() > 0);
        org.junit.jupiter.api.Assertions.assertTrue(
                exercises.findValuesAsText("name").contains("Goblet Squat"));
        org.junit.jupiter.api.Assertions.assertFalse(
                exercises.findValuesAsText("name").contains("Burpee"));
    }

    @Test
    void exerciseLibraryReturnsTheFullCatalogWithoutAGoal() throws Exception {
        mockMvc.perform(get("/api/exercises").header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(ExerciseCatalog.EXERCISES.size())));
    }

    @Test
    void generatedPlansArePrivateToTheAccount() throws Exception {
        String response = mockMvc.perform(post("/api/workout-plans/generate-week")
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"startDate\":\"2026-10-20\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        long planId = objectMapper.readTree(response).get(0).get("id").asLong();

        String otherEmail = "other-weekly-" + UUID.randomUUID() + "@example.com";
        register(otherEmail, "LOSE_WEIGHT");
        String otherToken = login(otherEmail);

        mockMvc.perform(get("/api/workout-plans").header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(post("/api/workout-plans/{id}/complete", planId)
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void acceptsTheGainWeightGoal() throws Exception {
        String email = "gain-" + UUID.randomUUID() + "@example.com";
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RegisterRequest(
                                "Gain Tester", email, "password123", null, null, 30, null, "GAIN_WEIGHT"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fitnessGoal").value("GAIN_WEIGHT"));
    }

    @Test
    void healthEndpointIsPublic() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));
    }

    private void register(String email, String goal) throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RegisterRequest(
                                "Weekly Tester", email, "password123", null, null, 30, null, goal))))
                .andExpect(status().isCreated());
    }

    private String login(String email) throws Exception {
        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, "password123"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("token").asText();
    }

    private String bearer() {
        return "Bearer " + token;
    }
}
