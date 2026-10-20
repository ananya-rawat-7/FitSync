package com.fitsync.api.nutrition;

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

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
class NutritionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private FoodRepository foodRepository;

    @Autowired
    private MealPlanRepository mealPlanRepository;

    @Autowired
    private FoodLogRepository foodLogRepository;

    @Autowired
    private WaterRepository waterRepository;

    @Autowired
    private MealTemplateRepository mealTemplateRepository;

    private String token;
    private LocalDate today;

    @BeforeEach
    void clearNutritionDataAndAuthenticate() throws Exception {
        today = LocalDate.now();
        foodLogRepository.deleteAll();
        waterRepository.deleteAll();
        mealPlanRepository.deleteAll();
        foodRepository.deleteAll(foodRepository.findAllByOwnerIsNotNull());

        String email = "nutrition-" + UUID.randomUUID() + "@example.com";
        register(email, "GAIN_WEIGHT");
        token = login(email);
    }

    @Test
    void seededFoodLibraryIncludesMacros() throws Exception {
        mockMvc.perform(get("/api/foods").header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(130)))
                .andExpect(jsonPath("$[0].proteinPer100g").isNumber())
                .andExpect(jsonPath("$[0].carbsPer100g").isNumber())
                .andExpect(jsonPath("$[0].fatPer100g").isNumber());
    }

    @Test
    void createsCustomFoodForOwnerOnly() throws Exception {
        String name = "Custom Protein Bowl " + UUID.randomUUID().toString().substring(0, 6);
        String body = objectMapper.writeValueAsString(Map.of(
                "name", name,
                "category", "Custom foods",
                "caloriesPer100g", 180,
                "proteinPer100g", 12,
                "carbsPer100g", 20,
                "fatPer100g", 6));

        mockMvc.perform(post("/api/foods")
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value(name))
                .andExpect(jsonPath("$.custom").value(true))
                .andExpect(jsonPath("$.proteinPer100g").value(12));

        mockMvc.perform(post("/api/foods")
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict());

        mockMvc.perform(get("/api/foods").header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(131)));

        String otherEmail = "other-food-" + UUID.randomUUID() + "@example.com";
        register(otherEmail, "LOSE_WEIGHT");
        String otherToken = login(otherEmail);
        mockMvc.perform(get("/api/foods").header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(130)));
    }

    @Test
    void generatesAGoalBasedWeek() throws Exception {
        JsonNode meals = generateWeek(today);

        org.junit.jupiter.api.Assertions.assertEquals(21, meals.size());
        MealTemplate expected = mealTemplateRepository
                .findByMenuGroupAndDayIndexAndMealIndex(MenuGroup.MUSCLE_GAIN, 0, 0)
                .orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(expected.getTitle(), meals.get(0).get("title").asText());
        org.junit.jupiter.api.Assertions.assertEquals(today.toString(),
                meals.get(0).get("plannedDate").asText());
        org.junit.jupiter.api.Assertions.assertEquals(0, meals.get(0).get("positionInDay").asInt());
        org.junit.jupiter.api.Assertions.assertTrue(meals.get(0).get("items").size() > 0);
        org.junit.jupiter.api.Assertions.assertTrue(meals.get(0).get("items").get(0).get("protein").isNumber());
    }

    @Test
    void editsAMealAndRecomputesMacros() throws Exception {
        JsonNode meals = generateWeek(today);
        JsonNode meal = meals.get(0);
        long mealId = meal.get("id").asLong();
        long eggId = foodId("Boiled egg");
        long bananaId = foodId("Banana");

        String body = mealBody(today, "Updated breakfast",
                List.of(Map.of("foodId", eggId, "grams", 120),
                        Map.of("foodId", bananaId, "grams", 150)));

        mockMvc.perform(put("/api/meal-plans/{id}", mealId)
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated breakfast"))
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(jsonPath("$.items[0].foodId").value(eggId))
                .andExpect(jsonPath("$.items[0].calories").isNumber())
                .andExpect(jsonPath("$.items[1].name").value("Banana"));
    }

    @Test
    void logsAMealAndRejectsDuplicatesAndFutureMeals() throws Exception {
        JsonNode meals = generateWeek(today);
        long todayMealId = meals.get(0).get("id").asLong();
        long tomorrowMealId = findMeal(meals, today.plusDays(1), 0).get("id").asLong();

        mockMvc.perform(post("/api/meal-plans/{id}/log", todayMealId)
                        .header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(meals.get(0).get("items").size())));

        mockMvc.perform(get("/api/meal-plans")
                        .param("start", today.toString())
                        .param("end", today.plusDays(6).toString())
                        .header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].logged").value(true));

        mockMvc.perform(get("/api/food-log")
                        .param("start", today.toString())
                        .param("end", today.toString())
                        .header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(meals.get(0).get("items").size())));

        mockMvc.perform(post("/api/meal-plans/{id}/log", todayMealId)
                        .header("Authorization", bearer()))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/meal-plans/{id}/log", tomorrowMealId)
                        .header("Authorization", bearer()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void bulkLogsAllMealsForADay() throws Exception {
        generateWeek(today);

        mockMvc.perform(post("/api/meal-plans/log-day")
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("date", today.toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        JsonNode meals = getMeals(today, today);
        org.junit.jupiter.api.Assertions.assertEquals(3, meals.size());
        for (JsonNode meal : meals) {
            org.junit.jupiter.api.Assertions.assertTrue(meal.get("logged").asBoolean());
        }

        mockMvc.perform(post("/api/meal-plans/log-day")
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("date", today.toString()))))
                .andExpect(status().isConflict());
    }

    @Test
    void regeneratingPreservesLoggedAndManualMeals() throws Exception {
        JsonNode meals = generateWeek(today);
        JsonNode breakfast = findMeal(meals, today, 0);
        JsonNode lunch = findMeal(meals, today, 1);
        long breakfastId = breakfast.get("id").asLong();
        long lunchId = lunch.get("id").asLong();

        mockMvc.perform(post("/api/meal-plans/{id}/log", breakfastId)
                        .header("Authorization", bearer()))
                .andExpect(status().isOk());
        mockMvc.perform(delete("/api/meal-plans/{id}", lunchId)
                        .header("Authorization", bearer()))
                .andExpect(status().isNoContent());

        long eggId = foodId("Boiled egg");
        String manualBody = mealBody(today, "Manual lunch",
                List.of(Map.of("foodId", eggId, "grams", 150)));
        String manualResponse = mockMvc.perform(post("/api/meal-plans")
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(manualBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long manualLunchId = objectMapper.readTree(manualResponse).get("id").asLong();

        generateWeek(today);

        JsonNode todayMeals = getMeals(today, today);
        org.junit.jupiter.api.Assertions.assertEquals(2, todayMeals.size());
        boolean breakfastPresent = false;
        boolean manualLunchPresent = false;
        for (JsonNode meal : todayMeals) {
            if (meal.get("id").asLong() == breakfastId) {
                breakfastPresent = true;
                org.junit.jupiter.api.Assertions.assertTrue(meal.get("logged").asBoolean());
            }
            if (meal.get("id").asLong() == manualLunchId) {
                manualLunchPresent = true;
                org.junit.jupiter.api.Assertions.assertEquals("Manual lunch", meal.get("title").asText());
            }
        }
        org.junit.jupiter.api.Assertions.assertTrue(breakfastPresent);
        org.junit.jupiter.api.Assertions.assertTrue(manualLunchPresent);
    }

    @Test
    void deletingTheLastDiaryEntryUnlogsTheMeal() throws Exception {
        JsonNode meals = generateWeek(today);
        JsonNode breakfast = findMeal(meals, today, 0);
        long breakfastId = breakfast.get("id").asLong();

        mockMvc.perform(post("/api/meal-plans/{id}/log", breakfastId)
                        .header("Authorization", bearer()))
                .andExpect(status().isOk());

        String logResponse = mockMvc.perform(get("/api/food-log")
                        .param("start", today.toString())
                        .param("end", today.toString())
                        .header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        List<Long> logIds = new ArrayList<>();
        for (JsonNode entry : objectMapper.readTree(logResponse)) {
            if (entry.get("sourceMealPlanId").asLong() == breakfastId) {
                logIds.add(entry.get("id").asLong());
            }
        }
        org.junit.jupiter.api.Assertions.assertFalse(logIds.isEmpty());

        for (Long logId : logIds) {
            mockMvc.perform(delete("/api/food-log/{id}", logId)
                            .header("Authorization", bearer()))
                    .andExpect(status().isNoContent());
        }

        MealPlan plan = mealPlanRepository.findById(breakfastId).orElseThrow();
        org.junit.jupiter.api.Assertions.assertFalse(plan.isLogged());
        org.junit.jupiter.api.Assertions.assertNull(plan.getLoggedAt());
    }

    @Test
    void tracksWaterAndRejectsFutureEntries() throws Exception {
        mockMvc.perform(post("/api/water")
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "loggedOn", today.toString(), "milliliters", 250))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.milliliters").value(250));

        String response = mockMvc.perform(post("/api/water")
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "loggedOn", today.toString(), "milliliters", 500))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long waterId = objectMapper.readTree(response).get("id").asLong();

        mockMvc.perform(get("/api/water")
                        .param("start", today.toString())
                        .param("end", today.toString())
                        .header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        mockMvc.perform(delete("/api/water/{id}", waterId)
                        .header("Authorization", bearer()))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/water")
                        .param("start", today.toString())
                        .param("end", today.toString())
                        .header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(post("/api/water")
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "loggedOn", today.plusDays(1).toString(), "milliliters", 250))))
                .andExpect(status().isBadRequest());

        String otherEmail = "other-water-" + UUID.randomUUID() + "@example.com";
        register(otherEmail, "LOSE_WEIGHT");
        String otherToken = login(otherEmail);
        mockMvc.perform(get("/api/water")
                        .param("start", today.toString())
                        .param("end", today.toString())
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void mealPlansAndDiaryArePrivateToTheOwner() throws Exception {
        JsonNode meals = generateWeek(today);
        long mealId = meals.get(0).get("id").asLong();

        String otherEmail = "other-meals-" + UUID.randomUUID() + "@example.com";
        register(otherEmail, "LOSE_WEIGHT");
        String otherToken = login(otherEmail);

        mockMvc.perform(get("/api/meal-plans")
                        .param("start", today.toString())
                        .param("end", today.plusDays(6).toString())
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(post("/api/meal-plans/{id}/log", mealId)
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/food-log")
                        .param("start", today.toString())
                        .param("end", today.toString())
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    private JsonNode generateWeek(LocalDate start) throws Exception {
        String response = mockMvc.perform(post("/api/meal-plans/generate-week")
                        .header("Authorization", bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("startDate", start.toString()))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response);
    }

    private JsonNode getMeals(LocalDate start, LocalDate end) throws Exception {
        String response = mockMvc.perform(get("/api/meal-plans")
                        .param("start", start.toString())
                        .param("end", end.toString())
                        .header("Authorization", bearer()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response);
    }

    private JsonNode findMeal(JsonNode meals, LocalDate date, int position) {
        for (JsonNode meal : meals) {
            if (meal.get("plannedDate").asText().equals(date.toString())
                    && meal.get("positionInDay").asInt() == position) {
                return meal;
            }
        }
        throw new IllegalStateException("Meal not found: " + date + " position " + position);
    }

    private String mealBody(LocalDate date, String title, List<Map<String, Object>> items)
            throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "plannedDate", date.toString(),
                "title", title,
                "notes", "",
                "items", items));
    }

    private long foodId(String name) {
        return foodRepository.findByNameAndOwnerIsNull(name)
                .orElseThrow(() -> new IllegalStateException("Missing seeded food: " + name))
                .getId();
    }

    private void register(String email, String goal) throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RegisterRequest(
                                "Nutrition Tester", email, "password123", null, null, 30, null, goal))))
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
