package com.fitsync.api.nutrition;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record MealPlanItemRequest(
        @NotNull Long foodId,
        @NotNull @DecimalMin("0.1") @DecimalMax("10000.0")
        @Digits(integer = 5, fraction = 2) BigDecimal grams) {
}
