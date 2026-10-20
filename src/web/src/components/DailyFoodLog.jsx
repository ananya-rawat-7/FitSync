import { Trash2 } from "lucide-react";
import { MEAL_SLOTS, mealSlotLabels } from "../constants/nutrition.js";
import { formatMacro } from "../utils/nutrition.js";

export default function DailyFoodLog({ entries, onRemove, deletingId }) {
  return (
    <section className="dashboard daily-log-panel">
      <div className="dashboard-top">
        <div><span className="dashboard-overline">TODAY'S LOG</span><h2>What you have eaten.</h2></div>
        <span>{entries.length} {entries.length === 1 ? "item" : "items"}</span>
      </div>
      {entries.length === 0 ? (
        <p className="activity-empty">Nothing logged yet. Log a planned meal to start your diary.</p>
      ) : (
        <div className="daily-log-groups">
          {MEAL_SLOTS.map((slot) => {
            const slotEntries = entries.filter((entry) => entry.mealSlot === slot);
            if (slotEntries.length === 0) return null;
            return (
              <div className="daily-log-group" key={slot}>
                <h3>{mealSlotLabels[slot]}</h3>
                <ul>
                  {slotEntries.map((entry) => (
                    <li key={entry.id}>
                      <span>
                        <strong>{entry.name}</strong>
                        <small>
                          {formatMacro(entry.grams)} · {Math.round(entry.calories)} kcal ·
                          {" "}P {formatMacro(entry.protein)} · C {formatMacro(entry.carbs)} · F {formatMacro(entry.fat)}
                        </small>
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${entry.name}`}
                        disabled={deletingId === entry.id}
                        onClick={() => onRemove(entry)}
                      >
                        <Trash2 />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
