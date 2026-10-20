package com.fitsync.api.nutrition;

import com.fitsync.api.auth.UserAccount;
import com.fitsync.api.auth.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class WaterService {

    private final WaterRepository repository;
    private final UserAccountRepository userRepository;

    public WaterService(WaterRepository repository, UserAccountRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<WaterResponse> findAll(String email, LocalDate start, LocalDate end) {
        return repository
                .findAllByOwner_EmailAndLoggedOnBetweenOrderByLoggedOnAscLoggedAtAscIdAsc(email, start, end)
                .stream()
                .map(WaterResponse::from)
                .toList();
    }

    public WaterResponse create(WaterRequest request, String email) {
        UserAccount owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User account not found"));
        if (request.loggedOn().isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Water cannot be logged for a future date");
        }
        return WaterResponse.from(repository.save(
                new WaterEntry(owner, request.loggedOn(), request.milliliters())));
    }

    public void delete(Long id, String email) {
        WaterEntry entry = repository.findByIdAndOwner_Email(id, email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Water entry not found"));
        repository.delete(entry);
    }
}
