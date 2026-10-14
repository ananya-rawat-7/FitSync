import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowUpRight, Check, HeartPulse } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "../auth/AuthContext.jsx";
import FoodJournal, { getCalorieEstimate } from "../components/FoodJournal.jsx";
import WeeklyBarChart from "../components/WeeklyBarChart.jsx";
import { authApi, workoutApi } from "../services/api.js";

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
  const sessionsByGoal = {
    IMPROVE_FLEXIBILITY: "Try 3 gentle mobility sessions and 2 comfortable walks this week.",
    IMPROVE_ENDURANCE: "Try 3 easy-to-moderate cardio sessions, with rest or gentle movement between them.",
    BUILD_STRENGTH: "Try 2 or 3 full-body strength sessions, with recovery days between sessions.",
  };
  const sessions = sessionsByGoal[goal] || "Try 2 strength sessions and a few comfortable walks, then build up at your own pace.";

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

function RecentSessions({ workouts, error }) {
  if (error) {
    return <p className="activity-empty">Your workout history is unavailable until the server reconnects.</p>;
  }

  if (workouts.length === 0) {
    return <p className="activity-empty">No workouts logged yet. Add your first session to see your progress.</p>;
  }

  return (
    <ul className="activity-list">
      {workouts.slice(0, 5).map((item) => (
        <li className="activity-item" key={item.id}>
          <div className="activity-details">
            <strong>{item.name}</strong>
            <span>{item.category} · {item.durationMinutes} min · {new Date(item.performedAt).toLocaleString()}</span>
          </div>
          <Activity />
        </li>
      ))}
    </ul>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [profile, setProfile] = useState(user);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(async () => {
    let active = true;

    const loadDashboard = async () => {
      try {
        await Promise.all([
          workoutApi.list().then((data) => { if (active) setWorkouts(data); })
            .catch((failure) => { if (active) setError(failure.message); }),
          authApi.me().then((data) => { if (active) setProfile(data); })
            .catch(() => { if (active) setProfile(user); }),
        ]);
      } finally {
        if (active) setLoading(false);
      }
    };

    await loadDashboard();
    return () => { active = false; };
  }, [user]);

  const stats = getStats(workouts);
  const bmi = getAdultBmi(Number(profile?.weightKg), Number(profile?.heightCm));
  const adultBmi = Number(profile?.age) >= 20 ? bmi : null;
  const bmiCategory = adultBmi === null ? null : getBmiCategory(adultBmi);
  const calorieEstimate = getCalorieEstimate(profile, adultBmi);
  const dietPlan = useMemo(() => getDietPlan(profile?.fitnessGoal, adultBmi), [profile?.fitnessGoal, adultBmi]);
  const dietGuidance = getDietGuidance(profile?.fitnessGoal, adultBmi);
  const fitnessPlan = getFitnessPlan(profile?.fitnessGoal, adultBmi);
  const workoutBars = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - 6 + index);
    return {
      key: day.toISOString().slice(0, 10),
      label: day.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1),
      value: stats.recent.filter((item) => new Date(item.performedAt).toDateString() === day.toDateString())
        .reduce((sum, item) => sum + Number(item.durationMinutes), 0),
    };
  });

  return (
    <main className="page-main section-wrap">
      <div className="page-heading"><div><p className="eyebrow">PROGRESS, NOT PRESSURE</p><h1>YOUR <span>ACTIVITY.</span></h1><p>Your private workout, nutrition, and progress reports.</p></div><Link className="button" to="/workouts">Log a workout <ArrowUpRight /></Link></div>
      {error && <p className="form-message is-error" role="alert">{error}</p>}
      {loading ? <p className="status-message" role="status">Loading your reports…</p> : (
        <>
          <section className="stat-grid dashboard-stats" aria-label="Workout statistics">
            <div className="stat-tile"><span>WORKOUTS</span><strong>{String(stats.recent.length).padStart(2, "0")}</strong><small>last 7 days</small></div>
            <div className="stat-tile"><span>ACTIVE MIN</span><strong>{stats.minutes}</strong><small>last 7 days</small></div>
            <div className="stat-tile"><span>ACTIVE DAYS</span><strong>{stats.activeDays}</strong><small>last 7 days</small></div>
            <Link className="stat-tile stat-highlight" to="/food-journal"><span>FOOD JOURNAL</span><strong>OPEN</strong><small>log meals and drinks</small></Link>
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

          <FoodJournal profile={profile} />

          <WeeklyBarChart
            eyebrow="MOVEMENT REPORT"
            title="Your weekly fitness chart."
            legend="Active minutes"
            ariaLabel="Workout minutes per day for the last seven days"
            data={workoutBars}
            note="For adults, general guidance is to gradually work toward at least 150 minutes of moderate activity per week, if suitable for you."
          />

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
            <RecentSessions workouts={workouts} error={error} />
          </section>
        </>
      )}
    </main>
  );
}
