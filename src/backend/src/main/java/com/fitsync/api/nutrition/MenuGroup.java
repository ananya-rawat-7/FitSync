package com.fitsync.api.nutrition;

public enum MenuGroup {
    FAT_LOSS,
    MUSCLE_GAIN,
    ENDURANCE,
    BALANCED;

    public static MenuGroup forGoal(String goal) {
        if (goal == null || goal.isBlank()) {
            return BALANCED;
        }
        return switch (goal) {
            case "LOSE_WEIGHT" -> FAT_LOSS;
            case "GAIN_WEIGHT", "BUILD_STRENGTH" -> MUSCLE_GAIN;
            case "IMPROVE_ENDURANCE" -> ENDURANCE;
            default -> BALANCED;
        };
    }
}
