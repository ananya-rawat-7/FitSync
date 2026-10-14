function toLocalDateKey(value) {
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

export function getWeeklyChartData(items, getDate, getValue) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - 6 + index);

    return {
      key: toLocalDateKey(date),
      label: date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1),
      value: 0,
    };
  });
  const totalsByDate = new Map(days.map((day) => [day.key, day]));

  items.forEach((item) => {
    const day = totalsByDate.get(toLocalDateKey(getDate(item)));
    if (!day) return;

    const value = Number(getValue(item));
    if (Number.isFinite(value)) day.value += value;
  });

  return days;
}
