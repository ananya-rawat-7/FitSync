const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector(".primary-nav");
const loginDialog = document.querySelector("#login-dialog");
const registerDialog = document.querySelector("#register-dialog");
const workoutDialog = document.querySelector("#workout-dialog");
const accountSection = document.querySelector("#account");
const accountNav = document.querySelector("[data-account-nav]");
const loginTrigger = document.querySelector("[data-open-login]");
const toast = document.querySelector(".toast");
const registerForm = document.querySelector("#register-form");
const goalSelect = registerForm.elements.goal;
let currentProfile = null;

registerForm.querySelector("#register-password").before(
  document.querySelector("#registration-questions").content.cloneNode(true),
);

goalSelect.replaceChildren(
  new Option("Choose a goal", ""),
  new Option("Build strength", "BUILD_STRENGTH"),
  new Option("Improve endurance", "IMPROVE_ENDURANCE"),
  new Option("Move more often", "MOVE_MORE_OFTEN"),
  new Option("Support flexibility", "SUPPORT_FLEXIBILITY"),
  new Option("Feel healthier", "FEEL_HEALTHIER"),
  new Option("Weight loss", "WEIGHT_LOSS"),
  new Option("Weight gain", "WEIGHT_GAIN"),
  new Option("Maintain weight", "MAINTAIN_WEIGHT"),
);

if (window.lucide) {
  window.lucide.createIcons();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("is-visible"), 3000);
}

function updateBodyLock() {
  document.body.classList.toggle("dialog-open", loginDialog.open || registerDialog.open || workoutDialog.open);
}

let csrfToken;

async function apiRequest(path, options = {}) {
  let response;
  try {
    const method = (options.method || "GET").toUpperCase();
    const headers = {
      ...(options.headers || {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    };
    if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
      if (!csrfToken) {
        const csrfResponse = await fetch("/api/auth/csrf", { credentials: "same-origin" });
        const csrfResult = await csrfResponse.json().catch(() => ({}));
        if (!csrfResponse.ok || !csrfResult.token) throw new Error("Could not start a secure FitSync session.");
        csrfToken = csrfResult.token;
      }
      headers["X-XSRF-TOKEN"] = csrfToken;
    }
    response = await fetch(`/api${path}`, {
      credentials: "same-origin",
      ...options,
      headers,
    });
  } catch {
    throw new Error("FitSync could not reach its backend. Start it with `mvn spring-boot:run` and open http://localhost:8080.");
  }

  const result = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || result.detail || "The request could not be completed.");
  }
  return result;
}

