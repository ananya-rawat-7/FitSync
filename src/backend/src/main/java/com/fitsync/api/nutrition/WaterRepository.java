package com.fitsync.api.nutrition;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WaterRepository extends JpaRepository<WaterEntry, Long> {

    List<WaterEntry> findAllByOwner_EmailAndLoggedOnBetweenOrderByLoggedOnAscLoggedAtAscIdAsc(
            String email, LocalDate start, LocalDate end);

    Optional<WaterEntry> findByIdAndOwner_Email(Long id, String email);
}
