import { localDateKey } from "../constants/weeklyPlan.js";

export function getCalorieEstimate(profile, bmi) {
  if (!profile?.weightKg || !profile?.heightCm || !profile?.age || profile.age < 18) return null;

  const weight = Number(profile.weightKg);
  const height = Number(profile.heightCm);
  const age = Number(profile.age);
  const base = 10 * weight + 6.25 * height - 5 * age;
  const activityFactor = 1.2;
  let goalAdjustment = 0;

  if (profile.fitnessGoal === "LOSE_WEIGHT" && bmi !== null && bmi >= 25) goalAdjustment = -300;
  if (profile.fitnessGoal === "GAIN_WEIGHT" && bmi !== null && bmi < 25) goalAdjustment = 300;
  if (profile.fitnessGoal === "BUILD_STRENGTH") goalAdjustment = 150;

  const estimates = [
    (base - 161) * activityFactor + goalAdjustment,
    (base + 5) * activityFactor + goalAdjustment,
  ].map((value) => Math.max(0, Math.round(value / 50) * 50));

  return { minimum: Math.min(...estimates), maximum: Math.max(...estimates) };
}

export function getMacroTargets(profile, bmi) {
  const estimate = getCalorieEstimate(profile, bmi);
  if (!estimate) return null;

  const calories = Math.round((estimate.minimum + estimate.maximum) / 2);
  let split = { protein: 0.30, carbs: 0.40, fat: 0.30 };
  if (profile?.fitnessGoal === "LOSE_WEIGHT") split = { protein: 0.35, carbs: 0.35, fat: 0.30 };
  if (profile?.fitnessGoal === "GAIN_WEIGHT" || profile?.fitnessGoal === "BUILD_STRENGTH") {
    split = { protein: 0.30, carbs: 0.45, fat: 0.25 };
  }
  if (profile?.fitnessGoal === "IMPROVE_ENDURANCE") split = { protein: 0.25, carbs: 0.50, fat: 0.25 };

  return {
    calories,
    protein: Math.round(calories * split.protein / 4),
    carbs: Math.round(calories * split.carbs / 4),
    fat: Math.round(calories * split.fat / 9),
    minimum: estimate.minimum,
    maximum: estimate.maximum,
  };
}

export function roundNutrition(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}

export function scaleNutrition(per100, grams) {
  const ratio = Number(grams || 0) / 100;
  return {
    calories: roundNutrition(Number(per100?.calories || 0) * ratio),
    protein: roundNutrition(Number(per100?.protein || 0) * ratio),
    carbs: roundNutrition(Number(per100?.carbs || 0) * ratio),
    fat: roundNutrition(Number(per100?.fat || 0) * ratio),
  };
}

export function foodPer100(food) {
  return {
    calories: Number(food?.caloriesPer100g || 0),
    protein: Number(food?.proteinPer100g || 0),
    carbs: Number(food?.carbsPer100g || 0),
    fat: Number(food?.fatPer100g || 0),
  };
}

export function per100FromItem(item) {
  const grams = Number(item?.grams) || 1;
  return {
    calories: Number(item?.calories || 0) / grams * 100,
    protein: Number(item?.protein || 0) / grams * 100,
    carbs: Number(item?.carbs || 0) / grams * 100,
    fat: Number(item?.fat || 0) / grams * 100,
  };
}

export function itemNutrition(food, grams) {
  return scaleNutrition(foodPer100(food), grams);
}

export function nutrientTotals(items) {
  return (items || []).reduce((totals, item) => ({
    calories: roundNutrition(totals.calories + Number(item.calories || 0)),
    protein: roundNutrition(totals.protein + Number(item.protein || 0)),
    carbs: roundNutrition(totals.carbs + Number(item.carbs || 0)),
    fat: roundNutrition(totals.fat + Number(item.fat || 0)),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

export function mealTotals(meal) {
  return nutrientTotals(meal?.items || []);
}

export function logTotals(entries) {
  return nutrientTotals(entries || []);
}

export function formatMacro(value, unit = "g") {
  return `${roundNutrition(value)}${unit}`;
}

export function isFutureDate(dateKey) {
  return dateKey > localDateKey(new Date());
}

export function getMealGuidance(goal) {
  if (goal === "LOSE_WEIGHT") {
    return "High-protein, vegetable-forward meals with steady carbohydrates and room for recovery.";
  }
  if (goal === "GAIN_WEIGHT" || goal === "BUILD_STRENGTH") {
    return "Energy-dense meals with protein at every sitting to support training and recovery.";
  }
  if (goal === "IMPROVE_ENDURANCE") {
    return "Carb-focused meals with enough protein to support steady training volume.";
  }
  return "Balanced meals with protein, whole grains, vegetables, and healthy fats.";
}
