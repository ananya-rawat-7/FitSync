package com.fitsync.api.calories;

import java.time.LocalDate;

public record CalorieEntryResponse(Long id, String foodName, MealType mealType,
                                   int calories, LocalDate consumedOn) {

    public static CalorieEntryResponse from(CalorieEntry entry) {
        return new CalorieEntryResponse(entry.getId(), entry.getFoodName(), entry.getMealType(),
                entry.getCalories(), entry.getConsumedOn());
    }
}
