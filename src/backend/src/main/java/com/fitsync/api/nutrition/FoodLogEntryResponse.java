package com.fitsync.api.nutrition;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record FoodLogEntryResponse(
        Long id,
        LocalDate loggedOn,
        MealSlot mealSlot,
        String name,
        BigDecimal grams,
        BigDecimal calories,
        BigDecimal protein,
        BigDecimal carbs,
        BigDecimal fat,
        Long sourceMealPlanId,
        LocalDateTime loggedAt) {

    public static FoodLogEntryResponse from(FoodLogEntry entry) {
        return new FoodLogEntryResponse(
                entry.getId(),
                entry.getLoggedOn(),
                entry.getMealSlot(),
                entry.getName(),
                entry.getGrams(),
                entry.getCalories(),
                entry.getProtein(),
                entry.getCarbs(),
                entry.getFat(),
                entry.getSourceMealPlanId(),
                entry.getLoggedAt());
    }
}
