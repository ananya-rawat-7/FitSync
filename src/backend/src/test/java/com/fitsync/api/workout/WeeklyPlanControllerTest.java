package com.fitsync.api.workout;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
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

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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

    @Autowired
    private ExerciseRepository exerciseRepository;

    private String token;

    @BeforeEach
    void clearPlansAndAuthenticate() throws Exception {
        sessionRepository.deleteAll();
        planRepository.deleteAll();
        exerciseRepository.deleteAll(exerciseRepository.findAllByOwnerIsNotNull());
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
    void exerciseLibraryReturnsTheFullSeededCatalogWithoutAGoal() throws Exception {
        mockMvc.perform(get("/api/exercises").header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(Math.toIntExact(exerciseRepository.count()))));
    }

    @Test
    void createsCustomExerciseForTheSignedInUserOnly() throws Exception {
        String customName = "Custom Band Pull-Apart " + UUID.randomUUID().toString().substring(0, 8);
        String body = objectMapper.writeValueAsString(Map.of(
                "name", customName,
                "category", "Strength",
                "equipment", "Band",
                "difficulty", "Beginner",
                "setCount", 3,
                "reps", "12-15",
                "restSeconds", 45,
                "instructions", "Pull the band apart with straight arms."));

        mockMvc.perform(post("/api/exercises")
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value(customName))
                .andExpect(jsonPath("$.custom").value(true))
                .andExpect(jsonPath("$.setCount").value(3));

        String ownLibrary = mockMvc.perform(get("/api/exercises").header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        org.junit.jupiter.api.Assertions.assertTrue(
                objectMapper.readTree(ownLibrary).findValuesAsText("name").contains(customName));

        String otherEmail = "other-custom-" + UUID.randomUUID() + "@example.com";
        register(otherEmail, "LOSE_WEIGHT");
        String otherToken = login(otherEmail);
        String otherLibrary = mockMvc.perform(get("/api/exercises")
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        org.junit.jupiter.api.Assertions.assertFalse(
                objectMapper.readTree(otherLibrary).findValuesAsText("name").contains(customName));
    }

    @Test
    void updatesPlanExercisesInSubmittedOrder() throws Exception {
        long pushUpId = exerciseId("Push-Up");
        long rowId = exerciseId("Dumbbell Row");

        ObjectNode plan = objectMapper.createObjectNode();
        plan.put("name", "Ordered session");
        plan.put("category", "Strength");
        plan.put("durationMinutes", 30);
        plan.put("plannedAt", "2026-10-20T09:00:00");
        plan.put("notes", "Test order");
        ArrayNode exercises = plan.putArray("exercises");
        exercises.addObject().put("exerciseId", pushUpId).put("name", "Push-Up")
                .put("category", "Strength").put("setCount", 3).put("reps", "10")
                .put("restSeconds", 60).put("instructions", "Press");
        exercises.addObject().put("exerciseId", rowId).put("name", "Dumbbell Row")
                .put("category", "Strength").put("setCount", 3).put("reps", "10")
                .put("restSeconds", 60).put("instructions", "Pull");

        String created = mockMvc.perform(post("/api/workout-plans")
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(plan)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exercises", hasSize(2)))
                .andReturn().getResponse().getContentAsString();
        long planId = objectMapper.readTree(created).get("id").asLong();

        plan.remove("exercises");
        ArrayNode reversed = plan.putArray("exercises");
        reversed.addObject().put("exerciseId", rowId).put("name", "Dumbbell Row")
                .put("category", "Strength").put("setCount", 4).put("reps", "8")
                .put("restSeconds", 75).put("instructions", "Pull");
        reversed.addObject().put("exerciseId", pushUpId).put("name", "Push-Up")
                .put("category", "Strength").put("setCount", 2).put("reps", "12")
                .put("restSeconds", 45).put("instructions", "Press");

        mockMvc.perform(put("/api/workout-plans/{id}", planId)
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(plan)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exercises[0].name").value("Dumbbell Row"))
                .andExpect(jsonPath("$.exercises[0].exerciseId").value(rowId))
                .andExpect(jsonPath("$.exercises[0].setCount").value(4))
                .andExpect(jsonPath("$.exercises[1].name").value("Push-Up"));
    }

    @Test
    void reordersPlansWithinADay() throws Exception {
        long firstId = createPlan("First session", "2026-10-20T09:00:00");
        long secondId = createPlan("Second session", "2026-10-20T09:00:00");

        mockMvc.perform(put("/api/workout-plans/reorder")
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "date", "2026-10-20",
                                "planIds", List.of(secondId, firstId)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name").value("Second session"))
                .andExpect(jsonPath("$[1].name").value("First session"));

        mockMvc.perform(get("/api/workout-plans").header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Second session"))
                .andExpect(jsonPath("$[0].positionInDay").value(0))
                .andExpect(jsonPath("$[1].name").value("First session"))
                .andExpect(jsonPath("$[1].positionInDay").value(1));
    }

    @Test
    void reorderRejectsAnotherUsersPlan() throws Exception {
        long planId = createPlan("Private order", "2026-10-20T09:00:00");
        String otherEmail = "other-reorder-" + UUID.randomUUID() + "@example.com";
        register(otherEmail, "LOSE_WEIGHT");
        String otherToken = login(otherEmail);

        mockMvc.perform(put("/api/workout-plans/reorder")
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "date", "2026-10-20",
                                "planIds", List.of(planId)))))
                .andExpect(status().isNotFound());
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

    private long exerciseId(String name) {
        return exerciseRepository.findByNameAndOwnerIsNull(name)
                .orElseThrow(() -> new IllegalStateException("Missing seeded exercise: " + name))
                .getId();
    }

    private long createPlan(String name, String plannedAt) throws Exception {
        ObjectNode plan = objectMapper.createObjectNode();
        plan.put("name", name);
        plan.put("category", "Strength");
        plan.put("durationMinutes", 30);
        plan.put("plannedAt", plannedAt);
        plan.put("notes", "");

        String response = mockMvc.perform(post("/api/workout-plans")
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(plan)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
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
