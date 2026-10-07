import { useEffect, useState } from "react";
import { Activity, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { workoutApi } from "../services/api.js";

function getStats(workouts) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const recent = workouts.filter((item) => new Date(item.performedAt) >= start && new Date(item.performedAt) <= now);
  const activeDays = new Set(recent.map((item) => new Date(item.performedAt).toDateString()));
  return {
    recent,
    minutes: recent.reduce((sum, item) => sum + Number(item.durationMinutes), 0),
    activeDays: activeDays.size,
  };
}

export default function DashboardPage() {
  const [workouts, setWorkouts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workoutApi.list()
      .then(setWorkouts)
      .catch((failure) => setError(failure.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = getStats(workouts);
  const bars = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - 6 + index);
    return {
      label: day.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1),
      minutes: stats.recent.filter((item) => new Date(item.performedAt).toDateString() === day.toDateString())
        .reduce((sum, item) => sum + Number(item.durationMinutes), 0),
    };
  });
  const max = Math.max(1, ...bars.map((bar) => bar.minutes));

  return (
    <main className="page-main section-wrap">
      <div className="page-heading"><div><p className="eyebrow">PROGRESS, NOT PRESSURE</p><h1>YOUR <span>ACTIVITY.</span></h1><p>Your private workout log, synced with your account.</p></div><Link className="button" to="/workouts">Log a workout <ArrowUpRight /></Link></div>
      {error && <p className="form-message is-error" role="alert">{error}</p>}
      {loading ? <p className="status-message" role="status">Loading your workouts…</p> : (
        <>
          <section className="stat-grid dashboard-stats" aria-label="Workout statistics">
            <div className="stat-tile"><span>WORKOUTS</span><strong>{String(stats.recent.length).padStart(2, "0")}</strong><small>last 7 days</small></div>
            <div className="stat-tile"><span>ACTIVE MIN</span><strong>{stats.minutes}</strong><small>last 7 days</small></div>
            <div className="stat-tile"><span>ACTIVE DAYS</span><strong>{stats.activeDays}</strong><small>last 7 days</small></div>
            <div className="stat-tile stat-highlight"><span>ALL SESSIONS</span><strong>{workouts.length}</strong><small>in your log</small></div>
          </section>
          <section className="dashboard chart-panel">
            <div className="dashboard-top"><div><span className="dashboard-overline">YOUR ACTIVITY</span><h2>A steady week.</h2></div><span className="chart-key"><i /> Active minutes</span></div>
            <div className="bar-chart dashboard-chart" role="img" aria-label="Daily active minutes for the last seven days">
              <div className="chart-guides"><i>Minutes</i><i /><i /><i /></div>
              <div className="chart-bars">{bars.map((bar, index) => <div className="chart-column" key={`${bar.label}-${index}`}><div className="chart-bar" style={{ height: `${bar.minutes ? Math.max(5, bar.minutes / max * 100) : 2}%` }} /><span>{bar.label}</span></div>)}</div>
            </div>
          </section>
          <section className="dashboard recent-panel">
            <div className="dashboard-top"><div><span className="dashboard-overline">YOUR LOG</span><h2>Recent sessions</h2></div><Link className="text-link" to="/workouts">Manage workouts <ArrowUpRight /></Link></div>
            {error ? <p className="activity-empty">Your workout history is unavailable until the server reconnects.</p>
              : workouts.length === 0 ? <p className="activity-empty">No workouts logged yet. Add your first session to see your progress.</p> : (
              <ul className="activity-list">{workouts.slice(0, 5).map((item) => <li className="activity-item" key={item.id}><div className="activity-details"><strong>{item.name}</strong><span>{item.category} · {item.durationMinutes} min · {new Date(item.performedAt).toLocaleString()}</span></div><Activity /></li>)}</ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
