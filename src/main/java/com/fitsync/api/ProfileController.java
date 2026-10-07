package com.fitsync.api;

import com.fitsync.api.dto.DashboardResponse;
import com.fitsync.service.FitnessService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ProfileController {

    private final FitnessService fitnessService;

    public ProfileController(FitnessService fitnessService) {
        this.fitnessService = fitnessService;
    }

    @GetMapping("/profile")
    public DashboardResponse profile(Authentication authentication) {
        return fitnessService.dashboard(authentication.getName());
    }

    @GetMapping("/dashboard")
    public DashboardResponse dashboard(Authentication authentication) {
        return fitnessService.dashboard(authentication.getName());
    }
}