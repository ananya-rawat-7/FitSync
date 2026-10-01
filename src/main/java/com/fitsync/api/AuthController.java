package com.fitsync.api;

import com.fitsync.api.dto.DashboardResponse;
import com.fitsync.api.dto.LoginRequest;
import com.fitsync.api.dto.RegistrationRequest;
import com.fitsync.model.UserProfile;
import com.fitsync.repository.UserProfileRepository;
import com.fitsync.service.FitnessService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
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
    private final SecurityContextRepository contextRepository;
    private final FitnessService fitnessService;

    public AuthController(UserProfileRepository profiles, PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager, SecurityContextRepository contextRepository,
            FitnessService fitnessService) {
        this.profiles = profiles;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.contextRepository = contextRepository;
        this.fitnessService = fitnessService;
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of("token", token.getToken());
    }

    @PostMapping("/register")
    public ResponseEntity<DashboardResponse> register(@Valid @RequestBody RegistrationRequest request,
            HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (profiles.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        UserProfile profile = new UserProfile(request.name().trim(), email,
                passwordEncoder.encode(request.password()), request.age(), request.weightKg(), request.heightCm(),
                request.goal(), request.activity().trim(), request.daysPerWeek());
        profiles.save(profile);
        DashboardResponse response = createSession(email, request.password(), servletRequest, servletResponse);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public DashboardResponse login(@Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        return createSession(email, request.password(), servletRequest, servletResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        if (request.getSession(false) != null) {
            request.getSession(false).invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }

    private DashboardResponse createSession(String email, String password,
            HttpServletRequest request, HttpServletResponse response) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password));
        request.getSession(true);
        request.changeSessionId();
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        contextRepository.saveContext(context, request, response);
        return fitnessService.dashboard(email);
    }
}