function showProfile(dashboard, shouldScroll = true) {
  const profile = dashboard.profile;
  const trainingDays = Number(profile.daysPerWeek);
  const goalPlans = {
    BUILD_STRENGTH: "Build around steady strength sessions, with recovery between harder workouts.",
    IMPROVE_ENDURANCE: "Mix comfortable cardio with strength work, and increase effort gradually.",
    MOVE_MORE_OFTEN: "Spread shorter movement sessions across the week to build a routine.",
    SUPPORT_FLEXIBILITY: "Pair gentle mobility work with easy movement and regular recovery.",
    FEEL_HEALTHIER: "Keep a balanced mix of movement and recovery that fits your schedule.",
    WEIGHT_LOSS: "Use a gradual, sustainable calorie deficit and keep regular movement in your week.",
    WEIGHT_GAIN: "Pair regular strength work with steady meals and enough time to recover.",
    MAINTAIN_WEIGHT: "Keep a balanced mix of movement and recovery that fits your schedule.",
  };
  const activityTip = profile.activity === "Just getting started"
    ? "Start comfortably and add intensity only when it feels right."
    : "Adjust the pace to match your energy and recovery.";

  accountSection.hidden = false;
  accountNav.hidden = false;
  document.querySelector("[data-profile-name]").textContent = profile.name;
  document.querySelector("[data-profile-email]").textContent = profile.email;
  document.querySelector("[data-profile-age]").textContent = `${profile.age} years`;
  document.querySelector("[data-profile-goal]").textContent = profile.goalLabel;
  document.querySelector("[data-profile-activity]").textContent = profile.activity;
  document.querySelector("[data-profile-days]").textContent = `${trainingDays} days / week`;
  document.querySelector("[data-profile-created]").textContent = new Date(profile.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  document.querySelector("[data-profile-height]").textContent = `${profile.heightCm} cm`;
  document.querySelector("[data-profile-weight]").textContent = `${profile.weightKg} kg`;
  document.querySelector("[data-profile-bmi]").textContent = profile.bmi.toFixed(2);
  document.querySelector("[data-profile-bmi-category]").textContent = profile.bmiCategory;
  document.querySelector("[data-profile-plan-title]").textContent = `Your ${trainingDays}-day rhythm`;
  document.querySelector("[data-profile-plan]").textContent = `${goalPlans[profile.goal] || "Choose movement that suits your goals."} ${activityTip}`;
  document.querySelector("[data-profile-initials]").textContent = profile.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  renderCalorieDashboard(profile, dashboard.entries);
  loginTrigger.innerHTML = 'My profile <i data-lucide="user-round"></i>';
  window.lucide?.createIcons();
  if (shouldScroll) accountSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderCalorieDashboard(profile, entries) {
  const formatCalories = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
  document.querySelector("[data-calorie-date]").textContent = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  document.querySelector("[data-calorie-target]").textContent = formatCalories(profile.dailyCalorieTarget);
  document.querySelector("[data-calorie-consumed]").textContent = formatCalories(profile.caloriesConsumed);
  document.querySelector("[data-calorie-burned]").textContent = formatCalories(profile.caloriesBurned);
  document.querySelector("[data-calorie-net]").textContent = formatCalories(profile.netCalories);
  const status = document.querySelector("[data-calorie-status]");
  const balance = Math.abs(Number(profile.remainingCalories));
  status.textContent = profile.overTarget
    ? `${formatCalories(balance)} kcal over your daily target.`
    : `${formatCalories(balance)} kcal remaining in today's estimate.`;
  status.classList.toggle("is-over-target", profile.overTarget);

  const list = document.querySelector("[data-today-entries]");
  list.replaceChildren();
  document.querySelector("[data-entry-count]").textContent = `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`;
  if (entries.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-entry-list";
    empty.textContent = "No entries yet today.";
    list.append(empty);
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement("li");
    const label = document.createElement("span");
    const amount = document.createElement("strong");
    label.textContent = `${entry.type === "FOOD" ? "Food" : "Activity"}${entry.note ? ` · ${entry.note}` : ""}`;
    amount.textContent = `${entry.type === "FOOD" ? "+" : "−"}${formatCalories(entry.calories)} kcal`;
    item.append(label, amount);
    list.append(item);
  });
}

function completeSignIn(dashboard, shouldScroll = true) {
  currentProfile = dashboard.profile;
  showProfile(dashboard, shouldScroll);
}

apiRequest("/profile").then((dashboard) => {
  completeSignIn(dashboard, false);
}).catch(() => {
  currentProfile = null;
  accountSection.hidden = true;
  accountNav.hidden = true;
});

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
  primaryNav.classList.toggle("is-open", !isOpen);
  menuToggle.innerHTML = `<i data-lucide="${isOpen ? "menu" : "x"}"></i>`;
  window.lucide?.createIcons();
});

primaryNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    primaryNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    menuToggle.innerHTML = '<i data-lucide="menu"></i>';
    window.lucide?.createIcons();
  }
});

document.querySelectorAll("[data-open-login]").forEach((button) => {
  button.addEventListener("click", () => {
    if (currentProfile) {
      accountSection.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    loginDialog.showModal();
    updateBodyLock();
    loginDialog.querySelector("input").focus();
  });
});

document.querySelectorAll(".app-dialog").forEach((dialog) => {
  dialog.addEventListener("close", updateBodyLock);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
});

document.querySelector("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = loginDialog.querySelector(".dialog-message");
  try {
    const dashboard = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: form.elements.email.value.trim(), password: form.elements.password.value }),
    });
    form.reset();
    message.textContent = "";
    loginDialog.close();
    completeSignIn(dashboard);
  } catch (error) {
    message.textContent = error.message;
  }
});

document.querySelector("[data-signup]").addEventListener("click", () => {
  loginDialog.close();
  registerDialog.showModal();
  registerDialog.querySelector("#register-name").focus();
});

