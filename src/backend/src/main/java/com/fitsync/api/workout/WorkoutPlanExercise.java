package com.fitsync.api.workout;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "workout_plan_exercises")
public class WorkoutPlanExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Size(max = 100)
    private String name;

    @Size(max = 50)
    private String category;

    @Min(0)
    @Max(50)
    private Integer setCount;

    @Size(max = 32)
    private String reps;

    @Min(0)
    @Max(600)
    private Integer restSeconds;

    @Size(max = 500)
    private String instructions;

    @Column(name = "position_index", nullable = false)
    private int positionIndex;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workout_plan_id", nullable = false)
    private WorkoutPlan plan;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id")
    private Exercise exercise;

    @Transient
    @JsonIgnore
    private Long exerciseIdInput;

    protected WorkoutPlanExercise() {
    }

    public WorkoutPlanExercise(Exercise exercise, Integer setCount, String reps, Integer restSeconds) {
        this.exercise = exercise;
        this.name = exercise.getName();
        this.category = exercise.getCategory();
        this.setCount = setCount != null ? setCount : exercise.getDefaultSetCount();
        this.reps = reps != null ? reps : exercise.getDefaultReps();
        this.restSeconds = restSeconds != null ? restSeconds : exercise.getDefaultRestSeconds();
        this.instructions = exercise.getInstructions();
    }

    public WorkoutPlanExercise(String name, String category, Integer setCount, String reps,
                               Integer restSeconds, String instructions) {
        this.name = name;
        this.category = category;
        this.setCount = setCount;
        this.reps = reps;
        this.restSeconds = restSeconds;
        this.instructions = instructions;
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

    public Integer getSetCount() {
        return setCount;
    }

    public void setSetCount(Integer setCount) {
        this.setCount = setCount;
    }

    public String getReps() {
        return reps;
    }

    public void setReps(String reps) {
        this.reps = reps;
    }

    public Integer getRestSeconds() {
        return restSeconds;
    }

    public void setRestSeconds(Integer restSeconds) {
        this.restSeconds = restSeconds;
    }

    public String getInstructions() {
        return instructions;
    }

    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }

    public int getPositionIndex() {
        return positionIndex;
    }

    public void setPositionIndex(int positionIndex) {
        this.positionIndex = positionIndex;
    }

    public WorkoutPlan getPlan() {
        return plan;
    }

    public void setPlan(WorkoutPlan plan) {
        this.plan = plan;
    }

    @JsonIgnore
    public Exercise getExercise() {
        return exercise;
    }

    public void setExercise(Exercise exercise) {
        this.exercise = exercise;
    }

    @JsonProperty("exerciseId")
    public Long getExerciseId() {
        return exercise == null ? null : exercise.getId();
    }

    @JsonProperty("exerciseId")
    public void setExerciseId(Long exerciseId) {
        this.exerciseIdInput = exerciseId;
    }

    @JsonIgnore
    public Long getExerciseIdInput() {
        return exerciseIdInput;
    }
}
