import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, Plus, Trash2, X } from "lucide-react";
import ExercisePicker from "./ExercisePicker.jsx";
import { exerciseApi, workoutPlanApi } from "../services/api.js";

const CATEGORIES = ["Strength", "Cardio", "Core", "Mobility", "HIIT", "Recovery"];

const blankExerciseForm = {
  name: "",
  category: "Strength",
  equipment: "None",
  difficulty: "Beginner",
  setCount: "3",
  reps: "10-12",
  restSeconds: "60",
  instructions: "",
};

let draftCounter = 0;
const nextKey = () => `draft-${Date.now()}-${draftCounter++}`;

function draftFromPlan(plan) {
  return {
    key: String(plan.id),
    id: plan.id,
    completed: Boolean(plan.completed),
    name: plan.name,
    category: plan.category,
    durationMinutes: String(plan.durationMinutes),
    notes: plan.notes || "",
    exercises: (plan.exercises || []).map((exercise) => ({
      key: nextKey(),
      exerciseId: exercise.exerciseId ?? null,
      name: exercise.name,
      category: exercise.category,
      setCount: exercise.setCount ?? "",
      reps: exercise.reps || "",
      restSeconds: exercise.restSeconds ?? "",
      instructions: exercise.instructions || "",
    })),
  };
}

function newDraft() {
  return {
    key: nextKey(),
    id: null,
    completed: false,
    name: "New session",
    category: "Strength",
    durationMinutes: "30",
    notes: "",
    exercises: [],
  };
}

