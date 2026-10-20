import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext.jsx";
import CelebrationModal from "../components/CelebrationModal.jsx";
import DailyFoodLog from "../components/DailyFoodLog.jsx";
import MacroSummary from "../components/MacroSummary.jsx";
import MealDayPanel from "../components/MealDayPanel.jsx";
import MealEditor from "../components/MealEditor.jsx";
import WaterTracker from "../components/WaterTracker.jsx";
import { mealSlotLabels } from "../constants/nutrition.js";
import { fitnessGoalLabels } from "../constants/profile.js";
import { getWeekDays, localDateKey } from "../constants/weeklyPlan.js";
import { authApi, foodApi, foodLogApi, mealPlanApi, waterApi } from "../services/api.js";
import { getMacroTargets, getMealGuidance, logTotals } from "../utils/nutrition.js";

export default function FoodJournalPage() {
  const { user } = useAuth();
  const accountKey = user?.id ?? user?.email ?? "current";
  const profileQuery = useQuery({
    queryKey: ["dashboard", accountKey, "profile"],
    queryFn: authApi.me,
    initialData: user,
    retry: false,
  });
  const profile = profileQuery.data ?? user;
  const goal = profile?.fitnessGoal || "";

  const [weekOffset, setWeekOffset] = useState(0);
  const [meals, setMeals] = useState([]);
  const [foods, setFoods] = useState([]);
  const [todayLog, setTodayLog] = useState([]);
  const [waterEntries, setWaterEntries] = useState([]);
  const [mealStatus, setMealStatus] = useState("Loading your meal week…");
  const [mealError, setMealError] = useState("");
  const [foodError, setFoodError] = useState("");
  const [logError, setLogError] = useState("");
  const [waterError, setWaterError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [editor, setEditor] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [loggingMealId, setLoggingMealId] = useState(null);
  const [loggingDay, setLoggingDay] = useState(false);
  const [deletingLogId, setDeletingLogId] = useState(null);
  const [savingWater, setSavingWater] = useState(false);
  const [deletingWaterId, setDeletingWaterId] = useState(null);

  const todayKey = localDateKey(new Date());
  const weekDays = getWeekDays(weekOffset);
  const weekStart = weekDays[0].key;
  const weekEnd = weekDays[6].key;
  const currentWeekDays = getWeekDays(0);
  const currentWeekStart = currentWeekDays[0].key;
  const currentWeekEnd = currentWeekDays[6].key;

  const mealsByDay = meals.reduce((groups, meal) => {
    const key = localDateKey(meal.plannedDate);
    if (!groups[key]) groups[key] = [];
    groups[key].push(meal);
    return groups;
  }, {});

  const bmi = profile?.weightKg && profile?.heightCm
    ? Number(profile.weightKg) / ((Number(profile.heightCm) / 100) ** 2)
    : null;
  const adultBmi = Number(profile?.age) >= 20 ? bmi : null;
  const macroTargets = getMacroTargets(profile, adultBmi);

  const loadMeals = useCallback(async () => {
    setMealError("");
    setMealStatus("Loading your meal week…");
    try {
      setMeals(await mealPlanApi.list(weekStart, weekEnd));
      setMealStatus("Your meal week is ready.");
    } catch (failure) {
      setMealError(failure.message);
      setMealStatus("Could not load meals");
    }
  }, [weekStart, weekEnd]);

  const loadFoods = useCallback(async () => {
    setFoodError("");
    try {
      setFoods(await foodApi.list());
    } catch (failure) {
      setFoodError(failure.message);
    }
  }, []);

  const loadTodayLog = useCallback(async () => {
    setLogError("");
    try {
      setTodayLog(await foodLogApi.list(todayKey, todayKey));
    } catch (failure) {
      setLogError(failure.message);
    }
  }, [todayKey]);

  const loadWater = useCallback(async () => {
    setWaterError("");
    try {
      setWaterEntries(await waterApi.list(currentWeekStart, currentWeekEnd));
    } catch (failure) {
      setWaterError(failure.message);
    }
  }, [currentWeekStart, currentWeekEnd]);

  useEffect(() => { loadMeals(); }, [loadMeals]);
  useEffect(() => { loadFoods(); }, [loadFoods]);
  useEffect(() => { loadTodayLog(); }, [loadTodayLog]);
  useEffect(() => { loadWater(); }, [loadWater]);

  const buildWeek = async () => {
    setMealError("");
    setGenerating(true);
    try {
      await mealPlanApi.generateWeek(weekStart);
      await loadMeals();
      setMealStatus("Your goal-based meal week is ready.");
    } catch (failure) {
      setMealError(failure.message);
    } finally {
      setGenerating(false);
    }
  };

  const openMealEditor = (dateKey, mealSlot, meal = null) => {
    setEditor({ dateKey, mealSlot, meal });
  };
  const closeEditor = () => setEditor(null);

  const handleMealSaved = async () => {
    await loadMeals();
    setEditor(null);
    setMealError("");
    setMealStatus("Your meal has been saved.");
  };

  const handleFoodCreated = (created) => {
    setFoods((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const logMeal = async (meal) => {
    setMealError("");
    setLoggingMealId(meal.id);
    try {
      await mealPlanApi.log(meal.id);
      await Promise.all([loadMeals(), loadTodayLog()]);
      setCelebration({
        title: "CONGO!",
        message: `${mealSlotLabels[meal.mealSlot]} is logged. Great work!`,
      });
      setMealStatus("Meal logged.");
    } catch (failure) {
      setMealError(failure.message);
    } finally {
      setLoggingMealId(null);
    }
  };

  const logDay = async (day) => {
    setMealError("");
    setLoggingDay(true);
    try {
      await mealPlanApi.logDay(day.key);
      await Promise.all([loadMeals(), loadTodayLog()]);
      setCelebration({
        title: "CONGO!",
        message: `All meals for ${day.label} are logged!`,
      });
      setMealStatus("Day logged.");
    } catch (failure) {
      setMealError(failure.message);
    } finally {
      setLoggingDay(false);
    }
  };

  const removeMeal = async (meal) => {
    if (!window.confirm(`Remove "${meal.title}" from this day?`)) return;
    try {
      await mealPlanApi.remove(meal.id);
      await loadMeals();
      setMealStatus("Meal removed from your plan.");
    } catch (failure) {
      setMealError(failure.message);
    }
  };

  const removeLog = async (entry) => {
    setLogError("");
    setDeletingLogId(entry.id);
    try {
      await foodLogApi.remove(entry.id);
      await Promise.all([loadTodayLog(), loadMeals()]);
      setMealStatus("Diary entry removed.");
    } catch (failure) {
      setLogError(failure.message);
    } finally {
      setDeletingLogId(null);
    }
  };

  const addWater = async (milliliters) => {
    setWaterError("");
    setSavingWater(true);
    try {
      await waterApi.create({ loggedOn: todayKey, milliliters });
      await loadWater();
    } catch (failure) {
      setWaterError(failure.message);
    } finally {
      setSavingWater(false);
    }
  };

  const removeWater = async (entry) => {
    setWaterError("");
    setDeletingWaterId(entry.id);
    try {
      await waterApi.remove(entry.id);
      await loadWater();
    } catch (failure) {
      setWaterError(failure.message);
    } finally {
      setDeletingWaterId(null);
    }
  };

  return (
    <main className="page-main section-wrap">
      <div className="page-heading">
        <div>
          <p className="eyebrow">NUTRITION, PLANNED.</p>
          <h1>FOOD <span>JOURNAL.</span></h1>
          <p>Plan a goal-based week, log meals, and keep an eye on macros and water.</p>
        </div>
        <span className="activity-status" role="status">{mealStatus}</span>
      </div>
      {profileQuery.error && <p className="form-message is-error" role="alert">{profileQuery.error.message}</p>}

      <section className="dashboard meal-week-panel">
        <div className="dashboard-top">
          <div><span className="dashboard-overline">PLAN AHEAD</span><h2>Your week</h2></div>
          <div className="week-nav" aria-label="Meal week navigation">
            <button type="button" className="week-nav-button" aria-label="Previous week" onClick={() => setWeekOffset((value) => value - 1)}><ChevronLeft /></button>
            <span className="week-range">{weekDays[0].dateLabel} – {weekDays[6].dateLabel}</span>
            <button type="button" className="week-nav-button" aria-label="Next week" onClick={() => setWeekOffset((value) => value + 1)}><ChevronRight /></button>
            {weekOffset !== 0 && <button type="button" className="text-button" onClick={() => setWeekOffset(0)}>This week</button>}
          </div>
        </div>

        <div className="week-builder meal-week-builder">
          <div>
            <p className="week-builder-goal">Goal: <strong>{fitnessGoalLabels[goal] || "Not set yet"}</strong></p>
            <p className="week-builder-note">{getMealGuidance(goal)}</p>
            {!goal && <p className="week-builder-note">Add a fitness target in Profile to tailor the meal week. Without one, FitSync builds a balanced menu.</p>}
          </div>
          <button className="button button-small" type="button" onClick={buildWeek} disabled={generating}>{generating ? "Building…" : "Build my week"}</button>
        </div>

        {mealError && <p className="form-message is-error" role="alert">{mealError}</p>}
        {foodError && <p className="form-message is-error" role="alert">{foodError}</p>}

        <div className="meal-week-list">
          {weekDays.map((day) => (
            <MealDayPanel
              key={day.key}
              day={day}
              meals={mealsByDay[day.key] || []}
              onAddMeal={openMealEditor}
              onEditMeal={(meal) => openMealEditor(meal.plannedDate, meal.mealSlot, meal)}
              onRemoveMeal={removeMeal}
              onLogMeal={logMeal}
              onLogDay={logDay}
              loggingMealId={loggingMealId}
              loggingDay={loggingDay}
            />
          ))}
        </div>
        <p className="workout-plan-note">Generated meals fill empty slots and preserve meals you logged or added yourself. Future meals can be planned and edited, but only today or earlier can be logged.</p>
      </section>

      <MacroSummary totals={logTotals(todayLog)} target={macroTargets} />

      <DailyFoodLog entries={todayLog} onRemove={removeLog} deletingId={deletingLogId} />
      {logError && <p className="form-message is-error" role="alert">{logError}</p>}

      {waterError && <p className="form-message is-error" role="alert">{waterError}</p>}
      <WaterTracker
        weekDays={currentWeekDays}
        entries={waterEntries}
        todayKey={todayKey}
        onAdd={addWater}
        onRemove={removeWater}
        saving={savingWater}
        deletingId={deletingWaterId}
      />

      <MealEditor
        open={Boolean(editor)}
        meal={editor?.meal || null}
        dateKey={editor?.dateKey || weekStart}
        mealSlot={editor?.mealSlot || "BREAKFAST"}
        foods={foods}
        onClose={closeEditor}
        onSaved={handleMealSaved}
        onFoodCreated={handleFoodCreated}
      />

      <CelebrationModal
        open={Boolean(celebration)}
        title={celebration?.title}
        message={celebration?.message}
        onClose={() => setCelebration(null)}
      />
    </main>
  );
}
