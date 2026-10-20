package com.fitsync.api.workout;

import com.fitsync.api.auth.UserAccount;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
public class WeeklyPlanGenerator {

    private final WorkoutTemplateRepository templateRepository;

    public WeeklyPlanGenerator(WorkoutTemplateRepository templateRepository) {
        this.templateRepository = templateRepository;
    }

    public List<WorkoutPlan> build(UserAccount owner, LocalDate startDate) {
        String goal = WorkoutGoals.normalize(owner.getFitnessGoal());
        List<WorkoutTemplate> templates = templateRepository.findAllByGoalOrderByDayIndexAsc(goal);
        if (templates.isEmpty() && !WorkoutGoals.DEFAULT.equals(goal)) {
            goal = WorkoutGoals.DEFAULT;
            templates = templateRepository.findAllByGoalOrderByDayIndexAsc(goal);
        }
        if (templates.isEmpty()) {
            throw new IllegalStateException(
                    "No workout templates are available. Restart the backend so the catalog seeder can populate the database.");
        }

        List<WorkoutPlan> plans = new ArrayList<>();
        for (WorkoutTemplate template : templates) {
            LocalDate planDate = startDate.plusDays(template.getDayIndex());

            WorkoutPlan plan = new WorkoutPlan();
            plan.setName(template.getTitle());
            plan.setCategory(template.getCategory());
            plan.setDurationMinutes(template.getDurationMinutes());
            plan.setPlannedAt(planDate.atTime(9, 0));
            plan.setNotes(template.getNote());
            plan.setGoal(template.getGoal());
            plan.setDayOfWeek(planDate.getDayOfWeek().name());
            plan.setGenerated(true);
            plan.setPositionInDay(0);
            plan.setOwner(owner);

            List<WorkoutPlanExercise> exercises = new ArrayList<>();
            for (WorkoutTemplateExercise templateExercise : template.getExercises()) {
                exercises.add(new WorkoutPlanExercise(
                        templateExercise.getExercise(),
                        templateExercise.getSetCount(),
                        templateExercise.getReps(),
                        templateExercise.getRestSeconds()));
            }
            plan.replaceExercises(exercises);
            plans.add(plan);
        }

        return plans;
    }
}
