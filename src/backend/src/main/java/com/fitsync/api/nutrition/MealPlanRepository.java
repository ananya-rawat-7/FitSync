package com.fitsync.api.nutrition;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MealPlanRepository extends JpaRepository<MealPlan, Long> {

    @Query("select distinct m from MealPlan m left join fetch m.items "
            + "where m.owner.email = :email and m.plannedDate between :start and :end "
            + "order by m.plannedDate asc")
    List<MealPlan> findForRange(@Param("email") String email,
                                @Param("start") LocalDate start,
                                @Param("end") LocalDate end);

    Optional<MealPlan> findByIdAndOwner_Email(Long id, String email);

    Optional<MealPlan> findByOwner_EmailAndPlannedDateAndMealSlot(
            String email, LocalDate plannedDate, MealSlot mealSlot);

    boolean existsByOwner_EmailAndPlannedDateAndMealSlot(
            String email, LocalDate plannedDate, MealSlot mealSlot);

    List<MealPlan> findAllByOwner_EmailAndGeneratedTrueAndLoggedFalseAndPlannedDateBetween(
            String email, LocalDate start, LocalDate end);

    List<MealPlan> findAllByOwner_EmailAndPlannedDateAndLoggedFalse(
            String email, LocalDate plannedDate);
}
