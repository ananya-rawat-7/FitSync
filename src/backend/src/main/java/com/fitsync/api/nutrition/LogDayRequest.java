package com.fitsync.api.nutrition;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record LogDayRequest(@NotNull LocalDate date) {
}
