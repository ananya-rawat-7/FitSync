export function getWorkoutStats(workouts) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const recent = workouts.filter((item) => {
    const performedAt = new Date(item.performedAt);
    return performedAt >= start && performedAt <= now;
  });
  const activeDays = new Set(recent.map((item) => new Date(item.performedAt).toDateString()));

  return {
    recent,
    minutes: recent.reduce((sum, item) => sum + Number(item.durationMinutes), 0),
    activeDays: activeDays.size,
  };
}
