package com.fitsync.api.workout;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class CatalogSeedService {

    private static final Logger logger = LoggerFactory.getLogger(CatalogSeedService.class);

    private final ExerciseRepository exerciseRepository;
    private final WorkoutTemplateRepository templateRepository;

    public CatalogSeedService(ExerciseRepository exerciseRepository,
                              WorkoutTemplateRepository templateRepository) {
        this.exerciseRepository = exerciseRepository;
        this.templateRepository = templateRepository;
    }

    public void seed() {
        Map<String, Exercise> exercisesByName = new HashMap<>();
        int insertedExercises = 0;

        for (CatalogSeedData.ExerciseTemplate seed : CatalogSeedData.EXERCISES) {
            Exercise exercise = exerciseRepository.findByNameAndOwnerIsNull(seed.name()).orElse(null);
            if (exercise == null) {
                exercise = exerciseRepository.save(new Exercise(
                        seed.name(), seed.category(), seed.equipment(), seed.difficulty(),
                        seed.setCount(), seed.reps(), seed.restSeconds(), seed.instructions(), seed.goals()));
                insertedExercises++;
            }
            exercisesByName.put(seed.name(), exercise);
        }

        int insertedTemplates = 0;
        for (Map.Entry<String, List<CatalogSeedData.DayTemplate>> entry : CatalogSeedData.WEEK_TEMPLATES.entrySet()) {
            String goal = entry.getKey();
            List<CatalogSeedData.DayTemplate> days = entry.getValue();

            for (int dayIndex = 0; dayIndex < days.size(); dayIndex++) {
                if (templateRepository.findByGoalAndDayIndex(goal, dayIndex).isPresent()) {
                    continue;
                }

                CatalogSeedData.DayTemplate day = days.get(dayIndex);
                WorkoutTemplate template = new WorkoutTemplate();
                template.setGoal(goal);
                template.setDayIndex(dayIndex);
                template.setTitle(day.title());
                template.setCategory(day.category());
                template.setDurationMinutes(day.durationMinutes());
                template.setNote(day.note());

                List<WorkoutTemplateExercise> exercises = new ArrayList<>();
                for (String exerciseName : day.exerciseNames()) {
                    Exercise exercise = exercisesByName.get(exerciseName);
                    if (exercise == null) {
                        logger.warn("Seed exercise '{}' is missing for goal {} day {}",
                                exerciseName, goal, dayIndex);
                        continue;
                    }
                    exercises.add(new WorkoutTemplateExercise(exercise, null, null, null));
                }
                template.replaceExercises(exercises);
                templateRepository.save(template);
                insertedTemplates++;
            }
        }

        logger.info("Catalog seed complete: {} exercises and {} workout templates inserted",
                insertedExercises, insertedTemplates);
    }
}
