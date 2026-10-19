import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useAuth } from "../auth/AuthContext.jsx";
import WeeklyBarChart from "../components/WeeklyBarChart.jsx";
import { fitnessGoalLabels } from "../constants/profile.js";
import { getGoalGuidance, getPlanWeekDays, localDateKey } from "../constants/weeklyPlan.js";
import { exerciseApi, workoutApi, workoutPlanApi } from "../services/api.js";
import { getWeeklyChartData } from "../utils/weeklyChart.js";

function localDateTimeValue(date = new Date()) {
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function tomorrowStartValue() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return localDateTimeValue(tomorrow);
}

const blankForm = () => ({ id: "", name: "", category: "Strength", durationMinutes: "30", performedAt: localDateTimeValue(), notes: "" });

function defaultPlannedAt() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  return localDateTimeValue(tomorrow);
}

const blankPlanForm = () => ({
  id: "",
  name: "",
  category: "Strength",
  durationMinutes: "30",
  plannedAt: defaultPlannedAt(),
  notes: "",
});

function exerciseDose(exercise) {
  return [
    exercise.setCount ? `${exercise.setCount} sets` : null,
    exercise.reps || null,
    exercise.restSeconds ? `${exercise.restSeconds}s rest` : null,
  ].filter(Boolean).join(" · ");
}

