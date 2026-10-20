package com.fitsync.api.workout;

import java.util.Set;

public final class WorkoutGoals {

    public static final String DEFAULT = "MAINTAIN_FITNESS";

    public static final Set<String> ALL = Set.of(
            "BUILD_STRENGTH", "LOSE_WEIGHT", "GAIN_WEIGHT", "IMPROVE_ENDURANCE",
            "IMPROVE_FLEXIBILITY", "MAINTAIN_FITNESS", "OTHER");

    private WorkoutGoals() {
    }

    public static String normalize(String goal) {
        if (goal == null || goal.isBlank() || !ALL.contains(goal)) {
            return DEFAULT;
        }
        return goal;
    }
}
