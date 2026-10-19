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
import java.util.List;

@Service
@Transactional
public class WorkoutPlanService {

    private final WorkoutPlanRepository planRepository;
    private final WorkoutSessionRepository sessionRepository;
    private final UserAccountRepository userRepository;
    private final WeeklyPlanGenerator weeklyPlanGenerator;

    public WorkoutPlanService(
            WorkoutPlanRepository planRepository,
            WorkoutSessionRepository sessionRepository,
            UserAccountRepository userRepository,
            WeeklyPlanGenerator weeklyPlanGenerator) {
        this.planRepository = planRepository;
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.weeklyPlanGenerator = weeklyPlanGenerator;
    }

    @Transactional(readOnly = true)
    public List<WorkoutPlan> findAll(String email) {
        List<WorkoutPlan> plans = planRepository.findAllByOwner_EmailOrderByPlannedAtAsc(email);
        plans.forEach(plan -> plan.getExercises().size());
        return plans;
    }

    public WorkoutPlan create(WorkoutPlan plan, String email) {
        plan.setOwner(findOwner(email));
        List<WorkoutPlanExercise> exercises = plan.getExercises();
        plan.replaceExercises(exercises == null ? null : new ArrayList<>(exercises));
        return planRepository.save(plan);
    }

    public WorkoutPlan update(Long id, WorkoutPlan plan, String email) {
        WorkoutPlan existing = findById(id, email);
        existing.setName(plan.getName());
        existing.setCategory(plan.getCategory());
        existing.setDurationMinutes(plan.getDurationMinutes());
        existing.setPlannedAt(plan.getPlannedAt());
        existing.setNotes(plan.getNotes());

        List<WorkoutPlanExercise> exercises = plan.getExercises();
        if (exercises != null && !exercises.isEmpty()) {
            existing.replaceExercises(new ArrayList<>(exercises));
        }
        existing.getExercises().size();
        return planRepository.save(existing);
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

    private WorkoutPlan findById(Long id, String email) {
        return planRepository.findByIdAndOwner_Email(id, email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workout plan not found"));
    }

    private UserAccount findOwner(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User account not found"));
    }
}
