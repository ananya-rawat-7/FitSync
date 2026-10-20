import { Flame } from "lucide-react";
import { formatMacro } from "../utils/nutrition.js";

export default function MacroSummary({ totals, target }) {
  const tiles = [
    { label: "CALORIES", value: Math.round(totals.calories), target: target?.calories, unit: "kcal" },
    { label: "PROTEIN", value: totals.protein, target: target?.protein, unit: "g" },
    { label: "CARBS", value: totals.carbs, target: target?.carbs, unit: "g" },
    { label: "FAT", value: totals.fat, target: target?.fat, unit: "g" },
  ];

  return (
    <section className="dashboard macro-summary">
      <div className="dashboard-top">
        <div><span className="dashboard-overline">TODAY'S MACROS</span><h2>What you have logged.</h2></div>
        <Flame />
      </div>
      <div className="macro-grid">
        {tiles.map((tile) => (
          <article className="macro-tile" key={tile.label}>
            <span>{tile.label}</span>
            <strong>
              {tile.unit === "kcal" ? tile.value.toLocaleString() : formatMacro(tile.value)}
            </strong>
            <small>
              {tile.target
                ? `of ${tile.unit === "kcal" ? tile.target.toLocaleString() : formatMacro(tile.target)}`
                : "logged"}
            </small>
          </article>
        ))}
      </div>
      <p className="calorie-note">Targets are rough adult estimates based on your profile and goal, not medical advice.</p>
    </section>
  );
}
