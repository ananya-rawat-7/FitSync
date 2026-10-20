import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { workoutApi } from "../services/api.js";

const CATEGORIES = ["Strength", "Cardio", "Core", "Mobility", "HIIT", "Recovery"];

function localDateTimeValue(date = new Date()) {
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function SessionLogEditor({ session, open, onClose, onSaved }) {
  const dialogRef = useRef(null);
  const [form, setForm] = useState({
    name: "",
    category: "Strength",
    durationMinutes: "30",
    performedAt: "",
    notes: "",
  });
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
    if (!session) return;
    setForm({
      name: session.name || "",
      category: session.category || "Strength",
      durationMinutes: String(session.durationMinutes ?? 30),
      performedAt: localDateTimeValue(new Date(session.performedAt)),
      notes: session.notes || "",
    });
    setError("");
  }, [session]);

  const change = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!session) return;
    setSaving(true);
    setError("");
    try {
      await workoutApi.update(session.id, {
        name: form.name.trim(),
        category: form.category,
        durationMinutes: Number(form.durationMinutes),
        performedAt: form.performedAt,
        notes: form.notes.trim(),
      });
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
      className="app-dialog"
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => { if (event.target === dialogRef.current) close(); }}
    >
      <button className="dialog-close" type="button" aria-label="Close session editor" onClick={close}>
        <X />
      </button>
      <span className="eyebrow">WORKOUT LOG</span>
      <h2>Edit session.</h2>
      <form onSubmit={submit}>
        <label htmlFor="log-name">Session name</label>
        <input id="log-name" name="name" value={form.name} onChange={change} maxLength="100" required />
        <label htmlFor="log-category">Category</label>
        <select id="log-category" name="category" value={form.category} onChange={change}>
          {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
        </select>
        <label htmlFor="log-minutes">Minutes</label>
        <input id="log-minutes" name="durationMinutes" type="number" min="1" max="1440" value={form.durationMinutes} onChange={change} required />
        <label htmlFor="log-date">Date and time</label>
        <input id="log-date" name="performedAt" type="datetime-local" value={form.performedAt} onChange={change} required />
        <label htmlFor="log-notes">Notes</label>
        <textarea id="log-notes" name="notes" rows="2" maxLength="500" value={form.notes} onChange={change} />
        {error && <p className="form-message is-error" role="alert">{error}</p>}
        <button className="button dialog-submit" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save session"}
        </button>
      </form>
    </dialog>
  );
}
