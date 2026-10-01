package com.fitsync.model;

public enum FitnessGoal {
    WEIGHT_LOSS("Weight Loss", -400),
    WEIGHT_GAIN("Weight Gain", 400),
    MAINTAIN_WEIGHT("Maintain Weight", 0),
    BUILD_STRENGTH("Build Strength", 0),
    IMPROVE_ENDURANCE("Improve Endurance", 0),
    MOVE_MORE_OFTEN("Move More Often", 0),
    SUPPORT_FLEXIBILITY("Support Flexibility", 0),
    FEEL_HEALTHIER("Feel Healthier", 0);

    private final String label;
    private final int calorieAdjustment;

    FitnessGoal(String label, int calorieAdjustment) {
        this.label = label;
        this.calorieAdjustment = calorieAdjustment;
    }

    public String getLabel() {
        return label;
    }

    public int getCalorieAdjustment() {
        return calorieAdjustment;
    }
}