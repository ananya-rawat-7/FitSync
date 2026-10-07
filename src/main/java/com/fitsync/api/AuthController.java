package com.fitsync.api;

import com.fitsync.api.dto.DashboardResponse;
import com.fitsync.api.dto.AuthResponse;
import com.fitsync.api.dto.LoginRequest;
import com.fitsync.api.dto.RegistrationRequest;
import com.fitsync.model.UserProfile;
import com.fitsync.repository.UserProfileRepository;
import com.fitsync.security.JwtService;
import com.fitsync.service.FitnessService;
import jakarta.validation.Valid;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserProfileRepository profiles;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final FitnessService fitnessService;

    public AuthController(UserProfileRepository profiles, PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager, JwtService jwtService, FitnessService fitnessService) {
        this.profiles = profiles;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.fitnessService = fitnessService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegistrationRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (profiles.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        UserProfile profile = new UserProfile(request.name().trim(), email,
                passwordEncoder.encode(request.password()), request.age(), request.weightKg(), request.heightCm(),
                request.goal(), request.activity().trim(), request.daysPerWeek());
        profiles.save(profile);
        AuthResponse response = authenticate(email, request.password());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        return authenticate(email, request.password());
    }

    private AuthResponse authenticate(String email, String password) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password));
        JwtService.IssuedToken token = jwtService.issueToken(authentication.getName());
        DashboardResponse dashboard = fitnessService.dashboard(authentication.getName());
        return new AuthResponse(token.value(), "Bearer", token.expiresAt(), dashboard);
    }
}