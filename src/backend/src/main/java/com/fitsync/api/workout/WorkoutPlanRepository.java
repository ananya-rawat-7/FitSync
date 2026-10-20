package com.fitsync.api.workout;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface WorkoutPlanRepository extends JpaRepository<WorkoutPlan, Long> {

    List<WorkoutPlan> findAllByOwner_EmailOrderByPlannedAtAscPositionInDayAsc(String email);

    Optional<WorkoutPlan> findByIdAndOwner_Email(Long id, String email);

    long countByOwner_EmailAndPlannedAtBetween(String email, LocalDateTime start, LocalDateTime end);

    List<WorkoutPlan> findAllByOwner_EmailAndGeneratedTrueAndPlannedAtBetween(
            String email, LocalDateTime start, LocalDateTime end);

    List<WorkoutPlan> findAllByOwner_EmailAndCompletedTrueAndPlannedAtBetween(
            String email, LocalDateTime start, LocalDateTime end);
}
