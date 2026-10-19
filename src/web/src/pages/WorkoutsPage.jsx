import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import WeeklyBarChart from "../components/WeeklyBarChart.jsx";
import { workoutApi, workoutPlanApi } from "../services/api.js";
import { getWeeklyChartData } from "../utils/weeklyChart.js";

function localDateTimeValue(date = new Date()) {
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

function localDateKey(date) {
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function planStatus(plannedAt) {
  const date = new Date(plannedAt);
  if (date < new Date()) return "Past due · not logged";
  if (localDateKey(date) === localDateKey(new Date())) return "Today";
  return date.toLocaleDateString(undefined, { weekday: "long" });
}

export default function WorkoutsPage() {
  const search = useSearch({ from: "/_protected/workouts" });
  const navigate = useNavigate({ from: "/_protected/workouts" });
  const [workouts, setWorkouts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(() => ({ ...blankForm(), name: search.name || "" }));
  const [planForm, setPlanForm] = useState(blankPlanForm);
  const [error, setError] = useState("");
  const [planError, setPlanError] = useState("");
  const [status, setStatus] = useState("Loading your workouts…");
  const [saving, setSaving] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [completingPlan, setCompletingPlan] = useState(null);
  const sessionsRef = useRef(null);
  const today = localDateKey(new Date());
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 6);
  const maxPlanDate = localDateKey(weekEnd);
  const weeklyWorkoutMinutes = getWeeklyChartData(
    workouts,
    (workout) => workout.performedAt,
    (workout) => workout.durationMinutes,
  );

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

  useEffect(() => { loadWorkouts(); }, [loadWorkouts]);
  useEffect(() => { loadPlans(); }, [loadPlans]);

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

  return (
    <main className="page-main section-wrap">
      <div className="page-heading"><div><p className="eyebrow">YOUR PACE. YOUR PROGRESS.</p><h1>WORKOUT <span>LOG.</span></h1><p>Plan the week ahead, then log the workouts you actually complete.</p></div><span className="activity-status" role="status">{status}</span></div>
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
      <section className="dashboard recent-panel workout-plan-panel">
        <div className="dashboard-top"><div><span className="dashboard-overline">PLAN AHEAD</span><h2>Your week</h2></div><span>Next 7 days</span></div>
        <p className="workout-plan-note">Planned sessions are separate from your workout history. They count only after you choose “Log workout.”</p>
        {planError && <p className="form-message is-error" role="alert">{planError}</p>}
        <form className="activity-form workout-plan-form" onSubmit={savePlan}>
          <label>Workout name<input name="name" value={planForm.name} onChange={changePlan} maxLength="100" required placeholder="e.g. Full Body" /></label>
          <label>Category<select name="category" value={planForm.category} onChange={changePlan}><option>Strength</option><option>Cardio</option><option>Core</option><option>Mobility</option><option>HIIT</option><option>Recovery</option></select></label>
          <label>Minutes<input name="durationMinutes" type="number" min="1" max="1440" value={planForm.durationMinutes} onChange={changePlan} required /></label>
          <label>Planned date and time<input name="plannedAt" type="datetime-local" min={localDateTimeValue()} max={`${maxPlanDate}T23:59`} value={planForm.plannedAt} onChange={changePlan} required /></label>
          <label className="activity-notes">Notes<textarea name="notes" value={planForm.notes} onChange={changePlan} maxLength="500" rows="2" placeholder="Optional notes" /></label>
          <div className="activity-form-actions"><button className="button button-small" type="submit" disabled={savingPlan}>{savingPlan ? "Saving…" : planForm.id ? "Update plan" : "Add to week"} <ArrowUpRight /></button>{planForm.id && <button className="button button-small button-outline" type="button" onClick={() => setPlanForm(blankPlanForm())}>Cancel</button>}</div>
        </form>
        {plans.length === 0 ? <p className="activity-empty">{planError ? "Your plans are unavailable until the server reconnects." : "No workouts planned yet. Add one above to map out your week."}</p> : (
          <ul className="activity-list workout-plan-list">{plans.map((plan) => <li className="activity-item" key={plan.id}><div className="activity-details"><strong>{plan.name}</strong><span>{plan.category} · {plan.durationMinutes} min · {new Date(plan.plannedAt).toLocaleString()}</span><small className={planStatus(plan.plannedAt).startsWith("Past due") ? "workout-plan-overdue" : "workout-plan-upcoming"}>{planStatus(plan.plannedAt)}{plan.notes ? ` · ${plan.notes}` : ""}</small></div><div className="activity-actions"><button type="button" disabled={completingPlan === plan.id} onClick={() => completePlan(plan)}>{completingPlan === plan.id ? "Logging…" : "Log workout"}</button><button type="button" onClick={() => editPlan(plan)}>Edit</button><button type="button" onClick={() => deletePlan(plan)}>Remove</button></div></li>)}</ul>
        )}
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
