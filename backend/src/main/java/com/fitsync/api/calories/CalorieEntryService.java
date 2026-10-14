package com.fitsync.api.calories;

import com.fitsync.api.auth.UserAccount;
import com.fitsync.api.auth.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional
public class CalorieEntryService {

    private final CalorieEntryRepository repository;
    private final UserAccountRepository userRepository;

    public CalorieEntryService(CalorieEntryRepository repository, UserAccountRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<CalorieEntryResponse> findAll(String email) {
        return repository.findAllByOwner_EmailOrderByConsumedOnDescIdDesc(email).stream()
                .map(CalorieEntryResponse::from)
                .toList();
    }

    public CalorieEntryResponse create(CalorieEntryRequest request, String email) {
        UserAccount owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User account not found"));
        CalorieEntry entry = repository.save(new CalorieEntry(
                request.foodName().trim(), request.mealType(), request.calories(), request.consumedOn(), owner));
        return CalorieEntryResponse.from(entry);
    }

    public void delete(Long id, String email) {
        CalorieEntry entry = repository.findByIdAndOwner_Email(id, email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Calorie entry not found"));
        repository.delete(entry);
    }
}
