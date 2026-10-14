export default function WeeklyBarChart({
  eyebrow,
  title,
  legend,
  markerLegend,
  ariaLabel,
  data,
  note,
  maxValue,
  markerPercent,
}) {
  const chartMax = Math.max(maxValue || 0, ...data.map((item) => item.value), 1);

  return (
    <section className="dashboard chart-panel">
      <div className="dashboard-top">
        <div>
          <span className="dashboard-overline">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <span className="chart-key">
          <span><i className="chart-key-bar" />{legend}</span>
          {markerPercent !== null && markerPercent !== undefined && markerLegend && (
            <span><i className="chart-key-marker" />{markerLegend}</span>
          )}
        </span>
      </div>
      <div className="simple-chart" role="img" aria-label={ariaLabel}>
        {data.map((item) => (
          <div className="simple-chart-column" key={item.key}>
            <strong>{item.value ? item.value.toLocaleString() : ""}</strong>
            <div className="simple-chart-track">
              <i style={{ height: `${item.value ? Math.max(5, item.value / chartMax * 100) : 0}%` }} />
              {markerPercent !== null && markerPercent !== undefined && (
                <b className="calorie-target-marker" style={{ bottom: `${markerPercent}%` }} />
              )}
            </div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <p className="calorie-note">{note}</p>
    </section>
  );
}
