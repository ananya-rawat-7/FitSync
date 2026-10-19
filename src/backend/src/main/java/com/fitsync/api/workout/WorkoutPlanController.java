package com.fitsync.api.workout;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/workout-plans")
public class WorkoutPlanController {

    private final WorkoutPlanService service;

    public WorkoutPlanController(WorkoutPlanService service) {
        this.service = service;
    }

    @GetMapping
    public List<WorkoutPlan> findAll(Authentication authentication) {
        return service.findAll(authentication.getName());
    }

    @PostMapping
    public ResponseEntity<WorkoutPlan> create(
            @Valid @RequestBody WorkoutPlan plan,
            Authentication authentication) {
        return ResponseEntity.ok(service.create(plan, authentication.getName()));
    }

    @PostMapping("/generate-week")
    public List<WorkoutPlan> generateWeek(
            @RequestBody(required = false) GenerateWeekRequest request,
            Authentication authentication) {
        LocalDate startDate = request == null ? null : request.startDate();
        return service.generateWeek(authentication.getName(), startDate);
    }

    @PutMapping("/{id}")
    public WorkoutPlan update(
            @PathVariable Long id,
            @Valid @RequestBody WorkoutPlan plan,
            Authentication authentication) {
        return service.update(id, plan, authentication.getName());
    }

    @PostMapping("/{id}/complete")
    public WorkoutSession complete(@PathVariable Long id, Authentication authentication) {
        return service.complete(id, authentication.getName());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        service.delete(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
