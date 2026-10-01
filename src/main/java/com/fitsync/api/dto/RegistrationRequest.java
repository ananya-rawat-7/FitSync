package com.fitsync.api.dto;

import com.fitsync.model.FitnessGoal;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record RegistrationRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        @Min(1) @Max(120) int age,
        @NotNull @DecimalMin("0.01") @DecimalMax("500.00") BigDecimal weightKg,
        @NotNull @DecimalMin("0.01") @DecimalMax("250.00") BigDecimal heightCm,
        @NotNull FitnessGoal goal,
        @NotBlank @Size(max = 80) String activity,
        @Min(1) @Max(7) int daysPerWeek) {
}