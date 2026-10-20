package com.fitsync.api.nutrition;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateFoodRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 80) String category,
        @NotNull @DecimalMin("0.0") @Digits(integer = 6, fraction = 2) BigDecimal caloriesPer100g,
        @NotNull @DecimalMin("0.0") @Digits(integer = 5, fraction = 2) BigDecimal proteinPer100g,
        @NotNull @DecimalMin("0.0") @Digits(integer = 5, fraction = 2) BigDecimal carbsPer100g,
        @NotNull @DecimalMin("0.0") @Digits(integer = 5, fraction = 2) BigDecimal fatPer100g) {
}
