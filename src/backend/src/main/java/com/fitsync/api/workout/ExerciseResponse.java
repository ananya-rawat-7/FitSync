package com.fitsync.api.workout;

import java.util.Set;

public record ExerciseResponse(
        Long id,
        String name,
        String category,
        String equipment,
        String difficulty,
        Integer setCount,
        String reps,
        Integer restSeconds,
        String instructions,
        Set<String> goals,
        boolean custom) {

    public static ExerciseResponse from(Exercise exercise) {
        return new ExerciseResponse(
                exercise.getId(),
                exercise.getName(),
                exercise.getCategory(),
                exercise.getEquipment(),
                exercise.getDifficulty(),
                exercise.getDefaultSetCount(),
                exercise.getDefaultReps(),
                exercise.getDefaultRestSeconds(),
                exercise.getInstructions(),
                Set.copyOf(exercise.getGoals()),
                exercise.getOwner() != null);
    }
}
