package com.fitsync.api.workout;

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

import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
class WorkoutSessionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private WorkoutSessionRepository repository;

    private String token;

    @BeforeEach
    void clearSessionsAndAuthenticate() throws Exception {
        repository.deleteAll();
        String email = "workout-" + UUID.randomUUID() + "@example.com";
        register(email);
        token = login(email);
    }

    @Test
    void supportsWorkoutSessionCrud() throws Exception {
        WorkoutSession request = session("Full Body", "Strength", 30);

        String response = mockMvc.perform(post("/api/workouts")
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Full Body"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        long id = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(get("/api/workouts").header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
        mockMvc.perform(get("/api/workouts/{id}", id).header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category").value("Strength"));

        WorkoutSession updated = session("Easy Run", "Cardio", 25);
        mockMvc.perform(put("/api/workouts/{id}", id)
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Easy Run"))
                .andExpect(jsonPath("$.durationMinutes").value(25));

        mockMvc.perform(delete("/api/workouts/{id}", id).header("Authorization", bearer()))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/workouts").header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void rejectsInvalidWorkoutSessions() throws Exception {
        WorkoutSession request = session("", "Strength", 0);

        mockMvc.perform(post("/api/workouts")
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
        org.junit.jupiter.api.Assertions.assertTrue(repository.findAll().isEmpty());
    }

    @Test
    void returnsNotFoundForMissingSession() throws Exception {
        mockMvc.perform(get("/api/workouts/{id}", 999L).header("Authorization", bearer()))
                .andExpect(status().isNotFound());
    }

    @Test
    void rejectsWorkoutRequestsWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/workouts"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void usersCannotAccessAnotherUsersWorkout() throws Exception {
        String response = mockMvc.perform(post("/api/workouts")
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(session("Private run", "Cardio", 20))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = objectMapper.readTree(response).get("id").asLong();
        String otherEmail = "other-" + UUID.randomUUID() + "@example.com";
        register(otherEmail);
        String otherToken = login(otherEmail);

        mockMvc.perform(get("/api/workouts/{id}", id).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/workouts/{id}", id)
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(session("Changed", "Cardio", 20))))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/workouts/{id}", id).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());
    }

    private void register(String email) throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RegisterRequest("Workout Tester", email, "password123"))))
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

    private WorkoutSession session(String name, String category, int duration) {
        WorkoutSession session = new WorkoutSession();
        session.setName(name);
        session.setCategory(category);
        session.setDurationMinutes(duration);
        session.setPerformedAt(LocalDateTime.of(2026, 10, 7, 12, 0));
        session.setNotes("Test session");
        return session;
    }
}
