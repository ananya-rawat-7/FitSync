import { useState } from "react";

export default function ExercisePicker({ exercises, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const filtered = exercises.filter((exercise) => {
    if (!needle) return true;
    return [exercise.name, exercise.category, exercise.equipment]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(needle));
  });

  return (
    <div className="exercise-picker">
      <div className="exercise-picker-head">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search the exercise library"
          aria-label="Search the exercise library"
          autoFocus
        />
        <button type="button" className="text-button" onClick={onClose}>Close</button>
      </div>
      <div className="exercise-picker-list">
        {filtered.length === 0 ? (
          <p className="activity-empty">No exercises match that search.</p>
        ) : filtered.map((exercise) => (
          <button type="button" className="exercise-picker-item" key={exercise.id} onClick={() => onSelect(exercise)}>
            <span>
              <strong>{exercise.name}</strong>
              <small>{exercise.category} · {exercise.equipment} · {exercise.difficulty}</small>
            </span>
            <span className="exercise-picker-dose">
              {exercise.setCount ? `${exercise.setCount} sets` : ""}
              {exercise.reps ? ` · ${exercise.reps}` : ""}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
