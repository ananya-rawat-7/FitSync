package com.fitsync.api.calories;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CalorieEntryRequest(
        @NotBlank @Size(max = 100) String foodName,
        @NotNull MealType mealType,
        @Min(1) @Max(10000) int calories,
        @NotNull @PastOrPresent LocalDate consumedOn) {
}
