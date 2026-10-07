package com.fitsync.service;

import com.fitsync.api.dto.CalorieEntryRequest;
import com.fitsync.api.dto.CalorieEntryResponse;
import com.fitsync.api.dto.DashboardResponse;
import com.fitsync.api.dto.ProfileResponse;
import com.fitsync.model.CalorieEntry;
import com.fitsync.model.CalorieEntryType;
import com.fitsync.model.UserProfile;
import com.fitsync.repository.CalorieEntryRepository;
import com.fitsync.repository.UserProfileRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FitnessService {

    private final UserProfileRepository profiles;
    private final CalorieEntryRepository entries;

    public FitnessService(UserProfileRepository profiles, CalorieEntryRepository entries) {
        this.profiles = profiles;
        this.entries = entries;
    }

    @Transactional(readOnly = true)
    public DashboardResponse dashboard(String email) {
        UserProfile profile = findProfile(email);
        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(zone);
        Instant start = today.atStartOfDay(zone).toInstant();
        Instant end = today.plusDays(1).atStartOfDay(zone).toInstant();
        List<CalorieEntry> todayEntries = entries
                .findByProfile_IdAndOccurredAtGreaterThanEqualAndOccurredAtLessThanOrderByOccurredAtDesc(
                        profile.getId(), start, end);

        BigDecimal consumed = sumCalories(todayEntries, CalorieEntryType.FOOD);
        BigDecimal burned = sumCalories(todayEntries, CalorieEntryType.ACTIVITY);
        BigDecimal net = consumed.subtract(burned).setScale(2, RoundingMode.HALF_UP);
        BigDecimal target = FitnessCalculator.dailyCalorieTarget(profile.getWeightKg(), profile.getGoal());
        BigDecimal remaining = target.subtract(net).setScale(2, RoundingMode.HALF_UP);
        BigDecimal bmi = FitnessCalculator.calculateBmi(profile.getWeightKg(), profile.getHeightCm());

        ProfileResponse response = new ProfileResponse(
                profile.getId(), profile.getName(), profile.getEmail(), profile.getAge(),
                profile.getWeightKg(), profile.getHeightCm(), profile.getGoal(), profile.getGoal().getLabel(),
                profile.getActivity(), profile.getDaysPerWeek(), profile.getCreatedAt(), bmi,
                FitnessCalculator.bmiCategory(bmi), target, consumed, burned, net, remaining,
                remaining.signum() < 0);
        List<CalorieEntryResponse> entryResponses = todayEntries.stream()
                .map(entry -> new CalorieEntryResponse(entry.getId(), entry.getType(), entry.getCalories(),
                        entry.getNote(), entry.getOccurredAt()))
                .toList();
        return new DashboardResponse(response, entryResponses);
    }

    @Transactional
    public DashboardResponse addEntry(String email, CalorieEntryType type, CalorieEntryRequest request) {
        UserProfile profile = findProfile(email);
        String note = request.note() == null || request.note().isBlank() ? null : request.note().trim();
        entries.save(new CalorieEntry(profile, type, request.calories(), note));
        return dashboard(email);
    }

    private UserProfile findProfile(String email) {
        return profiles.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
    }

    private BigDecimal sumCalories(List<CalorieEntry> entries, CalorieEntryType type) {
        return entries.stream()
                .filter(entry -> entry.getType() == type)
                .map(CalorieEntry::getCalories)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }
}