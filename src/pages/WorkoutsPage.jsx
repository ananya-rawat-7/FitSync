import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { workoutApi } from "../services/api.js";

function localDateTimeValue(date = new Date()) {
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const blankForm = () => ({ id: "", name: "", category: "Strength", durationMinutes: "30", performedAt: localDateTimeValue(), notes: "" });

export default function WorkoutsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [workouts, setWorkouts] = useState([]);
  const [form, setForm] = useState(() => ({ ...blankForm(), name: searchParams.get("name") || "" }));
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Loading your workouts…");
  const [saving, setSaving] = useState(false);

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

  useEffect(() => { loadWorkouts(); }, [loadWorkouts]);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const resetForm = () => {
    setForm(blankForm());
    setSearchParams({}, { replace: true });
    setError("");
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
      resetForm();
      await loadWorkouts();
      setStatus(form.id ? "Workout updated." : "Workout saved.");
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
      if (String(form.id) === String(workout.id)) resetForm();
      await loadWorkouts();
      setStatus("Workout deleted.");
    } catch (failure) {
      setError(failure.message);
    }
  };

  return (
    <main className="page-main section-wrap">
      <div className="page-heading"><div><p className="eyebrow">YOUR PACE. YOUR PROGRESS.</p><h1>WORKOUT <span>LOG.</span></h1><p>Add, update and review sessions saved to your account.</p></div><span className="activity-status" role="status">{status}</span></div>
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
      <section className="dashboard recent-panel">
        <div className="dashboard-top"><div><span className="dashboard-overline">PRIVATE TO YOUR ACCOUNT</span><h2>Workout sessions</h2></div><span>{workouts.length} {workouts.length === 1 ? "session" : "sessions"}</span></div>
        {workouts.length === 0 ? <p className="activity-empty">{error ? "Your workout list is unavailable until the server reconnects." : "No workouts logged yet. Save a session above to get started."}</p> : (
          <ul className="activity-list">{workouts.map((workout) => <li className="activity-item" key={workout.id}><div className="activity-details"><strong>{workout.name}</strong><span>{workout.category} · {workout.durationMinutes} min · {new Date(workout.performedAt).toLocaleString()}{workout.notes ? ` · ${workout.notes}` : ""}</span></div><div className="activity-actions"><button type="button" onClick={() => editWorkout(workout)}>Edit</button><button type="button" onClick={() => deleteWorkout(workout)}>Delete</button></div></li>)}</ul>
        )}
      </section>
    </main>
  );
}
