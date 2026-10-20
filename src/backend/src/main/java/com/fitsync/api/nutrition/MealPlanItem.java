package com.fitsync.api.nutrition;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Entity
@Table(name = "meal_plan_items")
public class MealPlanItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meal_plan_id", nullable = false)
    private MealPlan mealPlan;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "food_id")
    private Food food;

    @NotBlank
    @Size(max = 120)
    private String name;

    @NotNull
    @DecimalMin("0.0")
    @Digits(integer = 6, fraction = 2)
    @Column(precision = 8, scale = 2, nullable = false)
    private BigDecimal grams;

    @NotNull
    @DecimalMin("0.0")
    @Digits(integer = 6, fraction = 2)
    @Column(precision = 8, scale = 2, nullable = false)
    private BigDecimal calories;

    @NotNull
    @DecimalMin("0.0")
    @Digits(integer = 5, fraction = 2)
    @Column(precision = 7, scale = 2, nullable = false)
    private BigDecimal protein;

    @NotNull
    @DecimalMin("0.0")
    @Digits(integer = 5, fraction = 2)
    @Column(precision = 7, scale = 2, nullable = false)
    private BigDecimal carbs;

    @NotNull
    @DecimalMin("0.0")
    @Digits(integer = 5, fraction = 2)
    @Column(precision = 7, scale = 2, nullable = false)
    private BigDecimal fat;

    @Column(name = "position_index", nullable = false)
    private int positionIndex;

    protected MealPlanItem() {
    }

    public MealPlanItem(Food food, BigDecimal grams) {
        this.food = food;
        this.name = food.getName();
        this.grams = grams.setScale(2, RoundingMode.HALF_UP);
        this.calories = per100(food.getCaloriesPer100g(), grams);
        this.protein = per100(food.getProteinPer100g(), grams);
        this.carbs = per100(food.getCarbsPer100g(), grams);
        this.fat = per100(food.getFatPer100g(), grams);
    }

    private static BigDecimal per100(BigDecimal value, BigDecimal grams) {
        return value.multiply(grams).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    public Long getId() {
        return id;
    }

    public MealPlan getMealPlan() {
        return mealPlan;
    }

    public void setMealPlan(MealPlan mealPlan) {
        this.mealPlan = mealPlan;
    }

    public Food getFood() {
        return food;
    }

    public void setFood(Food food) {
        this.food = food;
    }

    @JsonProperty("foodId")
    public Long getFoodId() {
        return food == null ? null : food.getId();
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getGrams() {
        return grams;
    }

    public void setGrams(BigDecimal grams) {
        this.grams = grams;
    }

    public BigDecimal getCalories() {
        return calories;
    }

    public void setCalories(BigDecimal calories) {
        this.calories = calories;
    }

    public BigDecimal getProtein() {
        return protein;
    }

    public void setProtein(BigDecimal protein) {
        this.protein = protein;
    }

    public BigDecimal getCarbs() {
        return carbs;
    }

    public void setCarbs(BigDecimal carbs) {
        this.carbs = carbs;
    }

    public BigDecimal getFat() {
        return fat;
    }

    public void setFat(BigDecimal fat) {
        this.fat = fat;
    }

    public int getPositionIndex() {
        return positionIndex;
    }

    public void setPositionIndex(int positionIndex) {
        this.positionIndex = positionIndex;
    }
}
