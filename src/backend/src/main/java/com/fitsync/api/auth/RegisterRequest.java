package com.fitsync.api.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record RegisterRequest(
        @NotBlank @Size(max = 80) String displayName,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        @DecimalMin("0.1") @DecimalMax("500") BigDecimal weightKg,
        @DecimalMin("0.1") @DecimalMax("300") BigDecimal heightCm,
        @Min(13) @Max(120) Integer age,
        @Pattern(regexp = "^(|FEMALE|MALE|NON_BINARY|SELF_DESCRIBED|PREFER_NOT_TO_SAY)$") String gender,
        @Pattern(regexp = "^(|BUILD_STRENGTH|LOSE_WEIGHT|IMPROVE_ENDURANCE|IMPROVE_FLEXIBILITY|MAINTAIN_FITNESS|OTHER)$") String fitnessGoal) {

    public RegisterRequest(String displayName, String email, String password) {
        this(displayName, email, password, null, null, null, null, null);
    }
}
