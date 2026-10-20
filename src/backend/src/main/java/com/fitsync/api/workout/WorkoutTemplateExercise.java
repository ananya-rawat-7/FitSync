package com.fitsync.api.workout;

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
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "workout_template_exercises")
public class WorkoutTemplateExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private WorkoutTemplate template;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;

    @Column(name = "position_index", nullable = false)
    private int positionIndex;

    @Min(0)
    @Max(50)
    private Integer setCount;

    @Size(max = 32)
    private String reps;

    @Min(0)
    @Max(600)
    private Integer restSeconds;

    protected WorkoutTemplateExercise() {
    }

    public WorkoutTemplateExercise(Exercise exercise, Integer setCount, String reps, Integer restSeconds) {
        this.exercise = exercise;
        this.setCount = setCount;
        this.reps = reps;
        this.restSeconds = restSeconds;
    }

    public Long getId() {
        return id;
    }

    public WorkoutTemplate getTemplate() {
        return template;
    }

    public void setTemplate(WorkoutTemplate template) {
        this.template = template;
    }

    public Exercise getExercise() {
        return exercise;
    }

    public void setExercise(Exercise exercise) {
        this.exercise = exercise;
    }

    public int getPositionIndex() {
        return positionIndex;
    }

    public void setPositionIndex(int positionIndex) {
        this.positionIndex = positionIndex;
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
}
