import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowUpRight, Check, Flame, HeartPulse, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { authApi, calorieApi, workoutApi } from "../services/api.js";

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const blankFoodForm = () => ({ foodName: "", mealType: "BREAKFAST", calories: "", consumedOn: today() });

const fitnessGoalLabels = {
  BUILD_STRENGTH: "build strength",
  LOSE_WEIGHT: "lose weight gradually",
  IMPROVE_ENDURANCE: "improve endurance",
  IMPROVE_FLEXIBILITY: "improve flexibility",
  MAINTAIN_FITNESS: "maintain fitness",
  OTHER: "build a steady fitness routine",
};

function getAdultBmi(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  return weightKg / ((heightCm / 100) ** 2);
}

function getBmiCategory(bmi) {
  if (bmi < 18.5) return { label: "Below adult reference range", className: "bmi-low" };
  if (bmi < 25) return { label: "Within adult reference range", className: "bmi-standard" };
  if (bmi < 30) return { label: "Above adult reference range", className: "bmi-raised" };
  return { label: "High adult reference range", className: "bmi-high" };
}

function getCalorieEstimate(profile, bmi) {
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

function getDietPlan(goal, bmi) {
  const plan = [
    { name: "Breakfast", share: 25, example: "Oats or whole-grain toast with fruit and a protein food" },
    { name: "Lunch", share: 30, example: "Vegetables, a whole grain, and beans, eggs, fish, or another protein" },
    { name: "Snack", share: 15, example: "Fruit with yogurt, nuts, or another satisfying snack" },
    { name: "Dinner", share: 30, example: "Vegetables with a protein food and grains or potatoes" },
  ];

  if (goal === "BUILD_STRENGTH") {
    plan[0].example = "Oats or whole-grain toast with fruit and eggs, yogurt, or another protein";
    plan[2].example = "A convenient protein food with fruit or whole grains";
  }
  if (goal === "IMPROVE_ENDURANCE") {
    plan[0].example = "Oats, whole-grain toast, or another carbohydrate-rich choice with fruit";
    plan[2].example = "Fruit, yogurt, or another snack that suits your training schedule";
  }
  if (bmi !== null && bmi < 18.5) {
    plan[0].example = "Oats or whole-grain toast with fruit, yogurt, eggs, or another satisfying protein food";
    plan[2].example = "A nourishing, energy-rich snack such as yogurt with fruit and nuts";
  }

  return plan;
}

function getDietGuidance(goal, bmi) {
  if (bmi !== null && bmi < 18.5) {
    return "Your BMI is below the adult reference range. These balanced meal ideas do not set a weight-loss target; ask a qualified health professional for personal nutrition advice.";
  }
  if (goal === "LOSE_WEIGHT" && bmi !== null && bmi >= 25) {
    return "For your selected focus, these ideas emphasize satisfying meals with vegetables, fiber-rich foods, and a protein source—not restriction or rapid weight loss.";
  }
  if (goal === "LOSE_WEIGHT") {
    return "These are balanced meal ideas, not a weight-loss diet. Add your details in Profile for an adult reference estimate before discussing personal goals with a professional.";
  }
  return "Flexible, balanced meal ideas shaped by your selected focus and profile—not a prescriptive diet or medical nutrition plan.";
}

function getFitnessPlan(goal, bmi) {
  const focus = fitnessGoalLabels[goal] || fitnessGoalLabels.MAINTAIN_FITNESS;
  const sessions = goal === "IMPROVE_FLEXIBILITY"
    ? "Try 3 gentle mobility sessions and 2 comfortable walks this week."
    : goal === "IMPROVE_ENDURANCE"
      ? "Try 3 easy-to-moderate cardio sessions, with rest or gentle movement between them."
      : goal === "BUILD_STRENGTH"
        ? "Try 2 or 3 full-body strength sessions, with recovery days between sessions."
        : "Try 2 strength sessions and a few comfortable walks, then build up at your own pace.";

  if (bmi !== null && bmi < 18.5) {
    return `${sessions} Prioritize recovery and speak with a qualified health professional before pursuing weight-change goals.`;
  }
  return `${sessions} Gradually work toward general adult activity guidance of 150 minutes of moderate movement per week, if appropriate for you.`;
}

function getStats(workouts) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const recent = workouts.filter((item) => new Date(item.performedAt) >= start && new Date(item.performedAt) <= now);
  const activeDays = new Set(recent.map((item) => new Date(item.performedAt).toDateString()));
  return {
    recent,
    minutes: recent.reduce((sum, item) => sum + Number(item.durationMinutes), 0),
    activeDays: activeDays.size,
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [calorieEntries, setCalorieEntries] = useState([]);
  const [profile, setProfile] = useState(user);
  const [foodForm, setFoodForm] = useState(blankFoodForm);
  const [error, setError] = useState("");
  const [calorieError, setCalorieError] = useState("");
  const [calorieStatus, setCalorieStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingFood, setSavingFood] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      workoutApi.list().then((data) => { if (active) setWorkouts(data); })
        .catch((failure) => { if (active) setError(failure.message); }),
      calorieApi.list().then((data) => { if (active) setCalorieEntries(data); })
        .catch((failure) => { if (active) setCalorieError(failure.message); }),
      authApi.me().then((data) => { if (active) setProfile(data); })
        .catch(() => { if (active) setProfile(user); }),
    ]).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);

  const stats = getStats(workouts);
  const bmi = getAdultBmi(Number(profile?.weightKg), Number(profile?.heightCm));
  const adultBmi = Number(profile?.age) >= 20 ? bmi : null;
  const bmiCategory = adultBmi === null ? null : getBmiCategory(adultBmi);
  const calorieEstimate = getCalorieEstimate(profile, adultBmi);
  const todayKey = today();
  const todaysEntries = calorieEntries.filter((entry) => entry.consumedOn === todayKey);
  const todaysCalories = todaysEntries.reduce((total, entry) => total + entry.calories, 0);
  const dietPlan = useMemo(() => getDietPlan(profile?.fitnessGoal, adultBmi), [profile?.fitnessGoal, adultBmi]);
  const dietGuidance = getDietGuidance(profile?.fitnessGoal, adultBmi);
  const fitnessPlan = getFitnessPlan(profile?.fitnessGoal, adultBmi);
  const calorieChart = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - 6 + index);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return {
      key,
      label: date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1),
      total: calorieEntries.filter((entry) => entry.consumedOn === key)
        .reduce((sum, entry) => sum + entry.calories, 0),
    };
  });
  const calorieChartMax = Math.max(calorieEstimate?.maximum || 0, ...calorieChart.map((day) => day.total), 1);
  const calorieTargetMarker = calorieEstimate
    ? Math.min(100, Math.max(0, ((calorieEstimate.minimum + calorieEstimate.maximum) / 2) / calorieChartMax * 100))
    : null;
  const workoutBars = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - 6 + index);
    return {
      label: day.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1),
      minutes: stats.recent.filter((item) => new Date(item.performedAt).toDateString() === day.toDateString())
        .reduce((sum, item) => sum + Number(item.durationMinutes), 0),
    };
  });
  const workoutChartMax = Math.max(1, ...workoutBars.map((bar) => bar.minutes));

  const submitFood = async (event) => {
    event.preventDefault();
    setSavingFood(true);
    setCalorieError("");
    setCalorieStatus("");
    try {
      const created = await calorieApi.create({
        ...foodForm,
        foodName: foodForm.foodName.trim(),
        calories: Number(foodForm.calories),
      });
      setCalorieEntries((current) => [created, ...current]);
      setFoodForm((current) => ({ ...blankFoodForm(), consumedOn: current.consumedOn }));
      setCalorieStatus("Food entry added.");
    } catch (failure) {
      setCalorieError(failure.message);
    } finally {
      setSavingFood(false);
    }
  };

  const deleteFood = async (entry) => {
    setDeletingEntry(entry.id);
    setCalorieError("");
    setCalorieStatus("");
    try {
      await calorieApi.remove(entry.id);
      setCalorieEntries((current) => current.filter((item) => item.id !== entry.id));
      setCalorieStatus("Food entry removed.");
    } catch (failure) {
      setCalorieError(failure.message);
    } finally {
      setDeletingEntry(null);
    }
  };

  const changeFoodField = (event) => {
    const { name, value } = event.target;
    setFoodForm((current) => ({ ...current, [name]: value }));
  };

  return (
    <main className="page-main section-wrap">
      <div className="page-heading"><div><p className="eyebrow">PROGRESS, NOT PRESSURE</p><h1>YOUR <span>ACTIVITY.</span></h1><p>Your private workout, nutrition, and progress reports.</p></div><Link className="button" to="/workouts">Log a workout <ArrowUpRight /></Link></div>
      {(error || calorieError) && <p className="form-message is-error" role="alert">{error || calorieError}</p>}
      {loading ? <p className="status-message" role="status">Loading your reports…</p> : (
        <>
          <section className="stat-grid dashboard-stats" aria-label="Workout statistics">
            <div className="stat-tile"><span>WORKOUTS</span><strong>{String(stats.recent.length).padStart(2, "0")}</strong><small>last 7 days</small></div>
            <div className="stat-tile"><span>ACTIVE MIN</span><strong>{stats.minutes}</strong><small>last 7 days</small></div>
            <div className="stat-tile"><span>ACTIVE DAYS</span><strong>{stats.activeDays}</strong><small>last 7 days</small></div>
            <div className="stat-tile stat-highlight"><span>TODAY'S CALORIES</span><strong>{todaysCalories.toLocaleString()}</strong><small>logged food calories</small></div>
          </section>

          <section className="dashboard health-report">
            <div className="dashboard-top"><div><span className="dashboard-overline">BODY & ENERGY REPORT</span><h2>Your personal estimates</h2></div><HeartPulse /></div>
            <div className="health-report-grid">
              <article className="bmi-report">
                <span className="dashboard-overline">ADULT BMI REFERENCE</span>
                {adultBmi === null ? (
                  <p className="insight-empty">{Number(profile?.age) > 0 && Number(profile.age) < 20
                    ? "Adult BMI categories are not intended for people under 20. Ask a qualified health professional for an age-appropriate assessment."
                    : <>Add your height, weight, and age in <Link to="/profile">Profile</Link> to see your adult BMI reference.</>}</p>
                ) : (
                  <>
                    <strong className="bmi-value">{adultBmi.toFixed(1)}</strong>
                    <span className={`bmi-category ${bmiCategory.className}`}>{bmiCategory.label}</span>
                    <p>BMI is a rough screening measure based on height and weight, not a diagnosis or a complete health assessment.</p>
                  </>
                )}
                {profile?.age && Number(profile.age) < 20 && <p>Adult BMI categories are not intended for people under 20. Ask a qualified health professional for an age-appropriate assessment.</p>}
              </article>
              <article className="calorie-target-report">
                <span className="dashboard-overline">ROUGH DAILY ENERGY STARTING POINT</span>
                {calorieEstimate ? (
                  <>
                    <strong>{calorieEstimate.minimum.toLocaleString()}–{calorieEstimate.maximum.toLocaleString()} <small>kcal/day</small></strong>
                    <p>Broad maintenance range using two common adult equations and a mostly sedentary baseline. Your needs vary; this is not a prescribed intake or medical advice.</p>
                    {profile.fitnessGoal === "LOSE_WEIGHT" && adultBmi < 25 && <p>A weight-loss calorie reduction is not applied to this estimate. Consider discussing personal goals with a qualified health professional.</p>}
                  </>
                ) : (
                  <p className="insight-empty">Add your weight, height, and age (18+) in <Link to="/profile">Profile</Link> for a rough adult estimate.</p>
                )}
              </article>
            </div>
            <p className="health-disclaimer">BMI and calorie figures are general educational estimates only. They may not be suitable during pregnancy, for young people, or with medical conditions or a history of disordered eating. Ask a qualified health professional for personal advice.</p>
          </section>

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
              <button className="button button-small" type="submit" disabled={savingFood}>{savingFood ? "Adding…" : "Add food"} <ArrowUpRight /></button>
            </form>
            {calorieError && <p className="form-message is-error" role="alert">{calorieError}</p>}
            {calorieStatus && <p className="form-message" role="status">{calorieStatus}</p>}
            <h3 className="calorie-list-heading">Recent food entries</h3>
            <ul className="calorie-entry-list">
              {calorieEntries.length === 0 ? <li className="calorie-empty">No food logged yet.</li> : calorieEntries.slice(0, 10).map((entry) => (
                <li key={entry.id}>
                  <span><strong>{entry.foodName}</strong><small>{entry.consumedOn === todayKey ? "" : `${entry.consumedOn} · `}{entry.mealType.toLowerCase()} · {entry.calories.toLocaleString()} kcal</small></span>
                  <button type="button" aria-label={`Remove ${entry.foodName}`} disabled={deletingEntry === entry.id} onClick={() => deleteFood(entry)}><Trash2 /></button>
                </li>
              ))}
            </ul>
            <p className="calorie-note">Calories are user-entered estimates. Use food labels or a reliable nutrition source; this journal does not verify nutrition values.</p>
          </section>

          <section className="dashboard chart-panel">
            <div className="dashboard-top"><div><span className="dashboard-overline">YOUR FOOD JOURNAL</span><h2>Seven-day calorie chart.</h2></div><span className="chart-key"><i /> Logged kcal · dashed: estimate</span></div>
            <div className="simple-chart" role="img" aria-label="Calories logged per day for the last seven days">
              {calorieChart.map((day) => <div className="simple-chart-column" key={day.key}>
                <strong>{day.total ? day.total.toLocaleString() : ""}</strong>
                <div className="simple-chart-track"><i style={{ height: `${day.total ? Math.max(5, day.total / calorieChartMax * 100) : 0}%` }} />
                  {calorieTargetMarker !== null && <b className="calorie-target-marker" style={{ bottom: `${calorieTargetMarker}%` }} />}
                </div>
                <span>{day.label}</span>
              </div>)}
            </div>
            <p className="calorie-note">The horizontal reference is only a rough target estimate, when enough adult profile information is available.</p>
          </section>

          <section className="dashboard chart-panel">
            <div className="dashboard-top"><div><span className="dashboard-overline">MOVEMENT REPORT</span><h2>Your weekly fitness chart.</h2></div><span className="chart-key"><i /> Active minutes</span></div>
            <div className="simple-chart" role="img" aria-label="Workout minutes per day for the last seven days">
              {workoutBars.map((bar, index) => <div className="simple-chart-column" key={`${bar.label}-${index}`}>
                <strong>{bar.minutes || ""}</strong>
                <div className="simple-chart-track"><i style={{ height: `${bar.minutes ? Math.max(5, bar.minutes / workoutChartMax * 100) : 0}%` }} /></div>
                <span>{bar.label}</span>
              </div>)}
            </div>
            <p className="calorie-note">For adults, general guidance is to gradually work toward at least 150 minutes of moderate activity per week, if suitable for you.</p>
          </section>

          <section className="dashboard suggestions-panel">
            <div className="dashboard-top"><div><span className="dashboard-overline">IDEAS BASED ON YOUR PROFILE</span><h2>Gentle plans for this week.</h2></div><Check /></div>
            <p className="plan-context">Your selected focus: <strong>{fitnessGoalLabels[profile?.fitnessGoal] || "build a steady fitness routine"}</strong>.</p>
            <div className="suggestion-columns">
              <article>
                <h3>Balanced meal ideas</h3>
                <p className="plan-intro">{dietGuidance}</p>
                <ul className="meal-plan-list">{dietPlan.map((meal) => (
                  <li key={meal.name}><span className="meal-share">{meal.share}%</span><span><strong>{meal.name}</strong><small>{meal.example}</small></span></li>
                ))}</ul>
              </article>
              <article>
                <h3>Movement ideas</h3>
                <p className="movement-suggestion">{fitnessPlan}</p>
                <p className="plan-intro">Choose comfortable activities, take rest days, and adjust for your ability and circumstances.</p>
              </article>
            </div>
            {adultBmi !== null && adultBmi < 18.5 && profile?.fitnessGoal === "LOSE_WEIGHT" && (
              <p className="form-message is-error" role="note">Your selected weight-loss focus is not used to reduce the calorie estimate. Please discuss weight goals with a qualified health professional.</p>
            )}
            <p className="health-disclaimer">General wellness ideas only. Adapt meals to allergies, culture, preferences, and medical needs. Stop activity that causes pain and seek professional advice when needed.</p>
          </section>

          <section className="dashboard recent-panel">
            <div className="dashboard-top"><div><span className="dashboard-overline">YOUR LOG</span><h2>Recent sessions</h2></div><Link className="text-link" to="/workouts">Manage workouts <ArrowUpRight /></Link></div>
            {error ? <p className="activity-empty">Your workout history is unavailable until the server reconnects.</p>
              : workouts.length === 0 ? <p className="activity-empty">No workouts logged yet. Add your first session to see your progress.</p> : (
              <ul className="activity-list">{workouts.slice(0, 5).map((item) => <li className="activity-item" key={item.id}><div className="activity-details"><strong>{item.name}</strong><span>{item.category} · {item.durationMinutes} min · {new Date(item.performedAt).toLocaleString()}</span></div><Activity /></li>)}</ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
