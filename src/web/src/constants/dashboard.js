export const fitnessGoalLabels = {
  BUILD_STRENGTH: "build strength",
  LOSE_WEIGHT: "lose weight gradually",
  IMPROVE_ENDURANCE: "improve endurance",
  IMPROVE_FLEXIBILITY: "improve flexibility",
  MAINTAIN_FITNESS: "maintain fitness",
  OTHER: "build a steady fitness routine",
};

export function getAdultBmi(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  return weightKg / ((heightCm / 100) ** 2);
}

export function getBmiCategory(bmi) {
  if (bmi < 18.5) return { label: "Below adult reference range", className: "bmi-low" };
  if (bmi < 25) return { label: "Within adult reference range", className: "bmi-standard" };
  if (bmi < 30) return { label: "Above adult reference range", className: "bmi-raised" };
  return { label: "High adult reference range", className: "bmi-high" };
}

export function getDietPlan(goal, bmi) {
  const plan = [
    { name: "Breakfast", share: 25, example: "Oats or whole-grain toast with fruit and a protein food" },
    { name: "Lunch", share: 30, example: "Vegetables, a whole grain, and beans, eggs, fish, or another protein" },
    { name: "Snack", share: 15, example: "Fruit with yogurt, nuts, or another satisfying snack" },
    { name: "Dinner", share: 30, example: "Vegetables with a protein food and grains or potatoes" },
  ];

  if (goal === "BUILD_STRENGTH") {
    plan[0].example = "Oats or whole-grain toast with fruit and eggs, yogurt, or another protein";
    plan[2].example = "A convenient protein food with fruit or whole grains";
  }
  if (goal === "IMPROVE_ENDURANCE") {
    plan[0].example = "Oats, whole-grain toast, or another carbohydrate-rich choice with fruit";
    plan[2].example = "Fruit, yogurt, or another snack that suits your training schedule";
  }
  if (bmi !== null && bmi < 18.5) {
    plan[0].example = "Oats or whole-grain toast with fruit, yogurt, eggs, or another satisfying protein food";
    plan[2].example = "A nourishing, energy-rich snack such as yogurt with fruit and nuts";
  }

  return plan;
}

export function getDietGuidance(goal, bmi) {
  if (bmi !== null && bmi < 18.5) {
    return "Your BMI is below the adult reference range. These balanced meal ideas do not set a weight-loss target; ask a qualified health professional for personal nutrition advice.";
  }
  if (goal === "LOSE_WEIGHT" && bmi !== null && bmi >= 25) {
    return "For your selected focus, these ideas emphasize satisfying meals with vegetables, fiber-rich foods, and a protein source—not restriction or rapid weight loss.";
  }
  if (goal === "LOSE_WEIGHT") {
    return "These are balanced meal ideas, not a weight-loss diet. Add your details in Profile for an adult reference estimate before discussing personal goals with a professional.";
  }
  return "Flexible, balanced meal ideas shaped by your selected focus and profile—not a prescriptive diet or medical nutrition plan.";
}

export function getFitnessPlan(goal, bmi) {
  const sessionsByGoal = {
    IMPROVE_FLEXIBILITY: "Try 3 gentle mobility sessions and 2 comfortable walks this week.",
    IMPROVE_ENDURANCE: "Try 3 easy-to-moderate cardio sessions, with rest or gentle movement between them.",
    BUILD_STRENGTH: "Try 2 or 3 full-body strength sessions, with recovery days between sessions.",
  };
  const sessions = sessionsByGoal[goal] || "Try 2 strength sessions and a few comfortable walks, then build up at your own pace.";

  if (bmi !== null && bmi < 18.5) {
    return `${sessions} Prioritize recovery and speak with a qualified health professional before pursuing weight-change goals.`;
  }
  return `${sessions} Gradually work toward general adult activity guidance of 150 minutes of moderate movement per week, if appropriate for you.`;
}
