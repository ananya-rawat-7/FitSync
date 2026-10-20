package com.fitsync.api.nutrition;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "meal_templates",
        uniqueConstraints = @UniqueConstraint(name = "uk_meal_templates_group_day_slot",
                columnNames = {"menu_group", "day_index", "meal_slot"}))
public class MealTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "menu_group", nullable = false, length = 32)
    private MenuGroup menuGroup;

    @Column(name = "day_index", nullable = false)
    private int dayIndex;

    @Enumerated(EnumType.STRING)
    @Column(name = "meal_slot", nullable = false, length = 20)
    private MealSlot mealSlot;

    @NotBlank
    @Size(max = 120)
    private String title;

    @Size(max = 500)
    private String note;

    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("positionIndex ASC")
    private List<MealTemplateItem> items = new ArrayList<>();

    protected MealTemplate() {
    }

    public Long getId() {
        return id;
    }

    public MenuGroup getMenuGroup() {
        return menuGroup;
    }

    public void setMenuGroup(MenuGroup menuGroup) {
        this.menuGroup = menuGroup;
    }

    public int getDayIndex() {
        return dayIndex;
    }

    public void setDayIndex(int dayIndex) {
        this.dayIndex = dayIndex;
    }

    public MealSlot getMealSlot() {
        return mealSlot;
    }

    public void setMealSlot(MealSlot mealSlot) {
        this.mealSlot = mealSlot;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public List<MealTemplateItem> getItems() {
        return items;
    }

    public void replaceItems(List<MealTemplateItem> replacements) {
        if (this.items == null) {
            this.items = new ArrayList<>();
        }
        this.items.clear();
        if (replacements == null) {
            return;
        }
        for (int index = 0; index < replacements.size(); index++) {
            MealTemplateItem item = replacements.get(index);
            item.setTemplate(this);
            item.setPositionIndex(index);
            this.items.add(item);
        }
    }
}
