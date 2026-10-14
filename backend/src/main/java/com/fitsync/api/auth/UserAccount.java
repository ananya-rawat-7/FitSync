package com.fitsync.api.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "user_accounts")
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Column(nullable = false, length = 80)
    private String displayName;

    @Column(nullable = false)
    private String passwordHash;

    @Column(precision = 6, scale = 2)
    private BigDecimal weightKg;

    @Column(precision = 6, scale = 2)
    private BigDecimal heightCm;

    private Integer age;

    @Column(length = 32)
    private String gender;

    @Column(length = 32)
    private String fitnessGoal;

    protected UserAccount() {
    }

    public UserAccount(String email, String displayName, String passwordHash) {
        this.email = email;
        this.displayName = displayName;
        this.passwordHash = passwordHash;
    }

    public UserAccount(String email, String displayName, String passwordHash, BigDecimal weightKg,
                       BigDecimal heightCm, Integer age, String gender, String fitnessGoal) {
        this(email, displayName, passwordHash);
        updateFitnessProfile(weightKg, heightCm, age, gender, fitnessGoal);
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public BigDecimal getWeightKg() {
        return weightKg;
    }

    public BigDecimal getHeightCm() {
        return heightCm;
    }

    public Integer getAge() {
        return age;
    }

    public String getGender() {
        return gender;
    }

    public String getFitnessGoal() {
        return fitnessGoal;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public void updateFitnessProfile(BigDecimal weightKg, BigDecimal heightCm, Integer age,
                                     String gender, String fitnessGoal) {
        this.weightKg = weightKg;
        this.heightCm = heightCm;
        this.age = age;
        this.gender = gender;
        this.fitnessGoal = fitnessGoal;
    }
}
