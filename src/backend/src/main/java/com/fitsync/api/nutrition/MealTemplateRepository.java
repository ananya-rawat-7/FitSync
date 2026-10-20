package com.fitsync.api.nutrition;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MealTemplateRepository extends JpaRepository<MealTemplate, Long> {

    List<MealTemplate> findAllByMenuGroup(MenuGroup menuGroup);

    Optional<MealTemplate> findByMenuGroupAndDayIndexAndMealSlot(
            MenuGroup menuGroup, int dayIndex, MealSlot mealSlot);
}