document.querySelector("[data-show-login]").addEventListener("click", () => {
  registerDialog.close();
  loginDialog.showModal();
  loginDialog.querySelector("#login-email").focus();
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = registerDialog.querySelector(".dialog-message");
  if (form.elements.password.value !== form.elements.confirmPassword.value) {
    message.textContent = "Your passwords do not match.";
    return;
  }

  try {
    const dashboard = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        password: form.elements.password.value,
        age: Number(form.elements.age.value),
        heightCm: Number(form.elements.heightCm.value),
        weightKg: Number(form.elements.weightKg.value),
        goal: form.elements.goal.value,
        activity: form.elements.activity.value,
        daysPerWeek: Number(form.elements.daysPerWeek.value),
      }),
    });
    form.reset();
    message.textContent = "";
    registerDialog.close();
    completeSignIn(dashboard);
  } catch (error) {
    message.textContent = error.message;
  }
});

accountNav.addEventListener("click", (event) => {
  event.preventDefault();
  primaryNav.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  accountSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelector("[data-logout]").addEventListener("click", async () => {
  try {
    await apiRequest("/auth/logout", { method: "POST" });
  } catch (error) {
    showToast(error.message);
    return;
  }
  currentProfile = null;
  accountSection.hidden = true;
  accountNav.hidden = true;
  loginTrigger.innerHTML = 'Log in <i data-lucide="arrow-up-right"></i>';
  window.lucide?.createIcons();
  document.querySelector("#home").scrollIntoView({ behavior: "smooth" });
  showToast("You have logged out.");
});

[
  [document.querySelector("#food-entry-form"), "/food-entries", "Food entry added."],
  [document.querySelector("#activity-entry-form"), "/activity-entries", "Activity entry added."],
].forEach(([form, endpoint, successMessage]) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = form.querySelector(".entry-form-message");
    try {
      const dashboard = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify({
          calories: Number(form.elements.calories.value),
          note: form.elements.note.value.trim(),
        }),
      });
      form.reset();
      message.textContent = "";
      completeSignIn(dashboard, false);
      showToast(successMessage);
    } catch (error) {
      message.textContent = error.message;
    }
  });
});

document.querySelectorAll(".workout-card").forEach((card) => {
  const openWorkout = () => {
    workoutDialog.querySelector("#workout-title").textContent = card.dataset.workout.toUpperCase();
    workoutDialog.querySelector(".workout-start-message").textContent = "";
    workoutDialog.showModal();
    updateBodyLock();
  };
  card.addEventListener("click", openWorkout);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openWorkout();
    }
  });
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `View ${card.dataset.workout} workout`);
});

document.querySelector("[data-start-workout]").addEventListener("click", () => {
  const workoutName = workoutDialog.querySelector("#workout-title").textContent;
  workoutDialog.querySelector(".workout-start-message").textContent = `${workoutName} session started. You've got this.`;
});

const chartData = {
  week: { workouts: "04", minutes: "186", streak: "03", consistency: "86%", bars: [36, 65, 45, 82, 52, 96, 60], labels: ["M", "T", "W", "T", "F", "S", "S"] },
  month: { workouts: "16", minutes: "724", streak: "04", consistency: "82%", bars: [57, 78, 44, 87, 64, 97, 70, 53, 84, 60, 91, 68], labels: ["1", "3", "5", "7", "9", "11", "13", "15", "17", "19", "21", "23"] },
};

function renderChart(period) {
  const data = chartData[period];
  for (const [name, value] of Object.entries(data)) {
    if (name !== "bars" && name !== "labels") {
      document.querySelector(`[data-stat="${name}"]`).textContent = value;
    }
  }
  const bars = document.querySelector("[data-chart-bars]");
  bars.innerHTML = data.bars.map((height, index) => `<div class="chart-column"><div class="chart-bar" style="height:${height}%"></div><span>${data.labels[index]}</span></div>`).join("");
  bars.parentElement.setAttribute("aria-label", `${period === "week" ? "Weekly" : "Monthly"} active minutes chart`);
}

document.querySelectorAll(".period-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".period-button").forEach((item) => {
      const selected = item === button;
      item.classList.toggle("is-active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    renderChart(button.dataset.period);
  });
});

renderChart("week");