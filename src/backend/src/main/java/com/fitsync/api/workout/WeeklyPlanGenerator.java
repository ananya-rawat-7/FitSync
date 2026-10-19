package com.fitsync.api.workout;

import com.fitsync.api.auth.UserAccount;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
public class WeeklyPlanGenerator {

    public List<WorkoutPlan> build(UserAccount owner, LocalDate startDate) {
        String goal = ExerciseCatalog.normalizeGoal(owner.getFitnessGoal());
        List<ExerciseCatalog.DayTemplate> days = ExerciseCatalog.weekFor(goal);
        List<WorkoutPlan> plans = new ArrayList<>();

        for (int index = 0; index < days.size(); index++) {
            ExerciseCatalog.DayTemplate day = days.get(index);
            LocalDate planDate = startDate.plusDays(index);

            WorkoutPlan plan = new WorkoutPlan();
            plan.setName(day.title());
            plan.setCategory(day.category());
            plan.setDurationMinutes(day.durationMinutes());
            plan.setPlannedAt(planDate.atTime(9, 0));
            plan.setNotes(day.note());
            plan.setGoal(goal);
            plan.setDayOfWeek(planDate.getDayOfWeek().name());
            plan.setGenerated(true);
            plan.setOwner(owner);
            plan.replaceExercises(toExercises(day.exerciseNames()));
            plans.add(plan);
        }

        return plans;
    }

    private List<WorkoutPlanExercise> toExercises(List<String> names) {
        List<WorkoutPlanExercise> exercises = new ArrayList<>();
        for (String name : names) {
            ExerciseCatalog.find(name).ifPresent(template -> exercises.add(new WorkoutPlanExercise(
                    template.name(),
                    template.category(),
                    template.setCount(),
                    template.reps(),
                    template.restSeconds(),
                    template.instructions())));
        }
        return exercises;
    }
}
