import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "../auth/AuthContext.jsx";
import CelebrationModal from "../components/CelebrationModal.jsx";
import SessionLogEditor from "../components/SessionLogEditor.jsx";
import WeekDayColumn from "../components/WeekDayColumn.jsx";
import WeeklyBarChart from "../components/WeeklyBarChart.jsx";
import WeeklyPlanEditor from "../components/WeeklyPlanEditor.jsx";
import { fitnessGoalLabels } from "../constants/profile.js";
import { getGoalGuidance, getWeekDays, localDateKey } from "../constants/weeklyPlan.js";
import { workoutApi, workoutPlanApi } from "../services/api.js";
import { getWeeklyChartData } from "../utils/weeklyChart.js";

export default function WorkoutsPage() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState("Loading your workouts…");
  const [planError, setPlanError] = useState("");
  const [logError, setLogError] = useState("");
  const [workoutError, setWorkoutError] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [editor, setEditor] = useState(null);
  const [editingLog, setEditingLog] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [completingPlan, setCompletingPlan] = useState(null);
  const goal = user?.fitnessGoal || "";
  const weekDays = getWeekDays(weekOffset);
  const weekStart = weekDays[0].key;
  const weeklyWorkoutMinutes = getWeeklyChartData(
    workouts,
    (workout) => workout.performedAt,
    (workout) => workout.durationMinutes,
  );
  const plansByDay = plans.reduce((groups, plan) => {
    const key = localDateKey(plan.plannedAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(plan);
    return groups;
  }, {});
  Object.values(plansByDay).forEach((dayPlans) => {
    dayPlans.sort((a, b) => (a.positionInDay ?? 0) - (b.positionInDay ?? 0));
  });

  const loadWorkouts = useCallback(async () => {
    setWorkoutError("");
    try {
      setWorkouts(await workoutApi.list());
      setStatus("Synced with your FitSync account");
    } catch (failure) {
      setWorkoutError(failure.message);
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

  const buildWeek = async () => {
    setPlanError("");
    setGenerating(true);
    try {
      await workoutPlanApi.generateWeek(weekStart);
      await Promise.all([loadPlans(), loadWorkouts()]);
      setStatus("Your goal-based week is ready.");
    } catch (failure) {
      setPlanError(failure.message);
    } finally {
      setGenerating(false);
    }
  };

  const completePlan = async (plan) => {
    setPlanError("");
    setCompletingPlan(plan.id);
    try {
      await workoutPlanApi.complete(plan.id);
      await Promise.all([loadWorkouts(), loadPlans()]);
      setStatus("Workout logged with the current date and time.");
      setCelebration({
        title: "CONGO!",
        message: `${plan.name} is logged. Great work!`,
      });
    } catch (failure) {
      setPlanError(failure.message);
    } finally {
      setCompletingPlan(null);
    }
  };

  const deletePlan = async (plan) => {
    if (!window.confirm(`Remove "${plan.name}" from this day?`)) return;
    setPlanError("");
    try {
      await workoutPlanApi.remove(plan.id);
      await loadPlans();
      setStatus("Workout removed from your week.");
    } catch (failure) {
      setPlanError(failure.message);
    }
  };

  const deleteWorkout = async (workout) => {
    if (!window.confirm(`Delete "${workout.name}" from your workout logs?`)) return;
    setLogError("");
    try {
      await workoutApi.remove(workout.id);
      await loadWorkouts();
      setStatus("Workout log deleted.");
    } catch (failure) {
      setLogError(failure.message);
    }
  };

  const openDayEditor = (dateKey, planId = null) => {
    setEditor({ dateKey, planId: planId ? String(planId) : null });
  };
  const closeEditor = () => setEditor(null);

  const handleEditorSaved = async () => {
    await Promise.all([loadPlans(), loadWorkouts()]);
    setEditor(null);
    setPlanError("");
    setStatus("Your week has been updated.");
  };

  const handleLogSaved = async () => {
    await loadWorkouts();
    setEditingLog(null);
    setLogError("");
    setStatus("Workout log updated.");
  };

  return (
    <main className="page-main section-wrap">
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR PACE. YOUR PROGRESS.</p>
          <h1>WORKOUT <span>LOG.</span></h1>
          <p>Plan the week, edit any day, and log today's session when it is done.</p>
        </div>
        <span className="activity-status" role="status">{status}</span>
      </div>

      <section className="dashboard weekly-board-panel">
        <div className="dashboard-top">
          <div><span className="dashboard-overline">PLAN AHEAD</span><h2>Your week</h2></div>
          <div className="week-nav" aria-label="Week navigation">
            <button type="button" className="week-nav-button" aria-label="Previous week" onClick={() => setWeekOffset((value) => value - 1)}><ChevronLeft /></button>
            <span className="week-range">{weekDays[0].dateLabel} – {weekDays[6].dateLabel}</span>
            <button type="button" className="week-nav-button" aria-label="Next week" onClick={() => setWeekOffset((value) => value + 1)}><ChevronRight /></button>
            {weekOffset !== 0 && <button type="button" className="text-button" onClick={() => setWeekOffset(0)}>This week</button>}
          </div>
        </div>

        <div className="week-builder">
          <div>
            <p className="week-builder-goal">Goal: <strong>{fitnessGoalLabels[goal] || "Not set yet"}</strong></p>
            <p className="week-builder-note">{getGoalGuidance(goal)}</p>
            {!goal && <p className="week-builder-note">Add a fitness target in <Link to="/profile">Profile</Link> to tailor the week. Without one, FitSync builds a balanced plan.</p>}
          </div>
          <button className="button button-small" type="button" onClick={buildWeek} disabled={generating}>{generating ? "Building…" : "Build my week"} <ArrowUpRight /></button>
        </div>

        {planError && <p className="form-message is-error" role="alert">{planError}</p>}

        <div className="week-board">
          {weekDays.map((day) => (
            <WeekDayColumn
              key={day.key}
              day={day}
              plans={plansByDay[day.key] || []}
              onAdd={openDayEditor}
              onEditDay={openDayEditor}
              onLog={completePlan}
              onEditPlan={(dateKey, plan) => openDayEditor(dateKey, plan.id)}
              onRemovePlan={deletePlan}
              loggingPlanId={completingPlan}
            />
          ))}
        </div>

        <p className="workout-plan-note">Generated sessions are replaced when you rebuild the displayed week. Completed sessions stay on the board with a Done badge. Manually added sessions stay put. Planned sessions only count toward history after you choose “Log workout”.</p>
      </section>

      <WeeklyBarChart
        eyebrow="YOUR LAST SEVEN DAYS"
        title="Weekly workout minutes."
        legend="Active minutes"
        ariaLabel="Workout minutes per day for the last seven days"
        data={weeklyWorkoutMinutes}
        note="Minutes are totaled by the date each workout was logged."
      />

      <section className="dashboard recent-panel" id="workout-sessions">
        <div className="dashboard-top">
          <div><span className="dashboard-overline">PRIVATE TO YOUR ACCOUNT</span><h2>Workout logs</h2></div>
          <span>{workouts.length} {workouts.length === 1 ? "log" : "logs"}</span>
        </div>
        {(logError || workoutError) && <p className="form-message is-error" role="alert">{logError || workoutError}</p>}
        {workouts.length === 0 ? (
          <p className="activity-empty">{workoutError ? "Your workout logs are unavailable until the server reconnects." : "No workouts logged yet. Log today's planned session to get started."}</p>
        ) : (
          <ul className="activity-list">
            {workouts.map((workout) => (
              <li className="activity-item" key={workout.id}>
                <div className="activity-details">
                  <strong>{workout.name}</strong>
                  <span>{workout.category} · {workout.durationMinutes} min · {new Date(workout.performedAt).toLocaleString()}{workout.notes ? ` · ${workout.notes}` : ""}</span>
                </div>
                <div className="activity-actions">
                  <button type="button" onClick={() => { setEditingLog(workout); setLogError(""); }}>Edit</button>
                  <button type="button" onClick={() => deleteWorkout(workout)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <WeeklyPlanEditor
        open={Boolean(editor)}
        dateKey={editor?.dateKey || weekStart}
        plans={editor ? plansByDay[editor.dateKey] || [] : []}
        selectedPlanId={editor?.planId || null}
        onClose={closeEditor}
        onSaved={handleEditorSaved}
      />

      <SessionLogEditor
        session={editingLog}
        open={Boolean(editingLog)}
        onClose={() => setEditingLog(null)}
        onSaved={handleLogSaved}
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
