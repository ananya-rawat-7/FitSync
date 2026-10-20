import { useEffect, useRef, useState } from "react";
import { Trash2, X } from "lucide-react";
import FoodPicker from "./FoodPicker.jsx";
import { foodApi, mealPlanApi } from "../services/api.js";
import {
  foodPer100,
  formatMacro,
  per100FromItem,
  scaleNutrition,
} from "../utils/nutrition.js";

let itemCounter = 0;
const nextKey = () => `meal-item-${Date.now()}-${itemCounter++}`;

const blankCustomFood = {
  name: "",
  category: "Custom foods",
  caloriesPer100g: "",
  proteinPer100g: "",
  carbsPer100g: "",
  fatPer100g: "",
};

function formatDate(dateKey) {
  const date = new Date(`${dateKey}T12:00:00`);
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function draftFromMeal(meal, foods) {
  return (meal?.items || []).map((item) => {
    const food = foods.find((candidate) => candidate.id === item.foodId);
    return {
      key: nextKey(),
      foodId: item.foodId,
      name: item.name,
      grams: String(item.grams),
      per100: food ? foodPer100(food) : per100FromItem(item),
    };
  });
}

export default function MealEditor({
  open,
  meal,
  dateKey,
  foods,
  onClose,
  onSaved,
  onFoodCreated,
}) {
  const dialogRef = useRef(null);
  const initializedKey = useRef(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customForm, setCustomForm] = useState(blankCustomFood);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.body.classList.add("dialog-open");
    } else if (!open && dialog.open) {
      dialog.close();
    }
    if (!open) {
      document.body.classList.remove("dialog-open");
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      initializedKey.current = null;
      return;
    }
    const key = `${meal?.id ?? "new"}:${dateKey}`;
    if (initializedKey.current === key) return;
    initializedKey.current = key;

    setTitle(meal?.title || "New meal");
    setNotes(meal?.notes || "");
    setItems(draftFromMeal(meal, foods));
    setPickerOpen(false);
    setCustomOpen(false);
    setCustomForm(blankCustomFood);
    setError("");
  }, [open, meal, dateKey, foods]);

  const itemTotals = items.reduce((totals, item) => {
    const macros = scaleNutrition(item.per100, item.grams);
    return {
      calories: totals.calories + macros.calories,
      protein: totals.protein + macros.protein,
      carbs: totals.carbs + macros.carbs,
      fat: totals.fat + macros.fat,
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const addFood = (food) => {
    setItems((current) => [...current, {
      key: nextKey(),
      foodId: food.id,
      name: food.name,
      grams: "100",
      per100: foodPer100(food),
    }]);
    setPickerOpen(false);
  };

  const updateGrams = (key, value) => {
    setItems((current) => current.map((item) => (
      item.key === key ? { ...item, grams: value } : item
    )));
  };

  const removeItem = (key) => {
    setItems((current) => current.filter((item) => item.key !== key));
  };

  const updateCustomField = (field, value) => {
    setCustomForm((current) => ({ ...current, [field]: value }));
  };

  const createCustomFood = async () => {
    const numeric = (value) => (value === "" ? null : Number(value));
    if (!customForm.name.trim() || numeric(customForm.caloriesPer100g) === null) {
      setError("Give the custom food a name and its per-100 g calories.");
      return;
    }
    setError("");
    try {
      const created = await foodApi.createCustom({
        name: customForm.name.trim(),
        category: customForm.category.trim() || "Custom foods",
        caloriesPer100g: numeric(customForm.caloriesPer100g) || 0,
        proteinPer100g: numeric(customForm.proteinPer100g) || 0,
        carbsPer100g: numeric(customForm.carbsPer100g) || 0,
        fatPer100g: numeric(customForm.fatPer100g) || 0,
      });
      onFoodCreated(created);
      addFood(created);
      setCustomOpen(false);
      setCustomForm(blankCustomFood);
    } catch (failure) {
      setError(failure.message);
    }
  };

  const save = async () => {
    if (!title.trim()) {
      setError("Give the meal a title.");
      return;
    }
    if (items.length === 0) {
      setError("Add at least one food to the meal.");
      return;
    }
    if (items.some((item) => !Number(item.grams) || Number(item.grams) <= 0)) {
      setError("Every food needs a positive amount in grams.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        plannedDate: dateKey,
        title: title.trim(),
        notes: notes.trim(),
        items: items.map((item) => ({ foodId: item.foodId, grams: Number(item.grams) })),
      };
      if (meal?.id) {
        await mealPlanApi.update(meal.id, payload);
      } else {
        await mealPlanApi.create(payload);
      }
      await onSaved();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  };

  const close = () => {
    if (!saving) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="app-dialog meal-editor-dialog"
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => { if (event.target === dialogRef.current) close(); }}
    >
      <button className="dialog-close" type="button" aria-label="Close meal editor" onClick={close}>
        <X />
      </button>
      <span className="eyebrow">{meal ? "EDIT MEAL" : "ADD MEAL"}</span>
      <h2>{meal ? "Edit meal" : "Add a meal"}</h2>
      <p className="meal-editor-date">{formatDate(dateKey)}</p>
      {error && <p className="form-message is-error" role="alert">{error}</p>}

      <div className="meal-editor-fields">
        <label>Meal title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength="120" /></label>
        <label className="meal-editor-notes">Notes<textarea rows="2" maxLength="500" value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
      </div>

      <div className="meal-editor-foods">
        <div className="meal-editor-heading">
          <h3>Foods</h3>
          <div className="editor-add-actions">
            <button type="button" className="text-button" onClick={() => { setPickerOpen((current) => !current); setCustomOpen(false); }}>Add from library</button>
            <button type="button" className="text-button" onClick={() => { setCustomOpen((current) => !current); setPickerOpen(false); }}>Add custom food</button>
          </div>
        </div>

        {pickerOpen && <FoodPicker foods={foods} onSelect={addFood} onClose={() => setPickerOpen(false)} />}

        {customOpen && (
          <div className="custom-food-form">
            <div className="meal-editor-fields">
              <label>Name<input value={customForm.name} onChange={(event) => updateCustomField("name", event.target.value)} maxLength="120" /></label>
              <label>Category<input value={customForm.category} onChange={(event) => updateCustomField("category", event.target.value)} maxLength="80" /></label>
              <label>Calories / 100 g<input type="number" min="0" step="0.1" value={customForm.caloriesPer100g} onChange={(event) => updateCustomField("caloriesPer100g", event.target.value)} /></label>
              <label>Protein / 100 g<input type="number" min="0" step="0.1" value={customForm.proteinPer100g} onChange={(event) => updateCustomField("proteinPer100g", event.target.value)} /></label>
              <label>Carbs / 100 g<input type="number" min="0" step="0.1" value={customForm.carbsPer100g} onChange={(event) => updateCustomField("carbsPer100g", event.target.value)} /></label>
              <label>Fat / 100 g<input type="number" min="0" step="0.1" value={customForm.fatPer100g} onChange={(event) => updateCustomField("fatPer100g", event.target.value)} /></label>
            </div>
            <div className="editor-add-actions">
              <button type="button" className="button button-small" onClick={createCustomFood}>Create & add</button>
              <button type="button" className="button button-small button-outline" onClick={() => setCustomOpen(false)}>Cancel</button>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <p className="activity-empty">No foods yet. Add from the library or create a custom food.</p>
        ) : (
          <div className="meal-editor-item-list">
            {items.map((item) => {
              const macros = scaleNutrition(item.per100, item.grams);
              return (
                <div className="meal-editor-item" key={item.key}>
                  <div className="meal-editor-item-name">
                    <strong>{item.name}</strong>
                    <span>{Math.round(item.per100.calories)} kcal per 100 g</span>
                  </div>
                  <label>Grams<input type="number" min="1" max="10000" step="1" value={item.grams} onChange={(event) => updateGrams(item.key, event.target.value)} /></label>
                  <div className="meal-editor-item-macros">
                    <span>{Math.round(macros.calories)} kcal</span>
                    <span>P {formatMacro(macros.protein)}</span>
                    <span>C {formatMacro(macros.carbs)}</span>
                    <span>F {formatMacro(macros.fat)}</span>
                  </div>
                  <button type="button" className="meal-editor-remove" aria-label={`Remove ${item.name}`} onClick={() => removeItem(item.key)}>
                    <Trash2 />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="meal-editor-totals">
          <span><strong>{Math.round(itemTotals.calories)}</strong> kcal</span>
          <span>P {formatMacro(itemTotals.protein)}</span>
          <span>C {formatMacro(itemTotals.carbs)}</span>
          <span>F {formatMacro(itemTotals.fat)}</span>
        </div>
      </div>

      <div className="plan-editor-actions">
        <button type="button" className="button button-small button-outline" onClick={close} disabled={saving}>Cancel</button>
        <button type="button" className="button button-small" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save meal"}</button>
      </div>
    </dialog>
  );
}
