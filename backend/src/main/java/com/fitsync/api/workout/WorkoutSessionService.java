package com.fitsync.api.workout;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import com.fitsync.api.auth.UserAccount;
import com.fitsync.api.auth.UserAccountRepository;

@Service
@Transactional
public class WorkoutSessionService {

    private final WorkoutSessionRepository repository;
    private final UserAccountRepository userRepository;

    public WorkoutSessionService(WorkoutSessionRepository repository, UserAccountRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<WorkoutSession> findAll(String email) {
        return repository.findAllByOwner_EmailOrderByPerformedAtDesc(email);
    }

    @Transactional(readOnly = true)
    public WorkoutSession findById(Long id, String email) {
        return repository.findByIdAndOwner_Email(id, email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Workout session not found"));
    }

    public WorkoutSession create(WorkoutSession session, String email) {
        session.setOwner(userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User account not found")));
        return repository.save(session);
    }

    public WorkoutSession update(Long id, WorkoutSession session, String email) {
        WorkoutSession existing = findById(id, email);
        existing.setName(session.getName());
        existing.setCategory(session.getCategory());
        existing.setDurationMinutes(session.getDurationMinutes());
        existing.setPerformedAt(session.getPerformedAt());
        existing.setNotes(session.getNotes());
        return repository.save(existing);
    }

    public void delete(Long id, String email) {
        repository.delete(findById(id, email));
    }
}
