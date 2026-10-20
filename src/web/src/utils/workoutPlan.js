export function exerciseDose(exercise) {
  return [
    exercise.setCount ? `${exercise.setCount} sets` : null,
    exercise.reps || null,
    exercise.restSeconds ? `${exercise.restSeconds}s rest` : null,
  ].filter(Boolean).join(" · ");
}

export function canLogPlan(day, plan) {
  return Boolean(day?.isToday) && !plan?.completed;
}

export function logButtonLabel(plan, logging) {
  if (plan?.completed) return "Logged";
  if (logging) return "Logging…";
  return "Log workout";
}

export function logButtonTitle(day, plan) {
  if (plan?.completed) return "This workout is already logged.";
  if (!day?.isToday) return "Only today's workout can be logged.";
  return undefined;
}

export function formatCompletedAt(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}
