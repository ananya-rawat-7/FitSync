package com.fitsync.api.calories;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CalorieEntryRepository extends JpaRepository<CalorieEntry, Long> {

    List<CalorieEntry> findAllByOwner_EmailOrderByConsumedOnDescIdDesc(String email);

    Optional<CalorieEntry> findByIdAndOwner_Email(Long id, String email);
}
