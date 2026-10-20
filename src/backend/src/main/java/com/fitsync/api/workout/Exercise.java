package com.fitsync.api.workout;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fitsync.api.auth.UserAccount;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "exercises")
public class Exercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    private String name;

    @NotBlank
    @Size(max = 50)
    private String category;

    @Size(max = 80)
    private String equipment;

    @Size(max = 30)
    private String difficulty;

    @Min(0)
    @Max(50)
    private Integer defaultSetCount;

    @Size(max = 32)
    private String defaultReps;

    @Min(0)
    @Max(600)
    private Integer defaultRestSeconds;

    @Size(max = 500)
    private String instructions;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private UserAccount owner;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "exercise_goals", joinColumns = @JoinColumn(name = "exercise_id"))
    @Column(name = "goal", length = 32)
    private Set<String> goals = new HashSet<>();

    protected Exercise() {
    }

    public Exercise(String name, String category, String equipment, String difficulty,
                    Integer defaultSetCount, String defaultReps, Integer defaultRestSeconds,
                    String instructions, Set<String> goals) {
        this.name = name;
        this.category = category;
        this.equipment = equipment;
        this.difficulty = difficulty;
        this.defaultSetCount = defaultSetCount;
        this.defaultReps = defaultReps;
        this.defaultRestSeconds = defaultRestSeconds;
        this.instructions = instructions;
        if (goals != null) {
            this.goals.addAll(goals);
        }
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

    public String getEquipment() {
        return equipment;
    }

    public void setEquipment(String equipment) {
        this.equipment = equipment;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public Integer getDefaultSetCount() {
        return defaultSetCount;
    }

    public void setDefaultSetCount(Integer defaultSetCount) {
        this.defaultSetCount = defaultSetCount;
    }

    public String getDefaultReps() {
        return defaultReps;
    }

    public void setDefaultReps(String defaultReps) {
        this.defaultReps = defaultReps;
    }

    public Integer getDefaultRestSeconds() {
        return defaultRestSeconds;
    }

    public void setDefaultRestSeconds(Integer defaultRestSeconds) {
        this.defaultRestSeconds = defaultRestSeconds;
    }

    public String getInstructions() {
        return instructions;
    }

    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }

    public UserAccount getOwner() {
        return owner;
    }

    public void setOwner(UserAccount owner) {
        this.owner = owner;
    }

    public Set<String> getGoals() {
        return goals;
    }

    public void setGoals(Set<String> goals) {
        this.goals.clear();
        if (goals != null) {
            this.goals.addAll(goals);
        }
    }
}
