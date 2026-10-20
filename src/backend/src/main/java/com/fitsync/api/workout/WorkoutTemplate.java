package com.fitsync.api.workout;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "workout_templates",
        uniqueConstraints = @UniqueConstraint(name = "uk_workout_templates_goal_day",
                columnNames = {"goal", "day_index"}))
public class WorkoutTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 32)
    private String goal;

    @Column(name = "day_index", nullable = false)
    private int dayIndex;

    @NotBlank
    @Size(max = 100)
    private String title;

    @NotBlank
    @Size(max = 50)
    private String category;

    @Min(1)
    @Max(1440)
    private int durationMinutes;

    @Size(max = 500)
    private String note;

    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("positionIndex ASC")
    private List<WorkoutTemplateExercise> exercises = new ArrayList<>();

    protected WorkoutTemplate() {
    }

    public Long getId() {
        return id;
    }

    public String getGoal() {
        return goal;
    }

    public void setGoal(String goal) {
        this.goal = goal;
    }

    public int getDayIndex() {
        return dayIndex;
    }

    public void setDayIndex(int dayIndex) {
        this.dayIndex = dayIndex;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public List<WorkoutTemplateExercise> getExercises() {
        return exercises;
    }

    public void replaceExercises(List<WorkoutTemplateExercise> replacements) {
        if (this.exercises == null) {
            this.exercises = new ArrayList<>();
        }
        this.exercises.clear();
        if (replacements == null) {
            return;
        }
        for (int index = 0; index < replacements.size(); index++) {
            WorkoutTemplateExercise exercise = replacements.get(index);
            exercise.setTemplate(this);
            exercise.setPositionIndex(index);
            this.exercises.add(exercise);
        }
    }
}
