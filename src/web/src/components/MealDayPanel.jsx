import { nutrientTotals, formatMacro } from "../utils/nutrition.js";
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
  const sortedMeals = [...meals].sort(
    (first, second) => (first.positionInDay ?? 0) - (second.positionInDay ?? 0),
  );
  const totals = nutrientTotals(sortedMeals.flatMap((meal) => meal.items || []));
  const loggedCount = sortedMeals.filter((meal) => meal.logged).length;
  const allLogged = sortedMeals.length > 0 && loggedCount === sortedMeals.length;
  const canLogDay = Boolean(day.isToday) && sortedMeals.length > 0 && !allLogged;
  const logDayTitle = !day.isToday
    ? "Only today's meals can be logged."
    : allLogged
      ? "All meals are already logged."
      : undefined;

  return (
    <article className={`week-day meal-day${day.isToday ? " is-today" : ""}${day.isPast ? " is-past" : ""}`}>
      <header className="week-day-header">
        <span>{day.label}</span>
        <small>{day.dateLabel}</small>
      </header>

      <div className="meal-day-totals">
        <span><strong>{Math.round(totals.calories)}</strong> kcal</span>
        <span>P {formatMacro(totals.protein)} · C {formatMacro(totals.carbs)} · F {formatMacro(totals.fat)}</span>
        <span>{loggedCount}/{sortedMeals.length} logged</span>
      </div>

      {sortedMeals.length === 0 ? (
        <div className="week-day-empty">
          <p>Rest / no meals planned.</p>
          <button type="button" className="text-button" onClick={() => onAddMeal(day.key)}>+ Add meal</button>
        </div>
      ) : (
        <>
          <button
            type="button"
            className="text-button week-day-edit"
            disabled={!canLogDay || loggingDay}
            title={logDayTitle}
            onClick={() => onLogDay(day)}
          >
            {loggingDay ? "Logging…" : "Log all meals"}
          </button>
          {sortedMeals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              day={day}
              onLog={onLogMeal}
              onEdit={onEditMeal}
              onRemove={onRemoveMeal}
              logging={loggingMealId === meal.id}
            />
          ))}
          <button type="button" className="text-button week-day-add" onClick={() => onAddMeal(day.key)}>+ Add meal</button>
        </>
      )}
    </article>
  );
}
