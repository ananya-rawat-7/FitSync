package com.fitsync.api.nutrition;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record WaterResponse(Long id, LocalDate loggedOn, int milliliters, LocalDateTime loggedAt) {

    public static WaterResponse from(WaterEntry entry) {
        return new WaterResponse(entry.getId(), entry.getLoggedOn(), entry.getMilliliters(), entry.getLoggedAt());
    }
}
