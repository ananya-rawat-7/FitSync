package com.fitsync.api.nutrition;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/meal-plans")
public class MealPlanController {

    private final MealPlanService service;

    public MealPlanController(MealPlanService service) {
        this.service = service;
    }

    @GetMapping
    public List<MealPlan> findAll(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            Authentication authentication) {
        return service.findAll(authentication.getName(), start, end);
    }

    @PostMapping
    public ResponseEntity<MealPlan> create(
            @Valid @RequestBody MealPlanRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(request, authentication.getName()));
    }

    @PutMapping("/{id}")
    public MealPlan update(
            @PathVariable Long id,
            @Valid @RequestBody MealPlanRequest request,
            Authentication authentication) {
        return service.update(id, request, authentication.getName());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        service.delete(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/generate-week")
    public List<MealPlan> generateWeek(
            @RequestBody(required = false) GenerateMealsRequest request,
            Authentication authentication) {
        LocalDate startDate = request == null ? null : request.startDate();
        return service.generateWeek(authentication.getName(), startDate);
    }

    @PostMapping("/{id}/log")
    public List<FoodLogEntryResponse> log(@PathVariable Long id, Authentication authentication) {
        return service.log(id, authentication.getName());
    }

    @PostMapping("/log-day")
    public List<FoodLogEntryResponse> logDay(
            @Valid @RequestBody LogDayRequest request,
            Authentication authentication) {
        return service.logDay(authentication.getName(), request.date());
    }
}
