package com.fitsync.api.nutrition;

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
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional
public class MealPlanService {

    private final MealPlanRepository planRepository;
    private final MealTemplateRepository templateRepository;
    private final FoodService foodService;
    private final FoodLogRepository foodLogRepository;
    private final UserAccountRepository userRepository;

    public MealPlanService(
            MealPlanRepository planRepository,
            MealTemplateRepository templateRepository,
            FoodService foodService,
            FoodLogRepository foodLogRepository,
            UserAccountRepository userRepository) {
        this.planRepository = planRepository;
        this.templateRepository = templateRepository;
        this.foodService = foodService;
        this.foodLogRepository = foodLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<MealPlan> findAll(String email, LocalDate start, LocalDate end) {
        List<MealPlan> plans = planRepository.findForRange(email, start, end);
        plans.sort(Comparator.comparing(MealPlan::getPlannedDate)
                .thenComparingInt(plan -> plan.getMealSlot().ordinal()));
        plans.forEach(plan -> plan.getItems().size());
        return plans;
    }

    public MealPlan create(MealPlanRequest request, String email) {
        UserAccount owner = findOwner(email);
        if (planRepository.existsByOwner_EmailAndPlannedDateAndMealSlot(
                email, request.plannedDate(), request.mealSlot())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A meal already exists for that day and slot");
        }

        MealPlan plan = new MealPlan();
        plan.setOwner(owner);
        plan.setPlannedDate(request.plannedDate());
        plan.setMealSlot(request.mealSlot());
        plan.setTitle(request.title().trim());
        plan.setNotes(blankToNull(request.notes()));
        plan.setGenerated(false);
        plan.setLogged(false);
        plan.replaceItems(resolveItems(request.items(), email));
        return planRepository.save(plan);
    }

    public MealPlan update(Long id, MealPlanRequest request, String email) {
        MealPlan plan = findById(id, email);
        plan.setTitle(request.title().trim());
        plan.setNotes(blankToNull(request.notes()));
        plan.replaceItems(resolveItems(request.items(), email));
        plan.getItems().size();
        return planRepository.save(plan);
    }

    public void delete(Long id, String email) {
        planRepository.delete(findById(id, email));
    }

    public List<MealPlan> generateWeek(String email, LocalDate startDate) {
        UserAccount owner = findOwner(email);
        LocalDate start = startDate == null ? LocalDate.now() : startDate;
        LocalDate end = start.plusDays(6);

        List<MealPlan> existingGenerated = planRepository
                .findAllByOwner_EmailAndGeneratedTrueAndLoggedFalseAndPlannedDateBetween(email, start, end);
        planRepository.deleteAll(existingGenerated);

        List<MealPlan> existing = planRepository.findForRange(email, start, end);
        Set<String> occupied = new HashSet<>();
        for (MealPlan plan : existing) {
            occupied.add(slotKey(plan.getPlannedDate(), plan.getMealSlot()));
        }

        MenuGroup menuGroup = MenuGroup.forGoal(owner.getFitnessGoal());
        List<MealTemplate> templates = templateRepository.findAllByMenuGroup(menuGroup);
        if (templates.isEmpty()) {
            throw new IllegalStateException(
                    "No meal templates are available. Restart the backend so the nutrition seeder can populate the database.");
        }

        Map<String, MealTemplate> byKey = new HashMap<>();
        for (MealTemplate template : templates) {
            byKey.put(template.getDayIndex() + "|" + template.getMealSlot(), template);
        }

        List<MealPlan> created = new ArrayList<>();
        for (int dayIndex = 0; dayIndex < 7; dayIndex++) {
            LocalDate date = start.plusDays(dayIndex);
            for (MealSlot slot : MealSlot.values()) {
                if (occupied.contains(slotKey(date, slot))) {
                    continue;
                }
                MealTemplate template = byKey.get(dayIndex + "|" + slot);
                if (template == null) {
                    continue;
                }

                MealPlan plan = new MealPlan();
                plan.setOwner(owner);
                plan.setPlannedDate(date);
                plan.setMealSlot(slot);
                plan.setTitle(template.getTitle());
                plan.setNotes(template.getNote());
                plan.setGenerated(true);
                plan.setLogged(false);

                List<MealPlanItem> items = new ArrayList<>();
                for (MealTemplateItem templateItem : template.getItems()) {
                    items.add(new MealPlanItem(templateItem.getFood(), templateItem.getGrams()));
                }
                plan.replaceItems(items);
                created.add(plan);
            }
        }

        return planRepository.saveAll(created);
    }

    public List<FoodLogEntryResponse> log(Long id, String email) {
        MealPlan plan = findById(id, email);
        if (plan.isLogged()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This meal has already been logged");
        }
        if (plan.getPlannedDate().isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A future meal cannot be logged");
        }

        List<FoodLogEntry> entries = createLogEntries(plan);
        plan.setLogged(true);
        plan.setLoggedAt(LocalDateTime.now());
        planRepository.save(plan);

        return entries.stream().map(FoodLogEntryResponse::from).toList();
    }

    public List<FoodLogEntryResponse> logDay(String email, LocalDate date) {
        if (date.isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A future day cannot be logged");
        }

        List<MealPlan> plans = planRepository
                .findAllByOwner_EmailAndPlannedDateAndLoggedFalse(email, date);
        if (plans.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "There are no meals left to log for that day");
        }

        List<FoodLogEntry> entries = new ArrayList<>();
        for (MealPlan plan : plans) {
            entries.addAll(createLogEntries(plan));
            plan.setLogged(true);
            plan.setLoggedAt(LocalDateTime.now());
        }
        planRepository.saveAll(plans);

        return entries.stream().map(FoodLogEntryResponse::from).toList();
    }

    private List<FoodLogEntry> createLogEntries(MealPlan plan) {
        List<FoodLogEntry> entries = new ArrayList<>();
        for (MealPlanItem item : plan.getItems()) {
            entries.add(new FoodLogEntry(plan.getOwner(), plan, item));
        }
        return foodLogRepository.saveAll(entries);
    }

    private List<MealPlanItem> resolveItems(List<MealPlanItemRequest> requests, String email) {
        List<MealPlanItem> items = new ArrayList<>();
        for (MealPlanItemRequest request : requests) {
            Food food = foodService.resolveForUser(request.foodId(), email);
            items.add(new MealPlanItem(food, request.grams()));
        }
        return items;
    }

    private static String slotKey(LocalDate date, MealSlot slot) {
        return date + "|" + slot;
    }

    private MealPlan findById(Long id, String email) {
        return planRepository.findByIdAndOwner_Email(id, email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Meal plan not found"));
    }

    private UserAccount findOwner(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User account not found"));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
