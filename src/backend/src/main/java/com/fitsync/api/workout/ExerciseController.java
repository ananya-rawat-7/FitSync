package com.fitsync.api.workout;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/exercises")
public class ExerciseController {

    private final ExerciseService service;

    public ExerciseController(ExerciseService service) {
        this.service = service;
    }

    @GetMapping
    public List<ExerciseResponse> findAll(
            @RequestParam(required = false) String goal,
            Authentication authentication) {
        return service.findAll(authentication.getName(), goal);
    }

    @PostMapping
    public ResponseEntity<ExerciseResponse> create(
            @Valid @RequestBody CreateExerciseRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(request, authentication.getName()));
    }
}
