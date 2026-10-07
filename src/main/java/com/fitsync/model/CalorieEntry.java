package com.fitsync.model;

import jakarta.persistence.Column;
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
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "calorie_entries")
public class CalorieEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "profile_id", nullable = false)
    private UserProfile profile;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private CalorieEntryType type;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal calories;

    @Column(length = 120)
    private String note;

    @Column(nullable = false, updatable = false)
    private Instant occurredAt;

    protected CalorieEntry() {
    }

    public CalorieEntry(UserProfile profile, CalorieEntryType type, BigDecimal calories, String note) {
        this.profile = profile;
        this.type = type;
        this.calories = calories;
        this.note = note;
        this.occurredAt = Instant.now();
    }

    public Long getId() { return id; }
    public UserProfile getProfile() { return profile; }
    public CalorieEntryType getType() { return type; }
    public BigDecimal getCalories() { return calories; }
    public String getNote() { return note; }
    public Instant getOccurredAt() { return occurredAt; }
}