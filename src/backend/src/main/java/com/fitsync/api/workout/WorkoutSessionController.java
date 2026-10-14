package com.fitsync.api.workout;

import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/workouts")
public class WorkoutSessionController {

    private final WorkoutSessionService service;

    public WorkoutSessionController(WorkoutSessionService service) {
        this.service = service;
    }

    @GetMapping
    public List<WorkoutSession> findAll(Authentication authentication) {
        return service.findAll(authentication.getName());
    }

    @GetMapping("/{id}")
    public WorkoutSession findById(@PathVariable Long id, Authentication authentication) {
        return service.findById(id, authentication.getName());
    }

    @PostMapping
    public ResponseEntity<WorkoutSession> create(@Valid @RequestBody WorkoutSession session, Authentication authentication) {
        WorkoutSession created = service.create(session, authentication.getName());
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    public WorkoutSession update(@PathVariable Long id, @Valid @RequestBody WorkoutSession session, Authentication authentication) {
        return service.update(id, session, authentication.getName());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        service.delete(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
