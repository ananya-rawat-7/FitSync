import PlannedWorkoutCard from "./PlannedWorkoutCard.jsx";

export default function WeekDayColumn({
  day,
  plans,
  onAdd,
  onEditDay,
  onLog,
  onEditPlan,
  onRemovePlan,
  loggingPlanId,
}) {
  return (
    <article className={`week-day${day.isToday ? " is-today" : ""}${day.isPast ? " is-past" : ""}`}>
      <header className="week-day-header">
        <span>{day.label}</span>
        <small>{day.dateLabel}</small>
      </header>

      {plans.length === 0 ? (
        <div className="week-day-empty">
          <p>Rest / no session planned.</p>
          <button type="button" className="text-button" onClick={() => onAdd(day.key)}>+ Add session</button>
        </div>
      ) : (
        <>
          <button type="button" className="text-button week-day-edit" onClick={() => onEditDay(day.key)}>Edit day</button>
          {plans.map((plan) => (
            <PlannedWorkoutCard
              key={plan.id}
              plan={plan}
              day={day}
              onLog={onLog}
              onEdit={(selected) => onEditPlan(day.key, selected)}
              onRemove={onRemovePlan}
              logging={loggingPlanId === plan.id}
            />
          ))}
          <button type="button" className="text-button week-day-add" onClick={() => onAdd(day.key)}>+ Add another workout</button>
        </>
      )}
    </article>
  );
}
