package com.fitsync.api.calories;

import com.fitsync.api.auth.UserAccount;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "calorie_entries")
public class CalorieEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String foodName;

    @Enumerated(EnumType.STRING)
    private MealType mealType;

    private int calories;

    private LocalDate consumedOn;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount owner;

    protected CalorieEntry() {
    }

    public CalorieEntry(String foodName, MealType mealType, int calories, LocalDate consumedOn,
                        UserAccount owner) {
        this.foodName = foodName;
        this.mealType = mealType;
        this.calories = calories;
        this.consumedOn = consumedOn;
        this.owner = owner;
    }

    public Long getId() {
        return id;
    }

    public String getFoodName() {
        return foodName;
    }

    public MealType getMealType() {
        return mealType;
    }

    public int getCalories() {
        return calories;
    }

    public LocalDate getConsumedOn() {
        return consumedOn;
    }

    public UserAccount getOwner() {
        return owner;
    }
}
