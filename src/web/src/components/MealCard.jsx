import { CheckCircle2 } from "lucide-react";
import { mealSlotLabels } from "../constants/nutrition.js";
import { formatMacro, mealTotals } from "../utils/nutrition.js";

export default function MealCard({ meal, future, onLog, onEdit, onRemove, logging }) {
  const totals = mealTotals(meal);
  const canLog = !meal.logged && !future;

  return (
    <article className={`meal-card${meal.logged ? " is-logged" : ""}`}>
      <div className="meal-card-heading">
        <span className="meal-slot">{mealSlotLabels[meal.mealSlot]}</span>
        <strong>{meal.title}</strong>
        {meal.logged && (
          <span className="workout-done-badge">
            <CheckCircle2 /> Logged
          </span>
        )}
      </div>

      {meal.notes && <p className="meal-note">{meal.notes}</p>}

      <ul className="meal-items">
        {meal.items.map((item) => (
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
        <p className="meal-logged-note">Logged {new Date(meal.loggedAt).toLocaleString()}</p>
      )}

      <div className="activity-actions">
        <button
          type="button"
          disabled={!canLog || logging}
          title={meal.logged ? "This meal is already logged." : future ? "A future meal cannot be logged." : undefined}
          onClick={() => onLog(meal)}
        >
          {meal.logged ? "Logged" : logging ? "Logging…" : "Log meal"}
        </button>
        <button type="button" onClick={() => onEdit(meal)}>Edit</button>
        <button type="button" onClick={() => onRemove(meal)}>Remove</button>
      </div>
    </article>
  );
}
