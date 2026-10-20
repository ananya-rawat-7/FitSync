package com.fitsync.api.nutrition;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class FoodLogService {

    private final FoodLogRepository repository;
    private final MealPlanRepository mealPlanRepository;

    public FoodLogService(FoodLogRepository repository, MealPlanRepository mealPlanRepository) {
        this.repository = repository;
        this.mealPlanRepository = mealPlanRepository;
    }

    @Transactional(readOnly = true)
    public List<FoodLogEntryResponse> findAll(String email, LocalDate start, LocalDate end) {
        return repository
                .findAllByOwner_EmailAndLoggedOnBetweenOrderByLoggedOnAscLoggedAtAscIdAsc(email, start, end)
                .stream()
                .map(FoodLogEntryResponse::from)
                .toList();
    }

    public void delete(Long id, String email) {
        FoodLogEntry entry = repository.findByIdAndOwner_Email(id, email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Food log entry not found"));

        Long sourceMealPlanId = entry.getSourceMealPlanId();
        repository.delete(entry);

        if (sourceMealPlanId != null && repository.countBySourceMealPlanId(sourceMealPlanId) == 0) {
            Optional<MealPlan> plan = mealPlanRepository.findByIdAndOwner_Email(sourceMealPlanId, email);
            plan.ifPresent(meal -> {
                meal.setLogged(false);
                meal.setLoggedAt(null);
                mealPlanRepository.save(meal);
            });
        }
    }
}
