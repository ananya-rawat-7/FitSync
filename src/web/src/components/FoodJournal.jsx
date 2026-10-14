import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Flame, Trash2 } from "lucide-react";
import WeeklyBarChart from "./WeeklyBarChart.jsx";
import { calorieApi } from "../services/api.js";
import { getWeeklyChartData } from "../utils/weeklyChart.js";

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const blankFoodForm = () => ({ foodName: "", mealType: "BREAKFAST", calories: "", consumedOn: today() });

export function getCalorieEstimate(profile, bmi) {
  if (!profile?.weightKg || !profile?.heightCm || !profile?.age || profile.age < 18) return null;

  const weight = Number(profile.weightKg);
  const height = Number(profile.heightCm);
  const age = Number(profile.age);
  const base = 10 * weight + 6.25 * height - 5 * age;
  const activityFactor = 1.2;
  let goalAdjustment = 0;

  if (profile.fitnessGoal === "LOSE_WEIGHT" && bmi !== null && bmi >= 25) goalAdjustment = -300;
  if (profile.fitnessGoal === "BUILD_STRENGTH") goalAdjustment = 150;

  const estimates = [
    (base - 161) * activityFactor + goalAdjustment,
    (base + 5) * activityFactor + goalAdjustment,
  ].map((value) => Math.max(0, Math.round(value / 50) * 50));

  return { minimum: Math.min(...estimates), maximum: Math.max(...estimates) };
}

export function useFoodJournal() {
  const [entries, setEntries] = useState([]);
  const [foodForm, setFoodForm] = useState(blankFoodForm);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState(null);

  const loadEntries = useCallback(async () => {
    setError("");
    try {
      setEntries(await calorieApi.list());
    } catch (failure) {
      setError(failure.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const submitFood = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const created = await calorieApi.create({
        ...foodForm,
        foodName: foodForm.foodName.trim(),
        calories: Number(foodForm.calories),
      });
      setEntries((current) => [created, ...current]);
      setFoodForm((current) => ({ ...blankFoodForm(), consumedOn: current.consumedOn }));
      setStatus("Food entry added.");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteFood = async (entry) => {
    setDeletingEntry(entry.id);
    setError("");
    setStatus("");
    try {
      await calorieApi.remove(entry.id);
      setEntries((current) => current.filter((item) => item.id !== entry.id));
      setStatus("Food entry removed.");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setDeletingEntry(null);
    }
  };

  const changeFoodField = (event) => {
    const { name, value } = event.target;
    setFoodForm((current) => ({ ...current, [name]: value }));
  };

  return { entries, foodForm, error, status, loading, saving, deletingEntry, submitFood, deleteFood, changeFoodField };
}

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

export default function FoodJournal({ profile }) {
  const { entries, foodForm, error, status, loading, saving, deletingEntry, submitFood, deleteFood, changeFoodField } = useFoodJournal();
  const todayKey = today();
  const todaysCalories = entries
    .filter((entry) => entry.consumedOn === todayKey)
    .reduce((total, entry) => total + entry.calories, 0);
  const bmi = profile?.weightKg && profile?.heightCm
    ? Number(profile.weightKg) / ((Number(profile.heightCm) / 100) ** 2)
    : null;
  const adultBmi = Number(profile?.age) >= 20 ? bmi : null;
  const calorieEstimate = getCalorieEstimate(profile, adultBmi);
  const calorieChart = getWeeklyChartData(
    entries,
    (entry) => entry.consumedOn,
    (entry) => entry.calories,
  );
  const calorieChartMax = Math.max(calorieEstimate?.maximum || 0, ...calorieChart.map((day) => day.value), 1);
  const calorieTargetMarker = calorieEstimate
    ? Math.min(100, Math.max(0, ((calorieEstimate.minimum + calorieEstimate.maximum) / 2) / calorieChartMax * 100))
    : null;

  return (
    <>
      <section className="dashboard calorie-tracker">
        <div className="dashboard-top"><div><span className="dashboard-overline">FOOD JOURNAL</span><h2>Count what you eat</h2></div><Flame /></div>
        <div className="calorie-summary">
          <div><span>LOGGED TODAY</span><strong>{todaysCalories.toLocaleString()} <small>kcal</small></strong></div>
          <div><span>ESTIMATED RANGE</span><strong>{calorieEstimate ? `${calorieEstimate.minimum.toLocaleString()}–${calorieEstimate.maximum.toLocaleString()}` : "—"} <small>kcal</small></strong></div>
        </div>
        <form className="calorie-entry-form" onSubmit={submitFood}>
          <label>Food or drink<input name="foodName" value={foodForm.foodName} onChange={changeFoodField} maxLength="100" required placeholder="e.g. oatmeal and berries" /></label>
          <label>Meal<select name="mealType" value={foodForm.mealType} onChange={changeFoodField}><option value="BREAKFAST">Breakfast</option><option value="LUNCH">Lunch</option><option value="DINNER">Dinner</option><option value="SNACK">Snack</option></select></label>
          <label>Calories (kcal)<input name="calories" type="number" min="1" max="10000" step="1" inputMode="numeric" value={foodForm.calories} onChange={changeFoodField} required /></label>
          <label>Date<input name="consumedOn" type="date" max={todayKey} value={foodForm.consumedOn} onChange={changeFoodField} required /></label>
          <button className="button button-small" type="submit" disabled={saving}>{saving ? "Adding…" : "Add food"} <ArrowUpRight /></button>
        </form>
        {error && <p className="form-message is-error" role="alert">{error}</p>}
        {status && <p className="form-message" role="status">{status}</p>}
        <h3 className="calorie-list-heading">Recent food entries</h3>
        <ul className="calorie-entry-list">
          <FoodEntryList
            entries={entries}
            loading={loading}
            todayKey={todayKey}
            deletingEntry={deletingEntry}
            onRemove={deleteFood}
          />
        </ul>
        <p className="calorie-note">Calories are user-entered estimates. Use food labels or a reliable nutrition source; this journal does not verify nutrition values.</p>
      </section>

      <WeeklyBarChart
        eyebrow="YOUR FOOD JOURNAL"
        title="Seven-day calorie chart."
        legend="Logged kcal"
        markerLegend="Estimated range"
        ariaLabel="Calories logged per day for the last seven days"
        data={calorieChart}
        maxValue={calorieChartMax}
        markerPercent={calorieTargetMarker}
        note="The horizontal reference is only a rough target estimate, when enough adult profile information is available."
      />
    </>
  );
}
