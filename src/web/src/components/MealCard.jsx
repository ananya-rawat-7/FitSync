import { CheckCircle2 } from "lucide-react";
import { formatCompletedAt } from "../utils/workoutPlan.js";
import { formatMacro, mealTotals } from "../utils/nutrition.js";

export default function MealCard({ meal, day, onLog, onEdit, onRemove, logging }) {
  const totals = mealTotals(meal);
  const items = meal.items || [];
  const canLog = Boolean(day?.isToday) && !meal.logged;
  const title = meal.logged
    ? "This meal is already logged."
    : !day?.isToday
      ? "Only today's meals can be logged."
      : undefined;

  return (
    <div className={`planned-workout meal-card${meal.logged ? " is-completed" : ""}`}>
      <div className="planned-workout-heading">
        <strong>{meal.title}</strong>
        <span>{items.length} {items.length === 1 ? "food" : "foods"}</span>
        {meal.logged && (
          <span className="workout-done-badge">
            <CheckCircle2 /> Logged
          </span>
        )}
      </div>

      {meal.notes && <p className="planned-workout-note">{meal.notes}</p>}

      <ul className="plan-exercises">
        {items.map((item) => (
          <li key={item.id ?? `${item.foodId}-${item.name}`}>
            <strong>{item.name}</strong>
            <span>{formatMacro(item.grams)}</span>
          </li>
        ))}
      </ul>

      <div className="meal-macros">
        <span><strong>{Math.round(totals.calories)}</strong> kcal</span>
        <span><strong>{formatMacro(totals.protein)}</strong> P</span>
        <span><strong>{formatMacro(totals.carbs)}</strong> C</span>
        <span><strong>{formatMacro(totals.fat)}</strong> F</span>
      </div>

      {meal.loggedAt && (
        <p className="workout-logged-note">Logged {formatCompletedAt(meal.loggedAt)}</p>
      )}

      <div className="activity-actions">
        <button
          type="button"
          disabled={!canLog || logging}
          title={title}
          onClick={() => onLog(meal)}
        >
          {meal.logged ? "Logged" : logging ? "Logging…" : "Log meal"}
        </button>
        <button type="button" onClick={() => onEdit(meal)}>Edit</button>
        <button type="button" onClick={() => onRemove(meal)}>Remove</button>
      </div>
    </div>
  );
}
