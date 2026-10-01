package com.fitsync.service;

import com.fitsync.model.FitnessGoal;
import java.math.BigDecimal;
import java.math.RoundingMode;

public final class FitnessCalculator {

    private static final BigDecimal MINIMUM_CALORIE_TARGET = new BigDecimal("1200");

    private FitnessCalculator() {
    }

    public static BigDecimal calculateBmi(BigDecimal weightKg, BigDecimal heightCm) {
        BigDecimal heightMeters = heightCm.movePointLeft(2);
        return weightKg.divide(heightMeters.multiply(heightMeters), 2, RoundingMode.HALF_UP);
    }

    public static String bmiCategory(BigDecimal bmi) {
        if (bmi.compareTo(new BigDecimal("18.5")) < 0) return "Underweight";
        if (bmi.compareTo(new BigDecimal("25")) < 0) return "Normal weight";
        if (bmi.compareTo(new BigDecimal("30")) < 0) return "Overweight";
        return "Obese";
    }

    public static BigDecimal dailyCalorieTarget(BigDecimal weightKg, FitnessGoal goal) {
        BigDecimal target = weightKg.multiply(new BigDecimal("24"))
                .add(BigDecimal.valueOf(goal.getCalorieAdjustment()));
        return target.max(MINIMUM_CALORIE_TARGET).setScale(2, RoundingMode.HALF_UP);
    }
}