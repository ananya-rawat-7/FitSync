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

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "water_entries")
public class WaterEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount owner;

    @Column(name = "logged_on", nullable = false)
    private LocalDate loggedOn;

    @Column(nullable = false)
    private int milliliters;

    @Column(name = "logged_at", nullable = false)
    private LocalDateTime loggedAt;

    protected WaterEntry() {
    }

    public WaterEntry(UserAccount owner, LocalDate loggedOn, int milliliters) {
        this.owner = owner;
        this.loggedOn = loggedOn;
        this.milliliters = milliliters;
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

    public int getMilliliters() {
        return milliliters;
    }

    public LocalDateTime getLoggedAt() {
        return loggedAt;
    }
}
