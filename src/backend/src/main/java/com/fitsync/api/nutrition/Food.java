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
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

@Entity
@Table(name = "foods")
public class Food {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 120)
    private String name;

    @NotBlank
    @Size(max = 80)
    private String category;

    @NotNull
    @DecimalMin("0.0")
    @Digits(integer = 6, fraction = 2)
    @Column(name = "calories_per_100g", precision = 8, scale = 2, nullable = false)
    private BigDecimal caloriesPer100g;

    @NotNull
    @DecimalMin("0.0")
    @Digits(integer = 5, fraction = 2)
    @Column(name = "protein_per_100g", precision = 7, scale = 2, nullable = false)
    private BigDecimal proteinPer100g;

    @NotNull
    @DecimalMin("0.0")
    @Digits(integer = 5, fraction = 2)
    @Column(name = "carbs_per_100g", precision = 7, scale = 2, nullable = false)
    private BigDecimal carbsPer100g;

    @NotNull
    @DecimalMin("0.0")
    @Digits(integer = 5, fraction = 2)
    @Column(name = "fat_per_100g", precision = 7, scale = 2, nullable = false)
    private BigDecimal fatPer100g;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private UserAccount owner;

    protected Food() {
    }

    public Food(String name, String category, BigDecimal caloriesPer100g,
                BigDecimal proteinPer100g, BigDecimal carbsPer100g, BigDecimal fatPer100g) {
        this.name = name;
        this.category = category;
        this.caloriesPer100g = caloriesPer100g;
        this.proteinPer100g = proteinPer100g;
        this.carbsPer100g = carbsPer100g;
        this.fatPer100g = fatPer100g;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public BigDecimal getCaloriesPer100g() {
        return caloriesPer100g;
    }

    public void setCaloriesPer100g(BigDecimal caloriesPer100g) {
        this.caloriesPer100g = caloriesPer100g;
    }

    public BigDecimal getProteinPer100g() {
        return proteinPer100g;
    }

    public void setProteinPer100g(BigDecimal proteinPer100g) {
        this.proteinPer100g = proteinPer100g;
    }

    public BigDecimal getCarbsPer100g() {
        return carbsPer100g;
    }

    public void setCarbsPer100g(BigDecimal carbsPer100g) {
        this.carbsPer100g = carbsPer100g;
    }

    public BigDecimal getFatPer100g() {
        return fatPer100g;
    }

    public void setFatPer100g(BigDecimal fatPer100g) {
        this.fatPer100g = fatPer100g;
    }

    public UserAccount getOwner() {
        return owner;
    }

    public void setOwner(UserAccount owner) {
        this.owner = owner;
    }
}
