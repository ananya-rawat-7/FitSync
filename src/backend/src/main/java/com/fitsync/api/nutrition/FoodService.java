package com.fitsync.api.nutrition;

import com.fitsync.api.auth.UserAccount;
import com.fitsync.api.auth.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional
public class FoodService {

    private final FoodRepository repository;
    private final UserAccountRepository userRepository;

    public FoodService(FoodRepository repository, UserAccountRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<FoodResponse> findAll(String email) {
        List<Food> foods = new ArrayList<>(repository.findAllByOwnerIsNullOrderByNameAsc());
        foods.addAll(repository.findAllByOwner_EmailOrderByNameAsc(email));
        return foods.stream()
                .sorted(Comparator.comparing(Food::getName, String.CASE_INSENSITIVE_ORDER))
                .map(FoodResponse::from)
                .toList();
    }

    public FoodResponse create(CreateFoodRequest request, String email) {
        UserAccount owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User account not found"));

        String name = request.name().trim();
        if (repository.findByNameAndOwnerIsNull(name).isPresent()
                || repository.existsByNameAndOwner_Email(name, email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A food with that name already exists");
        }

        Food food = new Food(
                name,
                request.category().trim(),
                request.caloriesPer100g(),
                request.proteinPer100g(),
                request.carbsPer100g(),
                request.fatPer100g());
        food.setOwner(owner);
        return FoodResponse.from(repository.save(food));
    }

    @Transactional(readOnly = true)
    public Food resolveForUser(Long id, String email) {
        Food food = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown food"));
        if (food.getOwner() != null && !food.getOwner().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown food");
        }
        return food;
    }
}
