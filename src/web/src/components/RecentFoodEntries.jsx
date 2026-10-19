import { Trash2 } from "lucide-react";

function FoodEntryList({ entries, loading, todayKey, deletingEntry, onRemove }) {
  if (loading) return <li className="calorie-empty">Loading food entries…</li>;
  if (entries.length === 0) return <li className="calorie-empty">No food logged yet.</li>;

  return entries.slice(0, 10).map((entry) => (
    <li key={entry.id}>
      <span><strong>{entry.foodName}</strong><small>{entry.consumedOn === todayKey ? "" : `${entry.consumedOn} · `}{entry.mealType.toLowerCase()} · {entry.calories.toLocaleString()} kcal</small></span>
      <button type="button" aria-label={`Remove ${entry.foodName}`} disabled={deletingEntry === entry.id} onClick={() => onRemove(entry)}><Trash2 /></button>
    </li>
  ));
}

export default function RecentFoodEntries({ entries, loading, todayKey, deletingEntry, onRemove }) {
  return (
    <section className="dashboard chart-panel">
      <div className="dashboard-top">
        <div>
          <span className="dashboard-overline">FOOD JOURNAL</span>
          <h2>Recent food entries</h2>
        </div>
      </div>
      <ul className="calorie-entry-list">
        <FoodEntryList
          entries={entries}
          loading={loading}
          todayKey={todayKey}
          deletingEntry={deletingEntry}
          onRemove={onRemove}
        />
      </ul>
    </section>
  );
}
