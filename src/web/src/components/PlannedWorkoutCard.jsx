import { CheckCircle2 } from "lucide-react";
import {
  canLogPlan,
  exerciseDose,
  formatCompletedAt,
  logButtonLabel,
  logButtonTitle,
} from "../utils/workoutPlan.js";

export default function PlannedWorkoutCard({ plan, day, onLog, onEdit, onRemove, logging }) {
  return (
    <div className={`planned-workout${plan.completed ? " is-completed" : ""}`}>
      <div className="planned-workout-heading">
        <strong>{plan.name}</strong>
        <span>{plan.category} · {plan.durationMinutes} min</span>
        {plan.completed && (
          <span className="workout-done-badge">
            <CheckCircle2 /> Done
          </span>
        )}
      </div>

      {plan.completedAt && (
        <p className="workout-logged-note">Logged {formatCompletedAt(plan.completedAt)}</p>
      )}
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
          disabled={!canLogPlan(day, plan) || logging}
          title={logButtonTitle(day, plan)}
          onClick={() => onLog(plan)}
        >
          {logButtonLabel(plan, logging)}
        </button>
        <button type="button" onClick={() => onEdit(plan)}>Edit</button>
        <button type="button" onClick={() => onRemove(plan)}>Remove</button>
      </div>
    </div>
  );
}
