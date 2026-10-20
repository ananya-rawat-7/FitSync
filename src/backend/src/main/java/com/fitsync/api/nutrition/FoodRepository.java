package com.fitsync.api.nutrition;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FoodRepository extends JpaRepository<Food, Long> {

    List<Food> findAllByOwnerIsNullOrderByNameAsc();

    List<Food> findAllByOwner_EmailOrderByNameAsc(String email);

    Optional<Food> findByNameAndOwnerIsNull(String name);

    boolean existsByNameAndOwner_Email(String name, String email);

    List<Food> findAllByOwnerIsNotNull();
}
