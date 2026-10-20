package com.fitsync.api.nutrition;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class NutritionSeedService {

    private static final Logger logger = LoggerFactory.getLogger(NutritionSeedService.class);

    private final FoodRepository foodRepository;
    private final MealTemplateRepository templateRepository;
    private final ObjectMapper objectMapper;

    public NutritionSeedService(FoodRepository foodRepository,
                                MealTemplateRepository templateRepository,
                                ObjectMapper objectMapper) {
        this.foodRepository = foodRepository;
        this.templateRepository = templateRepository;
        this.objectMapper = objectMapper;
    }

    public void seed() {
        Map<String, Food> foodsByName = new HashMap<>();
        int insertedFoods = 0;

        for (FoodSeed seed : readFoods()) {
            Food food = foodRepository.findByNameAndOwnerIsNull(seed.name()).orElse(null);
            if (food == null) {
                food = foodRepository.save(new Food(
                        seed.name(), seed.category(), seed.caloriesPer100g(),
                        seed.proteinPer100g(), seed.carbsPer100g(), seed.fatPer100g()));
                insertedFoods++;
            }
            foodsByName.put(seed.name(), food);
        }

        int insertedTemplates = 0;
        for (MealTemplateSeed seed : readTemplates()) {
            MenuGroup menuGroup = MenuGroup.valueOf(seed.menuGroup());
            MealSlot mealSlot = MealSlot.valueOf(seed.mealSlot());
            if (templateRepository.findByMenuGroupAndDayIndexAndMealSlot(
                    menuGroup, seed.dayIndex(), mealSlot).isPresent()) {
                continue;
            }

            MealTemplate template = new MealTemplate();
            template.setMenuGroup(menuGroup);
            template.setDayIndex(seed.dayIndex());
            template.setMealSlot(mealSlot);
            template.setTitle(seed.title());
            template.setNote(seed.note());

            List<MealTemplateItem> items = new ArrayList<>();
            for (MealItemSeed itemSeed : seed.items()) {
                Food food = foodsByName.get(itemSeed.foodName());
                if (food == null) {
                    logger.warn("Meal template food '{}' is missing from the food seed", itemSeed.foodName());
                    continue;
                }
                items.add(new MealTemplateItem(food, itemSeed.grams()));
            }
            template.replaceItems(items);
            templateRepository.save(template);
            insertedTemplates++;
        }

        logger.info("Nutrition seed complete: {} foods and {} meal templates inserted",
                insertedFoods, insertedTemplates);
    }

    private List<FoodSeed> readFoods() {
        try (InputStream input = new ClassPathResource("seed/foods.json").getInputStream()) {
            return objectMapper.readValue(input, new TypeReference<List<FoodSeed>>() {
            });
        } catch (Exception exception) {
            throw new IllegalStateException("Could not read seed/foods.json", exception);
        }
    }

    private List<MealTemplateSeed> readTemplates() {
        try (InputStream input = new ClassPathResource("seed/meal-templates.json").getInputStream()) {
            return objectMapper.readValue(input, new TypeReference<List<MealTemplateSeed>>() {
            });
        } catch (Exception exception) {
            throw new IllegalStateException("Could not read seed/meal-templates.json", exception);
        }
    }

    public record FoodSeed(
            String name,
            String category,
            BigDecimal caloriesPer100g,
            BigDecimal proteinPer100g,
            BigDecimal carbsPer100g,
            BigDecimal fatPer100g) {
    }

    public record MealTemplateSeed(
            String menuGroup,
            int dayIndex,
            String mealSlot,
            String title,
            String note,
            List<MealItemSeed> items) {
    }

    public record MealItemSeed(String foodName, BigDecimal grams) {
    }
}
