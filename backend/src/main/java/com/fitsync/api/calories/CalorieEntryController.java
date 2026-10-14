package com.fitsync.api.calories;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/calories")
public class CalorieEntryController {

    private final CalorieEntryService service;

    public CalorieEntryController(CalorieEntryService service) {
        this.service = service;
    }

    @GetMapping
    public List<CalorieEntryResponse> findAll(Authentication authentication) {
        return service.findAll(authentication.getName());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CalorieEntryResponse create(
            @Valid @RequestBody CalorieEntryRequest request,
            Authentication authentication) {
        return service.create(request, authentication.getName());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Authentication authentication) {
        service.delete(id, authentication.getName());
    }
}
