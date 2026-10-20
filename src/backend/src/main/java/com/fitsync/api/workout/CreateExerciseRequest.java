package com.fitsync.api.workout;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record CreateExerciseRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 50) String category,
        @Size(max = 80) String equipment,
        @Size(max = 30) String difficulty,
        @Min(0) @Max(50) Integer setCount,
        @Size(max = 32) String reps,
        @Min(0) @Max(600) Integer restSeconds,
        @Size(max = 500) String instructions,
        Set<String> goals) {
}
