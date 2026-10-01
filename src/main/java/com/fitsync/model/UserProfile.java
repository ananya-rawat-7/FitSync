package com.fitsync.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "user_profiles", uniqueConstraints = @UniqueConstraint(columnNames = "email"))
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 254)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private int age;

    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal weightKg;

    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal heightCm;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private FitnessGoal goal;

    @Column(nullable = false, length = 80)
    private String activity;

    @Column(nullable = false)
    private int daysPerWeek;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected UserProfile() {
    }

    public UserProfile(String name, String email, String passwordHash, int age,
            BigDecimal weightKg, BigDecimal heightCm, FitnessGoal goal,
            String activity, int daysPerWeek) {
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.age = age;
        this.weightKg = weightKg;
        this.heightCm = heightCm;
        this.goal = goal;
        this.activity = activity;
        this.daysPerWeek = daysPerWeek;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public int getAge() { return age; }
    public BigDecimal getWeightKg() { return weightKg; }
    public BigDecimal getHeightCm() { return heightCm; }
    public FitnessGoal getGoal() { return goal; }
    public String getActivity() { return activity; }
    public int getDaysPerWeek() { return daysPerWeek; }
    public Instant getCreatedAt() { return createdAt; }
}