export default function WorkoutsPage() {
  const { user } = useAuth();
  const search = useSearch({ from: "/_protected/workouts" });
  const navigate = useNavigate({ from: "/_protected/workouts" });
  const [workouts, setWorkouts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [form, setForm] = useState(() => ({ ...blankForm(), name: search.name || "" }));
  const [planForm, setPlanForm] = useState(blankPlanForm);
  const [error, setError] = useState("");
  const [planError, setPlanError] = useState("");
  const [exerciseError, setExerciseError] = useState("");
  const [status, setStatus] = useState("Loading your workouts…");
  const [saving, setSaving] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [completingPlan, setCompletingPlan] = useState(null);
  const sessionsRef = useRef(null);
  const goal = user?.fitnessGoal || "";
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  const maxPlanDate = localDateKey(weekEnd);
  const weeklyWorkoutMinutes = getWeeklyChartData(
    workouts,
    (workout) => workout.performedAt,
    (workout) => workout.durationMinutes,
  );
  const planDays = getPlanWeekDays();
  const plansByDay = plans.reduce((groups, plan) => {
    const key = localDateKey(plan.plannedAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(plan);
    return groups;
  }, {});

  const loadWorkouts = useCallback(async () => {
    setError("");
    try {
      setWorkouts(await workoutApi.list());
      setStatus("Synced with your FitSync account");
    } catch (failure) {
      setError(failure.message);
      setStatus("Could not load workouts");
    }
  }, []);

  const loadPlans = useCallback(async () => {
    setPlanError("");
    try {
      setPlans(await workoutPlanApi.list());
    } catch (failure) {
      setPlanError(failure.message);
    }
  }, []);

  const loadExercises = useCallback(async () => {
    setExerciseError("");
    try {
      setExercises(await exerciseApi.list(goal));
    } catch (failure) {
      setExerciseError(failure.message);
    }
  }, [goal]);

  useEffect(() => { loadWorkouts(); }, [loadWorkouts]);
  useEffect(() => { loadPlans(); }, [loadPlans]);
  useEffect(() => { loadExercises(); }, [loadExercises]);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const changePlan = (event) => setPlanForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const resetForm = async () => {
    setForm(blankForm());
    setError("");
    try {
      await navigate({ to: "/workouts", search: {}, replace: true });
    } catch (failure) {
      setError(failure.message);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      category: form.category,
      durationMinutes: Number(form.durationMinutes),
      performedAt: form.performedAt,
      notes: form.notes.trim(),
    };
    try {
      if (form.id) await workoutApi.update(form.id, payload);
      else await workoutApi.create(payload);
      await loadWorkouts();
      await resetForm();
      setStatus(form.id ? "Workout updated." : "Workout saved.");
      sessionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  };

  const editWorkout = (workout) => {
    setForm({
      id: String(workout.id),
      name: workout.name,
      category: workout.category,
      durationMinutes: String(workout.durationMinutes),
      performedAt: localDateTimeValue(new Date(workout.performedAt)),
      notes: workout.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteWorkout = async (workout) => {
    if (!window.confirm(`Delete "${workout.name}" from your workout log?`)) return;
    setError("");
    try {
      await workoutApi.remove(workout.id);
      await loadWorkouts();
      if (String(form.id) === String(workout.id)) await resetForm();
      setStatus("Workout deleted.");
    } catch (failure) {
      setError(failure.message);
    }
  };

  const savePlan = async (event) => {
    event.preventDefault();
    setPlanError("");
    setSavingPlan(true);
    const payload = {
      name: planForm.name.trim(),
      category: planForm.category,
      durationMinutes: Number(planForm.durationMinutes),
      plannedAt: planForm.plannedAt,
      notes: planForm.notes.trim(),
    };
    try {
      if (planForm.id) await workoutPlanApi.update(planForm.id, payload);
      else await workoutPlanApi.create(payload);
      await loadPlans();
      setPlanForm(blankPlanForm());
      setStatus(planForm.id ? "Workout plan updated." : "Workout added to your week.");
    } catch (failure) {
      setPlanError(failure.message);
    } finally {
      setSavingPlan(false);
    }
  };

  const editPlan = (plan) => {
    setPlanForm({
      id: String(plan.id),
      name: plan.name,
      category: plan.category,
      durationMinutes: String(plan.durationMinutes),
      plannedAt: localDateTimeValue(new Date(plan.plannedAt)),
      notes: plan.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deletePlan = async (plan) => {
    if (!window.confirm(`Remove "${plan.name}" from your workout plan?`)) return;
    setPlanError("");
    try {
      await workoutPlanApi.remove(plan.id);
      await loadPlans();
      if (String(planForm.id) === String(plan.id)) setPlanForm(blankPlanForm());
      setStatus("Workout plan removed.");
    } catch (failure) {
      setPlanError(failure.message);
    }
  };

  const completePlan = async (plan) => {
    setPlanError("");
    setCompletingPlan(plan.id);
    try {
      await workoutPlanApi.complete(plan.id);
      await Promise.all([loadWorkouts(), loadPlans()]);
      setStatus("Workout logged with the current date and time.");
    } catch (failure) {
      setPlanError(failure.message);
    } finally {
      setCompletingPlan(null);
    }
  };

  const buildWeek = async () => {
    setPlanError("");
    setGenerating(true);
    try {
      await workoutPlanApi.generateWeek();
      await Promise.all([loadPlans(), loadWorkouts()]);
      setStatus("Your goal-based week is ready. Review the sessions below.");
    } catch (failure) {
      setPlanError(failure.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <main className="page-main section-wrap">
      <div className="page-heading"><div><p className="eyebrow">YOUR PACE. YOUR PROGRESS.</p><h1>WORKOUT <span>LOG.</span></h1><p>Build a goal-based week, then log the workouts you actually complete.</p></div><span className="activity-status" role="status">{status}</span></div>
      {error && <p className="form-message is-error" role="alert">{error}</p>}

      <section className="dashboard workout-editor">
        <div className="dashboard-top"><div><span className="dashboard-overline">SESSION DETAILS</span><h2>{form.id ? "Edit workout" : "Add a workout"}</h2></div></div>
        <form className="activity-form" onSubmit={submit}>
          <label>Workout name<input name="name" value={form.name} onChange={change} maxLength="100" required placeholder="e.g. Full Body" /></label>
          <label>Category<select name="category" value={form.category} onChange={change}><option>Strength</option><option>Cardio</option><option>Core</option><option>Mobility</option><option>HIIT</option><option>Recovery</option></select></label>
          <label>Minutes<input name="durationMinutes" type="number" min="1" max="1440" value={form.durationMinutes} onChange={change} required /></label>
          <label>Date and time<input name="performedAt" type="datetime-local" value={form.performedAt} onChange={change} required /></label>
          <label className="activity-notes">Notes<textarea name="notes" value={form.notes} onChange={change} maxLength="500" rows="2" placeholder="Optional notes" /></label>
          <div className="activity-form-actions"><button className="button button-small" type="submit" disabled={saving}>{saving ? "Saving…" : form.id ? "Update workout" : "Save workout"} <ArrowUpRight /></button>{form.id && <button className="button button-small button-outline" type="button" onClick={resetForm}>Cancel edit</button>}</div>
        </form>
      </section>

      <section className="dashboard weekly-board-panel">
        <div className="dashboard-top"><div><span className="dashboard-overline">PLAN AHEAD</span><h2>Your week</h2></div><span>Next 7 days</span></div>
        <div className="week-builder">
          <div>
            <p className="week-builder-goal">Goal: <strong>{fitnessGoalLabels[goal] || "Not set yet"}</strong></p>
            <p className="week-builder-note">{getGoalGuidance(goal)}</p>
            {!goal && <p className="week-builder-note">Add a fitness target in <Link to="/profile">Profile</Link> to tailor the week. Without one, FitSync builds a balanced plan.</p>}
          </div>
          <button className="button button-small" type="button" onClick={buildWeek} disabled={generating}>{generating ? "Building…" : "Build my week"} <ArrowUpRight /></button>
        </div>
        {planError && <p className="form-message is-error" role="alert">{planError}</p>}
        {plans.length === 0 && <p className="activity-empty">No sessions planned yet. Build your week above or add one manually below.</p>}
        <div className="week-board">
          {planDays.map((day) => {
            const dayPlans = plansByDay[day.key] || [];
            return (
              <article className={`week-day${day.isToday ? " is-today" : ""}`} key={day.key}>
                <header className="week-day-header">
                  <span>{day.label}</span>
                  <small>{day.dateLabel}</small>
                </header>
                {dayPlans.length === 0 ? (
                  <p className="week-day-empty">Rest / no session planned.</p>
                ) : dayPlans.map((plan) => (
                  <div className="planned-workout" key={plan.id}>
                    <div className="planned-workout-heading">
                      <strong>{plan.name}</strong>
                      <span>{plan.category} · {plan.durationMinutes} min</span>
                    </div>
                    {plan.notes && <p className="planned-workout-note">{plan.notes}</p>}
                    {Array.isArray(plan.exercises) && plan.exercises.length > 0 && (
                      <ul className="plan-exercises">
                        {plan.exercises.map((exercise, index) => (
                          <li key={exercise.id ?? `${plan.id}-${index}`}>
                            <strong>{exercise.name}</strong>
                            <span>{exercise.category} · {exerciseDose(exercise)}</span>
                            {exercise.instructions && <small>{exercise.instructions}</small>}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="activity-actions">
                      <button type="button" disabled={completingPlan === plan.id} onClick={() => completePlan(plan)}>{completingPlan === plan.id ? "Logging…" : "Log workout"}</button>
                      <button type="button" onClick={() => editPlan(plan)}>Edit</button>
                      <button type="button" onClick={() => deletePlan(plan)}>Remove</button>
                    </div>
                  </div>
                ))}
              </article>
            );
          })}
        </div>
        <p className="workout-plan-note">Generated sessions are replaced the next time you build the week. Sessions you add manually stay put. Planned sessions only count toward history after you choose “Log workout.”</p>
      </section>

      <section className="dashboard recent-panel workout-plan-panel">
        <div className="dashboard-top"><div><span className="dashboard-overline">ADD MANUALLY</span><h2>Plan a session</h2></div><span>Next 7 days</span></div>
        <p className="workout-plan-note">Add a specific session of your own. It appears alongside the goal-based week.</p>
        <form className="activity-form workout-plan-form" onSubmit={savePlan}>
          <label>Workout name<input name="name" value={planForm.name} onChange={changePlan} maxLength="100" required placeholder="e.g. Full Body" /></label>
          <label>Category<select name="category" value={planForm.category} onChange={changePlan}><option>Strength</option><option>Cardio</option><option>Core</option><option>Mobility</option><option>HIIT</option><option>Recovery</option></select></label>
          <label>Minutes<input name="durationMinutes" type="number" min="1" max="1440" value={planForm.durationMinutes} onChange={changePlan} required /></label>
          <label>Planned date and time<input name="plannedAt" type="datetime-local" min={planForm.id ? undefined : tomorrowStartValue()} max={`${maxPlanDate}T23:59`} value={planForm.plannedAt} onChange={changePlan} required /></label>
          <label className="activity-notes">Notes<textarea name="notes" value={planForm.notes} onChange={changePlan} maxLength="500" rows="2" placeholder="Optional notes" /></label>
          <div className="activity-form-actions"><button className="button button-small" type="submit" disabled={savingPlan}>{savingPlan ? "Saving…" : planForm.id ? "Update plan" : "Add to week"} <ArrowUpRight /></button>{planForm.id && <button className="button button-small button-outline" type="button" onClick={() => setPlanForm(blankPlanForm())}>Cancel</button>}</div>
        </form>
      </section>

      <section className="dashboard exercise-library-panel">
        <div className="dashboard-top"><div><span className="dashboard-overline">EXERCISE LIBRARY</span><h2>Movements for your goal</h2></div><span>{exercises.length} exercises</span></div>
        <p className="workout-plan-note">FitSync uses these movements to build your week. Choose options that match your ability and equipment, and adjust the dose as needed.</p>
        {exerciseError && <p className="form-message is-error" role="alert">{exerciseError}</p>}
        {exercises.length === 0 && !exerciseError ? (
          <p className="activity-empty">Loading the exercise library…</p>
        ) : Object.entries(exercises.reduce((groups, exercise) => {
          const category = exercise.category || "Other";
          if (!groups[category]) groups[category] = [];
          groups[category].push(exercise);
          return groups;
        }, {})).map(([category, items]) => (
          <div className="exercise-group" key={category}>
            <h3>{category}</h3>
            <div className="exercise-library">
              {items.map((exercise) => (
                <article className="exercise-card" key={exercise.name}>
                  <div className="exercise-card-top"><strong>{exercise.name}</strong><span>{exercise.category}</span></div>
                  <p className="exercise-meta">{exercise.difficulty} · {exercise.equipment}</p>
                  <span className="exercise-dose">{exerciseDose(exercise)}</span>
                  <small>{exercise.instructions}</small>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>

      <WeeklyBarChart
        eyebrow="YOUR LAST SEVEN DAYS"
        title="Weekly workout minutes."
        legend="Active minutes"
        ariaLabel="Workout minutes per day for the last seven days"
        data={weeklyWorkoutMinutes}
        note="Minutes are totaled by the date each workout was logged."
      />

      <section className="dashboard recent-panel" id="workout-sessions" ref={sessionsRef}>
        <div className="dashboard-top"><div><span className="dashboard-overline">PRIVATE TO YOUR ACCOUNT</span><h2>Workout sessions</h2></div><span>{workouts.length} {workouts.length === 1 ? "session" : "sessions"}</span></div>
        {workouts.length === 0 ? <p className="activity-empty">{error ? "Your workout list is unavailable until the server reconnects." : "No workouts logged yet. Save a session above to get started."}</p> : (
          <ul className="activity-list">{workouts.map((workout) => <li className="activity-item" key={workout.id}><div className="activity-details"><strong>{workout.name}</strong><span>{workout.category} · {workout.durationMinutes} min · {new Date(workout.performedAt).toLocaleString()}{workout.notes ? ` · ${workout.notes}` : ""}</span></div><div className="activity-actions"><button type="button" onClick={() => editWorkout(workout)}>Edit</button><button type="button" onClick={() => deleteWorkout(workout)}>Delete</button></div></li>)}</ul>
        )}
      </section>
    </main>
  );
}
