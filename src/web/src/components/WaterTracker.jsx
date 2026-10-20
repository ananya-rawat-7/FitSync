import { useState } from "react";
import { Droplets, Trash2 } from "lucide-react";
import WeeklyBarChart from "./WeeklyBarChart.jsx";
import { WATER_TARGET_ML } from "../constants/nutrition.js";

export default function WaterTracker({
  weekDays,
  entries,
  todayKey,
  onAdd,
  onRemove,
  saving,
  deletingId,
}) {
  const [customAmount, setCustomAmount] = useState("250");
  const totalsByDay = entries.reduce((groups, entry) => {
    groups[entry.loggedOn] = (groups[entry.loggedOn] || 0) + entry.milliliters;
    return groups;
  }, {});
  const chartData = weekDays.map((day) => ({
    key: day.key,
    label: day.shortLabel,
    value: totalsByDay[day.key] || 0,
  }));
  const todayTotal = totalsByDay[todayKey] || 0;
  const todayEntries = entries.filter((entry) => entry.loggedOn === todayKey);
  const chartMax = Math.max(WATER_TARGET_ML, ...chartData.map((day) => day.value), 1);
  const markerPercent = Math.min(100, WATER_TARGET_ML / chartMax * 100);

  const addCustom = () => {
    const amount = Number(customAmount);
    if (Number.isFinite(amount) && amount > 0) onAdd(amount);
  };

  return (
    <>
      <section className="dashboard water-tracker">
        <div className="dashboard-top">
          <div><span className="dashboard-overline">WATER</span><h2>Stay hydrated.</h2></div>
          <Droplets />
        </div>

        <div className="water-summary">
          <div>
            <span>TODAY</span>
            <strong>{todayTotal.toLocaleString()} <small>/ {WATER_TARGET_ML.toLocaleString()} ml</small></strong>
          </div>
          <div className="water-quick-add">
            <button type="button" className="button button-small" disabled={saving} onClick={() => onAdd(250)}>+250 ml</button>
            <button type="button" className="button button-small" disabled={saving} onClick={() => onAdd(500)}>+500 ml</button>
            <span className="water-custom">
              <input
                type="number"
                min="1"
                max="5000"
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
                aria-label="Custom water amount in millilitres"
              />
              <button type="button" className="button button-small button-outline" disabled={saving} onClick={addCustom}>Add</button>
            </span>
          </div>
        </div>

        <div className="water-log">
          <div className="water-log-head"><h3>Today's water</h3><span>{todayEntries.length} entries</span></div>
          {todayEntries.length === 0 ? (
            <p className="activity-empty">No water logged yet today.</p>
          ) : (
            <ul>
              {todayEntries.map((entry) => (
                <li key={entry.id}>
                  <span>
                    <strong>{entry.milliliters.toLocaleString()} ml</strong>
                    <small>{new Date(entry.loggedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${entry.milliliters} ml water`}
                    disabled={deletingId === entry.id}
                    onClick={() => onRemove(entry)}
                  >
                    <Trash2 />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <WeeklyBarChart
        eyebrow="YOUR WEEK"
        title="Water chart."
        legend="ml"
        markerLegend="2 L goal"
        ariaLabel="Water intake per day for the current week"
        data={chartData}
        maxValue={chartMax}
        markerPercent={markerPercent}
        note="The dashed line is a general 2 litre reference, not a personal prescription."
      />
    </>
  );
}