function formatDate(dateKey) {
  const date = new Date(`${dateKey}T12:00:00`);
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

export default function WeeklyPlanEditor({ open, dateKey, plans, selectedPlanId, onClose, onSaved }) {
  const dialogRef = useRef(null);
  const initializedKey = useRef(null);
  const [draftPlans, setDraftPlans] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [originalIds, setOriginalIds] = useState([]);
  const [library, setLibrary] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customForm, setCustomForm] = useState(blankExerciseForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.body.classList.add("dialog-open");
    } else if (!open && dialog.open) {
      dialog.close();
    }
    if (!open) {
      document.body.classList.remove("dialog-open");
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      initializedKey.current = null;
      return;
    }
    const key = `${dateKey}:${selectedPlanId ?? ""}`;
    if (initializedKey.current === key) return;
    initializedKey.current = key;

    const drafts = (plans || []).map(draftFromPlan);
    setDraftPlans(drafts);
    setOriginalIds((plans || []).map((plan) => plan.id));
    setSelectedKey(selectedPlanId ? String(selectedPlanId) : drafts[0]?.key ?? null);
    setError("");
    setPickerOpen(false);
    setCustomOpen(false);
    setCustomForm(blankExerciseForm);

    exerciseApi.list()
      .then(setLibrary)
      .catch((failure) => setError(failure.message));
  }, [open, dateKey, selectedPlanId, plans]);

  const selectedPlan = draftPlans.find((plan) => plan.key === selectedKey) || null;

  const updatePlan = (field, value) => {
    setDraftPlans((current) => current.map((plan) => (
      plan.key === selectedKey ? { ...plan, [field]: value } : plan
    )));
  };

  const updateExercise = (exerciseKey, field, value) => {
    setDraftPlans((current) => current.map((plan) => (
      plan.key === selectedKey
        ? { ...plan, exercises: plan.exercises.map((exercise) => (
            exercise.key === exerciseKey ? { ...exercise, [field]: value } : exercise
          )) }
        : plan
    )));
  };

  const addPlan = () => {
    const draft = newDraft();
    setDraftPlans((current) => [...current, draft]);
    setSelectedKey(draft.key);
  };

  const removePlan = (key) => {
    const remaining = draftPlans.filter((plan) => plan.key !== key);
    setDraftPlans(remaining);
    setSelectedKey((selected) => (selected === key ? remaining[0]?.key ?? null : selected));
  };

  const movePlan = (key, direction) => {
    setDraftPlans((current) => {
      const index = current.findIndex((plan) => plan.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addExercise = (exercise) => {
    setDraftPlans((current) => current.map((plan) => (
      plan.key === selectedKey
        ? {
            ...plan,
            exercises: [...plan.exercises, {
              key: nextKey(),
              exerciseId: exercise.id,
              name: exercise.name,
              category: exercise.category,
              setCount: exercise.setCount ?? "",
              reps: exercise.reps || "",
              restSeconds: exercise.restSeconds ?? "",
              instructions: exercise.instructions || "",
            }],
          }
        : plan
    )));
    setPickerOpen(false);
  };

  const removeExercise = (exerciseKey) => {
    setDraftPlans((current) => current.map((plan) => (
      plan.key === selectedKey
        ? { ...plan, exercises: plan.exercises.filter((exercise) => exercise.key !== exerciseKey) }
        : plan
    )));
  };

  const moveExercise = (exerciseKey, direction) => {
    setDraftPlans((current) => current.map((plan) => {
      if (plan.key !== selectedKey) return plan;
      const index = plan.exercises.findIndex((exercise) => exercise.key === exerciseKey);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= plan.exercises.length) return plan;
      const exercises = [...plan.exercises];
      [exercises[index], exercises[target]] = [exercises[target], exercises[index]];
      return { ...plan, exercises };
    }));
  };

  const createCustomExercise = async () => {
    if (!customForm.name.trim()) {
      setError("Give the custom exercise a name.");
      return;
    }
    setError("");
    try {
      const created = await exerciseApi.createCustom({
        name: customForm.name.trim(),
        category: customForm.category,
        equipment: customForm.equipment.trim() || "None",
        difficulty: customForm.difficulty,
        setCount: customForm.setCount === "" ? null : Number(customForm.setCount),
        reps: customForm.reps.trim() || null,
        restSeconds: customForm.restSeconds === "" ? null : Number(customForm.restSeconds),
        instructions: customForm.instructions.trim() || null,
      });
      setLibrary((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      addExercise(created);
      setCustomOpen(false);
      setCustomForm(blankExerciseForm);
    } catch (failure) {
      setError(failure.message);
    }
  };

  const saveDay = async () => {
    setSaving(true);
    setError("");
    try {
      if (draftPlans.length === 0) {
        for (const id of originalIds) {
          await workoutPlanApi.remove(id);
        }
        await onSaved();
        return;
      }

      for (const plan of draftPlans) {
        if (!plan.name.trim() || !plan.category || !Number(plan.durationMinutes)) {
          setError("Each workout needs a name, category, and duration.");
          return;
        }
        if (plan.exercises.some((exercise) => !exercise.name.trim() || !exercise.category)) {
          setError("Each exercise needs a name and category.");
          return;
        }
      }

      const currentIds = new Set(draftPlans.map((plan) => plan.id).filter(Boolean));
      for (const id of originalIds) {
        if (!currentIds.has(id)) {
          await workoutPlanApi.remove(id);
        }
      }

      const savedIds = [];
      for (const plan of draftPlans) {
        const payload = {
          name: plan.name.trim(),
          category: plan.category,
          durationMinutes: Number(plan.durationMinutes),
          plannedAt: `${dateKey}T09:00:00`,
          notes: plan.notes.trim(),
          exercises: plan.exercises.map((exercise) => ({
            exerciseId: exercise.exerciseId || null,
            name: exercise.name.trim(),
            category: exercise.category,
            setCount: exercise.setCount === "" ? null : Number(exercise.setCount),
            reps: exercise.reps.trim() || null,
            restSeconds: exercise.restSeconds === "" ? null : Number(exercise.restSeconds),
            instructions: exercise.instructions.trim() || null,
          })),
        };
        const saved = plan.id
          ? await workoutPlanApi.update(plan.id, payload)
          : await workoutPlanApi.create(payload);
        savedIds.push(saved.id);
      }

      if (savedIds.length > 0) {
        await workoutPlanApi.reorder(dateKey, savedIds);
      }
      await onSaved();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  };

  const close = () => {
    if (!saving) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="app-dialog plan-editor-dialog"
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => { if (event.target === dialogRef.current) close(); }}
    >
      <button className="dialog-close" type="button" aria-label="Close day editor" onClick={close}>
        <X />
      </button>
      <span className="eyebrow">EDIT DAY</span>
      <h2>{formatDate(dateKey)}</h2>
      {error && <p className="form-message is-error" role="alert">{error}</p>}

      <div className="plan-editor-grid">
        <aside className="editor-workout-list" aria-label="Workouts for this day">
          {draftPlans.length === 0 && <p className="activity-empty">No workouts for this day yet.</p>}
          {draftPlans.map((plan, index) => (
            <div className={`editor-workout-item${plan.key === selectedKey ? " is-active" : ""}`} key={plan.key}>
              <button type="button" className="editor-workout-select" onClick={() => setSelectedKey(plan.key)}>
                <strong>{plan.name || "Untitled session"}</strong>
                <small>{plan.category} · {plan.durationMinutes || 0} min · {plan.exercises.length} exercises</small>
                {plan.completed && <span className="workout-done-badge"><CheckCircle2 /> Done</span>}
              </button>
              <div className="editor-move-buttons">
                <button type="button" aria-label="Move workout up" disabled={index === 0} onClick={() => movePlan(plan.key, -1)}><ArrowUp /></button>
                <button type="button" aria-label="Move workout down" disabled={index === draftPlans.length - 1} onClick={() => movePlan(plan.key, 1)}><ArrowDown /></button>
                <button type="button" aria-label="Remove workout" onClick={() => removePlan(plan.key)}><Trash2 /></button>
              </div>
            </div>
          ))}
          <button type="button" className="button button-small button-outline" onClick={addPlan}>
            <Plus /> Add workout
          </button>
        </aside>

        <section className="editor-panel">
          {!selectedPlan ? (
            <p className="activity-empty">Select a workout to edit its details and exercises.</p>
          ) : (
            <>
              <div className="editor-fields">
                <label>Session name<input value={selectedPlan.name} onChange={(event) => updatePlan("name", event.target.value)} maxLength="100" /></label>
                <label>Category<select value={selectedPlan.category} onChange={(event) => updatePlan("category", event.target.value)}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
                <label>Minutes<input type="number" min="1" max="1440" value={selectedPlan.durationMinutes} onChange={(event) => updatePlan("durationMinutes", event.target.value)} /></label>
                <label className="editor-notes">Notes<textarea rows="2" maxLength="500" value={selectedPlan.notes} onChange={(event) => updatePlan("notes", event.target.value)} /></label>
              </div>

              <div className="editor-exercises">
                <div className="editor-exercises-head">
                  <h3>Exercises</h3>
                  <div className="editor-add-actions">
                    <button type="button" className="text-button" onClick={() => { setPickerOpen((current) => !current); setCustomOpen(false); }}>Add from library</button>
                    <button type="button" className="text-button" onClick={() => { setCustomOpen((current) => !current); setPickerOpen(false); }}>Add custom</button>
                  </div>
                </div>

                {pickerOpen && <ExercisePicker exercises={library} onSelect={addExercise} onClose={() => setPickerOpen(false)} />}

                {customOpen && (
                  <div className="custom-exercise-form">
                    <div className="editor-fields">
                      <label>Name<input value={customForm.name} onChange={(event) => setCustomForm((current) => ({ ...current, name: event.target.value }))} maxLength="100" /></label>
                      <label>Category<select value={customForm.category} onChange={(event) => setCustomForm((current) => ({ ...current, category: event.target.value }))}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
                      <label>Equipment<input value={customForm.equipment} onChange={(event) => setCustomForm((current) => ({ ...current, equipment: event.target.value }))} maxLength="80" /></label>
                      <label>Difficulty<select value={customForm.difficulty} onChange={(event) => setCustomForm((current) => ({ ...current, difficulty: event.target.value }))}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
                      <label>Sets<input type="number" min="0" max="50" value={customForm.setCount} onChange={(event) => setCustomForm((current) => ({ ...current, setCount: event.target.value }))} /></label>
                      <label>Reps<input value={customForm.reps} onChange={(event) => setCustomForm((current) => ({ ...current, reps: event.target.value }))} maxLength="32" /></label>
                      <label>Rest (sec)<input type="number" min="0" max="600" value={customForm.restSeconds} onChange={(event) => setCustomForm((current) => ({ ...current, restSeconds: event.target.value }))} /></label>
                      <label className="editor-notes">Instructions<textarea rows="2" maxLength="500" value={customForm.instructions} onChange={(event) => setCustomForm((current) => ({ ...current, instructions: event.target.value }))} /></label>
                    </div>
                    <div className="editor-add-actions">
                      <button type="button" className="button button-small" onClick={createCustomExercise}>Create & add</button>
                      <button type="button" className="button button-small button-outline" onClick={() => setCustomOpen(false)}>Cancel</button>
                    </div>
                  </div>
                )}

                {selectedPlan.exercises.length === 0 ? (
                  <p className="activity-empty">No exercises yet. Add one from the library or create a custom exercise.</p>
                ) : (
                  <div className="editor-exercise-list">
                    {selectedPlan.exercises.map((exercise, index) => (
                      <div className="editor-exercise" key={exercise.key}>
                        <div className="editor-exercise-top">
                          <strong>{exercise.name}</strong>
                          <div className="editor-move-buttons">
                            <button type="button" aria-label="Move exercise up" disabled={index === 0} onClick={() => moveExercise(exercise.key, -1)}><ArrowUp /></button>
                            <button type="button" aria-label="Move exercise down" disabled={index === selectedPlan.exercises.length - 1} onClick={() => moveExercise(exercise.key, 1)}><ArrowDown /></button>
                            <button type="button" aria-label="Remove exercise" onClick={() => removeExercise(exercise.key)}><Trash2 /></button>
                          </div>
                        </div>
                        <div className="editor-exercise-fields">
                          <label>Name<input value={exercise.name} onChange={(event) => updateExercise(exercise.key, "name", event.target.value)} maxLength="100" /></label>
                          <label>Category<select value={exercise.category} onChange={(event) => updateExercise(exercise.key, "category", event.target.value)}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
                          <label>Sets<input type="number" min="0" max="50" value={exercise.setCount} onChange={(event) => updateExercise(exercise.key, "setCount", event.target.value)} /></label>
                          <label>Reps<input value={exercise.reps} onChange={(event) => updateExercise(exercise.key, "reps", event.target.value)} maxLength="32" /></label>
                          <label>Rest (sec)<input type="number" min="0" max="600" value={exercise.restSeconds} onChange={(event) => updateExercise(exercise.key, "restSeconds", event.target.value)} /></label>
                          <label className="editor-exercise-notes">Instructions<textarea rows="2" maxLength="500" value={exercise.instructions} onChange={(event) => updateExercise(exercise.key, "instructions", event.target.value)} /></label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      <div className="plan-editor-actions">
        <button type="button" className="button button-small button-outline" onClick={close} disabled={saving}>Cancel</button>
        <button type="button" className="button button-small" onClick={saveDay} disabled={saving}>{saving ? "Saving…" : "Save day"}</button>
      </div>
    </dialog>
  );
}
