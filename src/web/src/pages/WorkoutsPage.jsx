import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "../auth/AuthContext.jsx";
import SessionLogEditor from "../components/SessionLogEditor.jsx";
import WeeklyBarChart from "../components/WeeklyBarChart.jsx";
import WeeklyPlanEditor from "../components/WeeklyPlanEditor.jsx";
import { fitnessGoalLabels } from "../constants/profile.js";
import { getGoalGuidance, getWeekDays, localDateKey } from "../constants/weeklyPlan.js";
import { workoutApi, workoutPlanApi } from "../services/api.js";
import { getWeeklyChartData } from "../utils/weeklyChart.js";

function exerciseDose(exercise) {
  return [
    exercise.setCount ? `${exercise.setCount} sets` : null,
    exercise.reps || null,
    exercise.restSeconds ? `${exercise.restSeconds}s rest` : null,
  ].filter(Boolean).join(" · ");
}

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
          <p>Plan the week, edit any day, and log the sessions you actually complete.</p>
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
          {weekDays.map((day) => {
            const dayPlans = plansByDay[day.key] || [];
            return (
              <article className={`week-day${day.isToday ? " is-today" : ""}${day.isPast ? " is-past" : ""}`} key={day.key}>
                <header className="week-day-header">
                  <span>{day.label}</span>
                  <small>{day.dateLabel}</small>
                </header>

                {dayPlans.length === 0 ? (
                  <div className="week-day-empty">
                    <p>Rest / no session planned.</p>
                    <button type="button" className="text-button" onClick={() => openDayEditor(day.key)}>+ Add session</button>
                  </div>
                ) : (
                  <>
                    <button type="button" className="text-button week-day-edit" onClick={() => openDayEditor(day.key)}>Edit day</button>
                    {dayPlans.map((plan) => (
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
                          <button
                            type="button"
                            disabled={day.isPast || completingPlan === plan.id}
                            title={day.isPast ? "Past sessions can no longer be logged." : undefined}
                            onClick={() => completePlan(plan)}
                          >
                            {completingPlan === plan.id ? "Logging…" : "Log workout"}
                          </button>
                          <button type="button" onClick={() => openDayEditor(day.key, plan.id)}>Edit</button>
                          <button type="button" onClick={() => deletePlan(plan)}>Remove</button>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="text-button week-day-add" onClick={() => openDayEditor(day.key)}>+ Add another workout</button>
                  </>
                )}
              </article>
            );
          })}
        </div>

        <p className="workout-plan-note">Generated sessions are replaced when you rebuild the displayed week. Manually added sessions stay put. Planned sessions only count toward history after you choose “Log workout.”</p>
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
          <p className="activity-empty">{workoutError ? "Your workout logs are unavailable until the server reconnects." : "No workouts logged yet. Log a planned session to get started."}</p>
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
    </main>
  );
}
