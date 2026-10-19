package com.fitsync.api.workout;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkoutPlanRepository extends JpaRepository<WorkoutPlan, Long> {

    List<WorkoutPlan> findAllByOwner_EmailOrderByPlannedAtAsc(String email);

    Optional<WorkoutPlan> findByIdAndOwner_Email(Long id, String email);
}
