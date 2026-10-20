package com.fitsync.api.nutrition;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;

import java.time.LocalDate;

public record WaterRequest(
        @NotNull @PastOrPresent LocalDate loggedOn,
        @Min(1) @Max(5000) int milliliters) {
}
