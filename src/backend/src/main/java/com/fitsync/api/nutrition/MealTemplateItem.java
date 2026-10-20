package com.fitsync.api.nutrition;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

@Entity
@Table(name = "meal_template_items")
public class MealTemplateItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private MealTemplate template;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "food_id", nullable = false)
    private Food food;

    @Column(precision = 8, scale = 2, nullable = false)
    private BigDecimal grams;

    @Column(name = "position_index", nullable = false)
    private int positionIndex;

    protected MealTemplateItem() {
    }

    public MealTemplateItem(Food food, BigDecimal grams) {
        this.food = food;
        this.grams = grams;
    }

    public Long getId() {
        return id;
    }

    public MealTemplate getTemplate() {
        return template;
    }

    public void setTemplate(MealTemplate template) {
        this.template = template;
    }

    public Food getFood() {
        return food;
    }

    public void setFood(Food food) {
        this.food = food;
    }

    public BigDecimal getGrams() {
        return grams;
    }

    public void setGrams(BigDecimal grams) {
        this.grams = grams;
    }

    public int getPositionIndex() {
        return positionIndex;
    }

    public void setPositionIndex(int positionIndex) {
        this.positionIndex = positionIndex;
    }
}
