package com.fitsync.api.nutrition;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface FoodLogRepository extends JpaRepository<FoodLogEntry, Long> {

    List<FoodLogEntry> findAllByOwner_EmailAndLoggedOnBetweenOrderByLoggedOnAscLoggedAtAscIdAsc(
            String email, LocalDate start, LocalDate end);

    Optional<FoodLogEntry> findByIdAndOwner_Email(Long id, String email);

    long countBySourceMealPlanId(Long sourceMealPlanId);
}
