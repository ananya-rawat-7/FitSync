package com.fitsync.api.workout;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkoutTemplateRepository extends JpaRepository<WorkoutTemplate, Long> {

    List<WorkoutTemplate> findAllByGoalOrderByDayIndexAsc(String goal);

    Optional<WorkoutTemplate> findByGoalAndDayIndex(String goal, int dayIndex);
}
