package com.fitsync.api.workout;

import com.fitsync.api.auth.UserAccount;
import com.fitsync.api.auth.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional
public class WorkoutPlanService {

    private final WorkoutPlanRepository planRepository;
    private final WorkoutSessionRepository sessionRepository;
    private final UserAccountRepository userRepository;
    private final WeeklyPlanGenerator weeklyPlanGenerator;
    private final ExerciseService exerciseService;

    public WorkoutPlanService(
            WorkoutPlanRepository planRepository,
            WorkoutSessionRepository sessionRepository,
            UserAccountRepository userRepository,
            WeeklyPlanGenerator weeklyPlanGenerator,
            ExerciseService exerciseService) {
        this.planRepository = planRepository;
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.weeklyPlanGenerator = weeklyPlanGenerator;
        this.exerciseService = exerciseService;
    }

    @Transactional(readOnly = true)
    public List<WorkoutPlan> findAll(String email) {
        List<WorkoutPlan> plans = planRepository
                .findAllByOwner_EmailOrderByPlannedAtAscPositionInDayAsc(email);
        plans.sort(Comparator
                .comparing((WorkoutPlan plan) -> plan.getPlannedAt().toLocalDate())
                .thenComparingInt(WorkoutPlan::getPositionInDay));
        plans.forEach(plan -> plan.getExercises().size());
        return plans;
    }

    public WorkoutPlan create(WorkoutPlan plan, String email) {
        UserAccount owner = findOwner(email);
        plan.setOwner(owner);
        plan.setGenerated(false);

        LocalDate date = plan.getPlannedAt().toLocalDate();
        long existing = planRepository.countByOwner_EmailAndPlannedAtBetween(
                email, date.atStartOfDay(), date.plusDays(1).atStartOfDay());
        plan.setPositionInDay((int) existing);
        plan.replaceExercises(resolveExercises(plan.getExercises(), email));

        return planRepository.save(plan);
    }

    public WorkoutPlan update(Long id, WorkoutPlan plan, String email) {
        WorkoutPlan existing = findById(id, email);
        existing.setName(plan.getName());
        existing.setCategory(plan.getCategory());
        existing.setDurationMinutes(plan.getDurationMinutes());
        existing.setPlannedAt(plan.getPlannedAt());
        existing.setNotes(plan.getNotes());
        existing.replaceExercises(resolveExercises(plan.getExercises(), email));
        existing.getExercises().size();
        return planRepository.save(existing);
    }

    public List<WorkoutPlan> reorder(String email, LocalDate date, List<Long> planIds) {
        List<WorkoutPlan> ordered = new ArrayList<>();
        for (int index = 0; index < planIds.size(); index++) {
            WorkoutPlan plan = findById(planIds.get(index), email);
            if (!plan.getPlannedAt().toLocalDate().equals(date)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "A plan is not on the requested date");
            }
            plan.setPositionInDay(index);
            plan.getExercises().size();
            ordered.add(plan);
        }
        return planRepository.saveAll(ordered);
    }

    public List<WorkoutPlan> generateWeek(String email, LocalDate startDate) {
        UserAccount owner = findOwner(email);
        LocalDate start = startDate == null ? LocalDate.now().plusDays(1) : startDate;
        LocalDateTime rangeStart = start.atStartOfDay();
        LocalDateTime rangeEnd = start.plusDays(7).atStartOfDay();

        List<WorkoutPlan> existingGenerated = planRepository
                .findAllByOwner_EmailAndGeneratedTrueAndPlannedAtBetween(email, rangeStart, rangeEnd);
        planRepository.deleteAll(existingGenerated);

        return planRepository.saveAll(weeklyPlanGenerator.build(owner, start));
    }

    public WorkoutSession complete(Long id, String email) {
        WorkoutPlan plan = findById(id, email);
        WorkoutSession session = new WorkoutSession();
        session.setName(plan.getName());
        session.setCategory(plan.getCategory());
        session.setDurationMinutes(plan.getDurationMinutes());
        session.setPerformedAt(LocalDateTime.now());
        session.setNotes(plan.getNotes());
        session.setOwner(plan.getOwner());

        WorkoutSession completed = sessionRepository.save(session);
        planRepository.delete(plan);
        return completed;
    }

    public void delete(Long id, String email) {
        planRepository.delete(findById(id, email));
    }

    private List<WorkoutPlanExercise> resolveExercises(List<WorkoutPlanExercise> inputs, String email) {
        List<WorkoutPlanExercise> resolved = new ArrayList<>();
        if (inputs == null) {
            return resolved;
        }

        for (WorkoutPlanExercise input : inputs) {
            Exercise libraryExercise = input.getExerciseIdInput() == null
                    ? null
                    : exerciseService.resolveForUser(input.getExerciseIdInput(), email);

            String name = blankToNull(input.getName());
            if (name == null && libraryExercise != null) {
                name = libraryExercise.getName();
            }
            String category = blankToNull(input.getCategory());
            if (category == null && libraryExercise != null) {
                category = libraryExercise.getCategory();
            }
            if (name == null || category == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Exercise name and category are required");
            }

            Integer setCount = input.getSetCount();
            if (setCount == null && libraryExercise != null) {
                setCount = libraryExercise.getDefaultSetCount();
            }
            String reps = blankToNull(input.getReps());
            if (reps == null && libraryExercise != null) {
                reps = libraryExercise.getDefaultReps();
            }
            Integer restSeconds = input.getRestSeconds();
            if (restSeconds == null && libraryExercise != null) {
                restSeconds = libraryExercise.getDefaultRestSeconds();
            }
            String instructions = blankToNull(input.getInstructions());
            if (instructions == null && libraryExercise != null) {
                instructions = libraryExercise.getInstructions();
            }

            WorkoutPlanExercise resolvedExercise = new WorkoutPlanExercise(
                    name, category, setCount, reps, restSeconds, instructions);
            resolvedExercise.setExercise(libraryExercise);
            resolved.add(resolvedExercise);
        }

        return resolved;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private WorkoutPlan findById(Long id, String email) {
        return planRepository.findByIdAndOwner_Email(id, email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workout plan not found"));
    }

    private UserAccount findOwner(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User account not found"));
    }
}
