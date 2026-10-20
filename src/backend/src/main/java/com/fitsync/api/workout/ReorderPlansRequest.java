package com.fitsync.api.workout;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record ReorderPlansRequest(
        @NotNull LocalDate date,
        @NotEmpty List<Long> planIds) {
}
