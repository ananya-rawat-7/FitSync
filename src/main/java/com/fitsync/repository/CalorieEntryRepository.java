package com.fitsync.repository;

import com.fitsync.model.CalorieEntry;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CalorieEntryRepository extends JpaRepository<CalorieEntry, Long> {
    List<CalorieEntry> findByProfile_IdAndOccurredAtGreaterThanEqualAndOccurredAtLessThanOrderByOccurredAtDesc(
            Long profileId, Instant from, Instant to);
}