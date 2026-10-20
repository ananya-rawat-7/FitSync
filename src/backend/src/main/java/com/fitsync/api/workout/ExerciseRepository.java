package com.fitsync.api.workout;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExerciseRepository extends JpaRepository<Exercise, Long> {

    List<Exercise> findAllByOwnerIsNullOrderByNameAsc();

    List<Exercise> findAllByOwner_EmailOrderByNameAsc(String email);

    Optional<Exercise> findByNameAndOwnerIsNull(String name);

    boolean existsByNameAndOwner_Email(String name, String email);

    List<Exercise> findAllByOwnerIsNotNull();
}
