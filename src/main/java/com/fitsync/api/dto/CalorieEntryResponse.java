package com.fitsync.api.dto;

import com.fitsync.model.CalorieEntryType;
import java.math.BigDecimal;
import java.time.Instant;

public record CalorieEntryResponse(
        Long id,
        CalorieEntryType type,
        BigDecimal calories,
        String note,
        Instant occurredAt) {
}