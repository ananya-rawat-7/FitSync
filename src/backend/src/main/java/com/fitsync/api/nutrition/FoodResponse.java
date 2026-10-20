package com.fitsync.api.nutrition;

import java.math.BigDecimal;

public record FoodResponse(
        Long id,
        String name,
        String category,
        BigDecimal caloriesPer100g,
        BigDecimal proteinPer100g,
        BigDecimal carbsPer100g,
        BigDecimal fatPer100g,
        boolean custom) {

    public static FoodResponse from(Food food) {
        return new FoodResponse(
                food.getId(),
                food.getName(),
                food.getCategory(),
                food.getCaloriesPer100g(),
                food.getProteinPer100g(),
                food.getCarbsPer100g(),
                food.getFatPer100g(),
                food.getOwner() != null);
    }
}
