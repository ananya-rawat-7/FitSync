package com.fitsync.api.dto;

import com.fitsync.model.FitnessGoal;
import java.math.BigDecimal;
import java.time.Instant;

public record ProfileResponse(
        Long id,
        String name,
        String email,
        int age,
        BigDecimal weightKg,
        BigDecimal heightCm,
        FitnessGoal goal,
        String goalLabel,
        String activity,
        int daysPerWeek,
        Instant createdAt,
        BigDecimal bmi,
        String bmiCategory,
        BigDecimal dailyCalorieTarget,
        BigDecimal caloriesConsumed,
        BigDecimal caloriesBurned,
        BigDecimal netCalories,
        BigDecimal remainingCalories,
        boolean overTarget) {
}