package com.fitsync.api.workout;

import com.fitsync.api.auth.UserAccount;
import com.fitsync.api.auth.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class ExerciseService {

    private final ExerciseRepository repository;
    private final UserAccountRepository userRepository;

    public ExerciseService(ExerciseRepository repository, UserAccountRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ExerciseResponse> findAll(String email, String goal) {
        String requestedGoal = goal == null || goal.isBlank() ? null : goal;
        List<Exercise> available = new ArrayList<>(repository.findAllByOwnerIsNullOrderByNameAsc());
        available.addAll(repository.findAllByOwner_EmailOrderByNameAsc(email));

        return available.stream()
                .filter(exercise -> requestedGoal == null || exercise.getGoals().contains(requestedGoal))
                .sorted(Comparator.comparing(Exercise::getName, String.CASE_INSENSITIVE_ORDER))
                .map(ExerciseResponse::from)
                .toList();
    }

    public ExerciseResponse create(CreateExerciseRequest request, String email) {
        UserAccount owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User account not found"));

        String name = request.name().trim();
        if (repository.findByNameAndOwnerIsNull(name).isPresent()
                || repository.existsByNameAndOwner_Email(name, email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An exercise with that name already exists");
        }

        Set<String> goals = request.goals() == null ? Set.of() : request.goals().stream()
                .filter(WorkoutGoals.ALL::contains)
                .collect(Collectors.toSet());
        if (goals.isEmpty()) {
            String fallback = owner.getFitnessGoal() != null && WorkoutGoals.ALL.contains(owner.getFitnessGoal())
                    ? owner.getFitnessGoal()
                    : "OTHER";
            goals = Set.of(fallback);
        }

        Exercise exercise = new Exercise(
                name,
                request.category().trim(),
                defaultIfBlank(request.equipment(), "None"),
                defaultIfBlank(request.difficulty(), "Beginner"),
                request.setCount(),
                blankToNull(request.reps()),
                request.restSeconds(),
                blankToNull(request.instructions()),
                goals);
        exercise.setOwner(owner);

        return ExerciseResponse.from(repository.save(exercise));
    }

    @Transactional(readOnly = true)
    public Exercise resolveForUser(Long id, String email) {
        Exercise exercise = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown exercise"));
        if (exercise.getOwner() != null && !exercise.getOwner().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown exercise");
        }
        return exercise;
    }

    private static String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
