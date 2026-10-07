package com.fitsync.api.workout;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession, Long> {

    List<WorkoutSession> findAllByOwner_EmailOrderByPerformedAtDesc(String email);

    java.util.Optional<WorkoutSession> findByIdAndOwner_Email(Long id, String email);
}
