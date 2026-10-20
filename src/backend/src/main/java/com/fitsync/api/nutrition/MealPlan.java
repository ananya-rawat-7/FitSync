package com.fitsync.api.nutrition;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fitsync.api.auth.UserAccount;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "meal_plans")
public class MealPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount owner;

    @NotNull
    @Column(name = "planned_date", nullable = false)
    private LocalDate plannedDate;

    @Column(name = "position_in_day", nullable = false)
    private int positionInDay;

    @NotBlank
    @Size(max = 120)
    private String title;

    @Size(max = 500)
    private String notes;

    @Column(name = "auto_generated", nullable = false)
    private Boolean generated = false;

    @Column(nullable = false)
    private Boolean logged = false;

    @Column(name = "logged_at")
    private LocalDateTime loggedAt;

    @Valid
    @OneToMany(mappedBy = "mealPlan", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("positionIndex ASC")
    private List<MealPlanItem> items = new ArrayList<>();

    protected MealPlan() {
    }

    public Long getId() {
        return id;
    }

    public UserAccount getOwner() {
        return owner;
    }

    public void setOwner(UserAccount owner) {
        this.owner = owner;
    }

    public LocalDate getPlannedDate() {
        return plannedDate;
    }

    public void setPlannedDate(LocalDate plannedDate) {
        this.plannedDate = plannedDate;
    }

    public int getPositionInDay() {
        return positionInDay;
    }

    public void setPositionInDay(int positionInDay) {
        this.positionInDay = positionInDay;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public boolean isGenerated() {
        return Boolean.TRUE.equals(generated);
    }

    public void setGenerated(boolean generated) {
        this.generated = generated;
    }

    public boolean isLogged() {
        return Boolean.TRUE.equals(logged);
    }

    public void setLogged(boolean logged) {
        this.logged = logged;
    }

    public LocalDateTime getLoggedAt() {
        return loggedAt;
    }

    public void setLoggedAt(LocalDateTime loggedAt) {
        this.loggedAt = loggedAt;
    }

    public List<MealPlanItem> getItems() {
        return items;
    }

    public void replaceItems(List<MealPlanItem> replacements) {
        if (this.items == null) {
            this.items = new ArrayList<>();
        }
        this.items.clear();
        if (replacements == null) {
            return;
        }
        for (int index = 0; index < replacements.size(); index++) {
            MealPlanItem item = replacements.get(index);
            item.setMealPlan(this);
            item.setPositionIndex(index);
            this.items.add(item);
        }
    }
}
