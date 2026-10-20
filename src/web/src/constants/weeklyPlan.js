export const weeklyGoalGuidance = {
  LOSE_WEIGHT: "A mix of cardio, full-body strength, core work, and active recovery to support gradual fat loss.",
  GAIN_WEIGHT: "Four strength sessions with progressive overload, light cardio, and real recovery days to support steady weight gain.",
  BUILD_STRENGTH: "Strength-focused sessions with easy cardio and mobility so you can recover and keep adding weight over time.",
  IMPROVE_ENDURANCE: "Steady cardio with supporting strength work and mobility to build stamina without overtraining.",
  IMPROVE_FLEXIBILITY: "Gentle mobility flows and easy walks, with rest days built in.",
  MAINTAIN_FITNESS: "A balanced mix of strength, cardio, mobility, and recovery.",
  OTHER: "A balanced week with strength, cardio, mobility, and recovery.",
};

export function localDateKey(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getWeekDays(weekOffset = 0) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = localDateKey(today);
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset + weekOffset * 7);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const key = localDateKey(date);

    return {
      key,
      label: date.toLocaleDateString(undefined, { weekday: "long" }),
      shortLabel: date.toLocaleDateString(undefined, { weekday: "short" }),
      dateLabel: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      isToday: key === todayKey,
      isPast: key < todayKey,
      isFuture: key > todayKey,
    };
  });
}

export function getGoalGuidance(goal) {
  return weeklyGoalGuidance[goal] || weeklyGoalGuidance.MAINTAIN_FITNESS;
}
