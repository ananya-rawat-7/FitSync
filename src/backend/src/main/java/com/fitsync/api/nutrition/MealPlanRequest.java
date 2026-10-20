package com.fitsync.api.nutrition;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record MealPlanRequest(
        @NotNull LocalDate plannedDate,
        @NotBlank @Size(max = 120) String title,
        @Size(max = 500) String notes,
        @NotEmpty List<@Valid MealPlanItemRequest> items) {
}
