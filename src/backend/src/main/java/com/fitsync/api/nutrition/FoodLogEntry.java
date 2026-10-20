package com.fitsync.api.nutrition;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fitsync.api.auth.UserAccount;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "food_log_entries")
public class FoodLogEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount owner;

    @Column(name = "logged_on", nullable = false)
    private LocalDate loggedOn;

    @Column(name = "meal_title", nullable = false, length = 120)
    private String mealTitle;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(precision = 8, scale = 2, nullable = false)
    private BigDecimal grams;

    @Column(precision = 8, scale = 2, nullable = false)
    private BigDecimal calories;

    @Column(precision = 7, scale = 2, nullable = false)
    private BigDecimal protein;

    @Column(precision = 7, scale = 2, nullable = false)
    private BigDecimal carbs;

    @Column(precision = 7, scale = 2, nullable = false)
    private BigDecimal fat;

    @Column(name = "source_meal_plan_id")
    private Long sourceMealPlanId;

    @Column(name = "logged_at", nullable = false)
    private LocalDateTime loggedAt;

    protected FoodLogEntry() {
    }

    public FoodLogEntry(UserAccount owner, MealPlan plan, MealPlanItem item) {
        this.owner = owner;
        this.loggedOn = plan.getPlannedDate();
        this.mealTitle = plan.getTitle();
        this.name = item.getName();
        this.grams = item.getGrams();
        this.calories = item.getCalories();
        this.protein = item.getProtein();
        this.carbs = item.getCarbs();
        this.fat = item.getFat();
        this.sourceMealPlanId = plan.getId();
        this.loggedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public UserAccount getOwner() {
        return owner;
    }

    public LocalDate getLoggedOn() {
        return loggedOn;
    }

    public String getMealTitle() {
        return mealTitle;
    }

    public String getName() {
        return name;
    }

    public BigDecimal getGrams() {
        return grams;
    }

    public BigDecimal getCalories() {
        return calories;
    }

    public BigDecimal getProtein() {
        return protein;
    }

    public BigDecimal getCarbs() {
        return carbs;
    }

    public BigDecimal getFat() {
        return fat;
    }

    public Long getSourceMealPlanId() {
        return sourceMealPlanId;
    }

    public LocalDateTime getLoggedAt() {
        return loggedAt;
    }
}
