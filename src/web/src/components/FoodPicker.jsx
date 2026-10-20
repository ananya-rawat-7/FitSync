import { useState } from "react";

export default function FoodPicker({ foods, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const filtered = foods.filter((food) => {
    if (!needle) return true;
    return [food.name, food.category]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(needle));
  });

  return (
    <div className="food-picker">
      <div className="food-picker-head">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search foods"
          aria-label="Search foods"
          autoFocus
        />
        <button type="button" className="text-button" onClick={onClose}>Close</button>
      </div>
      <div className="food-picker-list">
        {filtered.length === 0 ? (
          <p className="activity-empty">No foods match that search.</p>
        ) : filtered.map((food) => (
          <button type="button" className="food-picker-item" key={food.id} onClick={() => onSelect(food)}>
            <span>
              <strong>{food.name}</strong>
              <small>{food.category}{food.custom ? " · Custom" : ""}</small>
            </span>
            <span className="food-picker-macros">
              {food.caloriesPer100g} kcal · P {food.proteinPer100g} · C {food.carbsPer100g} · F {food.fatPer100g} / 100 g
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
