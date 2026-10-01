package com.fitsync.api;

import com.fitsync.api.dto.CalorieEntryRequest;
import com.fitsync.api.dto.DashboardResponse;
import com.fitsync.model.CalorieEntryType;
import com.fitsync.service.FitnessService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class CalorieController {

    private final FitnessService fitnessService;

    public CalorieController(FitnessService fitnessService) {
        this.fitnessService = fitnessService;
    }

    @PostMapping("/food-entries")
    public DashboardResponse addFood(@Valid @RequestBody CalorieEntryRequest request, Authentication authentication) {
        return fitnessService.addEntry(authentication.getName(), CalorieEntryType.FOOD, request);
    }

    @PostMapping("/activity-entries")
    public DashboardResponse addActivity(@Valid @RequestBody CalorieEntryRequest request, Authentication authentication) {
        return fitnessService.addEntry(authentication.getName(), CalorieEntryType.ACTIVITY, request);
    }
}