import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Flame } from "lucide-react";
import RecentFoodEntries from "./RecentFoodEntries.jsx";
import WeeklyBarChart from "./WeeklyBarChart.jsx";
import { calorieApi } from "../services/api.js";
import { foodCalories } from "../constants/foodCalories.js";
import { getWeeklyChartData } from "../utils/weeklyChart.js";

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const blankFoodForm = () => ({ foodName: "", mealType: "BREAKFAST", grams: "", calories: "", consumedOn: today() });

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

  const submitFood = async (event, { foodName, calories }) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const created = await calorieApi.create({
        foodName: foodName.trim(),
        mealType: foodForm.mealType,
        calories,
        consumedOn: foodForm.consumedOn,
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

export default function FoodJournal({ profile }) {
  const { entries, foodForm, error, status, loading, saving, deletingEntry, submitFood, deleteFood, changeFoodField } = useFoodJournal();
  const [otherFood, setOtherFood] = useState(false);
  const todayKey = today();
  const selectedFood = foodCalories.find(
    (food) => food.name.toLowerCase() === foodForm.foodName.trim().toLowerCase(),
  );
  const grams = Number(foodForm.grams);
  const calculatedCalories = selectedFood && grams > 0
    ? Math.round(selectedFood.caloriesPer100g * grams / 100)
    : null;
  const caloriesToLog = otherFood ? Number(foodForm.calories) : calculatedCalories;
  const canSubmit = otherFood
    ? foodForm.foodName.trim().length > 0 && foodForm.calories !== "" && caloriesToLog >= 0 && caloriesToLog <= 10000
    : Boolean(selectedFood && grams > 0 && calculatedCalories >= 0 && calculatedCalories <= 10000);
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
        <form className="calorie-entry-form" onSubmit={(event) => submitFood(event, {
          foodName: foodForm.foodName,
          calories: caloriesToLog,
        })}>
          <label className="calorie-food-field">{otherFood ? "Food or drink" : "Search foods"}
            <span className="calorie-food-picker">
              <input
                name="foodName"
                type={otherFood ? "text" : "search"}
                list={otherFood ? undefined : "fitsync-food-calories"}
                value={foodForm.foodName}
                onChange={changeFoodField}
                maxLength="100"
                required
                placeholder={otherFood ? "Enter a food not listed" : "Search the food list"}
              />
              <datalist id="fitsync-food-calories">
                {foodCalories.map((food) => (
                  <option
                    key={food.name}
                    value={food.name}
                    label={`${food.category} · ${food.caloriesPer100g} kcal / 100 g`}
                  />
                ))}
              </datalist>
              <button
                className="food-mode-toggle"
                type="button"
                aria-pressed={otherFood}
                onClick={() => setOtherFood((current) => !current)}
              >
                {otherFood ? "Search list" : "Other food"}
              </button>
            </span>
          </label>
          <label>Meal<select name="mealType" value={foodForm.mealType} onChange={changeFoodField}><option value="BREAKFAST">Breakfast</option><option value="LUNCH">Lunch</option><option value="DINNER">Dinner</option><option value="SNACK">Snack</option></select></label>
          {!otherFood && <label>Amount (g)<input name="grams" type="number" min="1" max="10000" step="1" inputMode="numeric" value={foodForm.grams} onChange={changeFoodField} required /></label>}
          <label>Date<input name="consumedOn" type="date" max={todayKey} value={foodForm.consumedOn} onChange={changeFoodField} required /></label>
          {otherFood && <label className="calorie-manual-entry">Total estimated calories (kcal)<input name="calories" type="number" min="0" max="10000" step="1" inputMode="numeric" value={foodForm.calories} onChange={changeFoodField} required /></label>}
          <button className="button button-small" type="submit" disabled={saving || !canSubmit}>{saving ? "Adding…" : "Add food"} <ArrowUpRight /></button>
          {!otherFood && selectedFood && calculatedCalories !== null && (
            calculatedCalories <= 10000 ? (
              <p className="calorie-estimate" role="status">
                Estimated calories: <strong>{calculatedCalories.toLocaleString()} kcal</strong>
                {" "}· {selectedFood.caloriesPer100g} kcal per 100 g
              </p>
            ) : (
              <p className="calorie-estimate" role="alert">Reduce the amount; a single entry cannot exceed 10,000 kcal.</p>
            )
          )}
          {!otherFood && !selectedFood && foodForm.foodName.trim() && (
            <p className="calorie-estimate">Select a food from the list, or choose “Other food” to enter calories manually.</p>
          )}
        </form>
        {error && <p className="form-message is-error" role="alert">{error}</p>}
        {status && <p className="form-message" role="status">{status}</p>}
        <p className="calorie-note">{otherFood ? "For other foods, enter the estimated calories for the total amount you ate or drank, not per 100 g." : "Catalog calories are estimates from the provided food list and are calculated per 100 g. For foods not listed, choose “Other food” and enter the calories for your total amount."}</p>
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
      <RecentFoodEntries
        entries={entries}
        loading={loading}
        todayKey={todayKey}
        deletingEntry={deletingEntry}
        onRemove={deleteFood}
      />
    </>
  );
}
