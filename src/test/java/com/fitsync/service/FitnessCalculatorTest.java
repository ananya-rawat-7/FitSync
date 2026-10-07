package com.fitsync.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.fitsync.model.FitnessGoal;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class FitnessCalculatorTest {

    @Test
    void calculatesBmiFromCentimeters() {
        BigDecimal bmi = FitnessCalculator.calculateBmi(
                new BigDecimal("68.4"), new BigDecimal("172.5"));

        assertEquals(new BigDecimal("22.99"), bmi);
        assertEquals("Normal weight", FitnessCalculator.bmiCategory(bmi));
    }

    @Test
    void adjustsDailyTargetForWeightGoals() {
        BigDecimal weight = new BigDecimal("70");

        assertEquals(new BigDecimal("1280.00"),
                FitnessCalculator.dailyCalorieTarget(weight, FitnessGoal.WEIGHT_LOSS));
        assertEquals(new BigDecimal("2080.00"),
                FitnessCalculator.dailyCalorieTarget(weight, FitnessGoal.WEIGHT_GAIN));
        assertEquals(new BigDecimal("1680.00"),
                FitnessCalculator.dailyCalorieTarget(weight, FitnessGoal.MAINTAIN_WEIGHT));
    }

    @Test
    void appliesMinimumDailyTarget() {
        assertEquals(new BigDecimal("1200.00"),
                FitnessCalculator.dailyCalorieTarget(new BigDecimal("50"), FitnessGoal.WEIGHT_LOSS));
    }
}