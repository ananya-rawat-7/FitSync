package com.fitsync.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CalorieEntryRequest(
        @NotNull @DecimalMin(value = "0.01") @Digits(integer = 6, fraction = 2) BigDecimal calories,
        @Size(max = 120) String note) {
}