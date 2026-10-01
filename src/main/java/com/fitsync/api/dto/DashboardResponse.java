package com.fitsync.api.dto;

import java.util.List;

public record DashboardResponse(ProfileResponse profile, List<CalorieEntryResponse> entries) {
}