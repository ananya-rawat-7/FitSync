import { CheckCircle2 } from "lucide-react";
import { MEAL_SLOTS, mealSlotLabels } from "../constants/nutrition.js";
import { nutrientTotals } from "../utils/nutrition.js";
import MealCard from "./MealCard.jsx";

export default function MealDayPanel({
  day,
  meals,
  onAddMeal,
  onEditMeal,
  onRemoveMeal,
  onLogMeal,
  onLogDay,
  loggingMealId,
  loggingDay,
}) {
  const totals = nutrientTotals(meals.flatMap((meal) => meal.items || []));
  const loggedCount = meals.filter((meal) => meal.logged).length;
  const allLogged = meals.length > 0 && loggedCount === meals.length;
  const canLogDay = !day.isFuture && meals.length > 0 && !allLogged;

  return (
    <section className={`meal-day${day.isToday ? " is-today" : ""}${day.isPast ? " is-past" : ""}${day.isFuture ? " is-future" : ""}`}>
      <header className="meal-day-header">
        <div className="meal-day-heading">
          <span>{day.label}</span>
          <small>{day.dateLabel}</small>
        </div>
        <div className="meal-day-totals">
          <span><strong>{Math.round(totals.calories)}</strong> kcal</span>
          <span>P {totals.protein} · C {totals.carbs} · F {totals.fat}</span>
          <span>{loggedCount}/{meals.length} logged</span>
        </div>
        <button
          className="button button-small button-outline"
          type="button"
          disabled={!canLogDay || loggingDay}
          title={day.isFuture ? "A future day cannot be logged." : allLogged ? "All meals are already logged." : undefined}
          onClick={() => onLogDay(day)}
        >
          {loggingDay ? "Logging…" : "Log all meals"} <CheckCircle2 />
        </button>
      </header>

      <div className="meal-slots">
        {MEAL_SLOTS.map((slot) => {
          const meal = meals.find((item) => item.mealSlot === slot);
          if (!meal) {
            return (
              <button
                type="button"
                className="meal-slot-empty"
                key={slot}
                onClick={() => onAddMeal(day.key, slot)}
              >
                + Add {mealSlotLabels[slot].toLowerCase()}
              </button>
            );
          }
          return (
            <MealCard
              key={meal.id}
              meal={meal}
              future={day.isFuture}
              onLog={onLogMeal}
              onEdit={onEditMeal}
              onRemove={onRemoveMeal}
              logging={loggingMealId === meal.id}
            />
          );
        })}
      </div>
    </section>
  );
}
