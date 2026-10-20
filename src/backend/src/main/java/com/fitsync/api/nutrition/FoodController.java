package com.fitsync.api.nutrition;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/foods")
public class FoodController {

    private final FoodService service;

    public FoodController(FoodService service) {
        this.service = service;
    }

    @GetMapping
    public List<FoodResponse> findAll(Authentication authentication) {
        return service.findAll(authentication.getName());
    }

    @PostMapping
    public ResponseEntity<FoodResponse> create(
            @Valid @RequestBody CreateFoodRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(request, authentication.getName()));
    }
}
