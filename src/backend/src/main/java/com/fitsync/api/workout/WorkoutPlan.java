package com.fitsync.api.workout;

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
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "workout_plans")
public class WorkoutPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    private String name;

    @NotBlank
    @Size(max = 50)
    private String category;

    @Min(1)
    @Max(1440)
    private int durationMinutes;

    @NotNull
    private LocalDateTime plannedAt;

    @Size(max = 500)
    private String notes;

    @Column(length = 32)
    private String goal;

    @Column(name = "day_of_week", length = 12)
    private String dayOfWeek;

    @Column(name = "auto_generated")
    private Boolean generated = false;

    @Column(name = "position_in_day")
    private Integer positionInDay = 0;

    @Column(name = "is_completed")
    private Boolean completed = false;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "completed_session_id")
    private Long completedSessionId;

    @Valid
    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("positionIndex ASC")
    private List<WorkoutPlanExercise> exercises = new ArrayList<>();

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserAccount owner;

    protected WorkoutPlan() {
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

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(int durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public LocalDateTime getPlannedAt() {
        return plannedAt;
    }

    public void setPlannedAt(LocalDateTime plannedAt) {
        this.plannedAt = plannedAt;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getGoal() {
        return goal;
    }

    public void setGoal(String goal) {
        this.goal = goal;
    }

    public String getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(String dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public boolean isGenerated() {
        return Boolean.TRUE.equals(generated);
    }

    public void setGenerated(boolean generated) {
        this.generated = generated;
    }

    public int getPositionInDay() {
        return positionInDay == null ? 0 : positionInDay;
    }

    public void setPositionInDay(int positionInDay) {
        this.positionInDay = positionInDay;
    }

    public boolean isCompleted() {
        return Boolean.TRUE.equals(completed);
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public Long getCompletedSessionId() {
        return completedSessionId;
    }

    public void setCompletedSessionId(Long completedSessionId) {
        this.completedSessionId = completedSessionId;
    }

    public List<WorkoutPlanExercise> getExercises() {
        return exercises;
    }

    public void setExercises(List<WorkoutPlanExercise> exercises) {
        replaceExercises(exercises);
    }

    public void replaceExercises(List<WorkoutPlanExercise> replacements) {
        if (this.exercises == null) {
            this.exercises = new ArrayList<>();
        }
        this.exercises.clear();
        if (replacements == null) {
            return;
        }
        for (int index = 0; index < replacements.size(); index++) {
            WorkoutPlanExercise exercise = replacements.get(index);
            exercise.setPlan(this);
            exercise.setPositionIndex(index);
            this.exercises.add(exercise);
        }
    }

    public UserAccount getOwner() {
        return owner;
    }

    public void setOwner(UserAccount owner) {
        this.owner = owner;
    }
}
