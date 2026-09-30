const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector(".primary-nav");
const loginDialog = document.querySelector("#login-dialog");
const workoutDialog = document.querySelector("#workout-dialog");
const toast = document.querySelector(".toast");

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
  document.body.classList.toggle("dialog-open", loginDialog.open || workoutDialog.open);
}

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

document.querySelector("#login-form").addEventListener("submit", (event) => {
  event.preventDefault();
  loginDialog.querySelector(".dialog-message").textContent = "You're all set. Welcome to FitSync!";
  event.currentTarget.reset();
});

document.querySelector("[data-signup]").addEventListener("click", () => {
  loginDialog.close();
  document.querySelector("#workouts").scrollIntoView({ behavior: "smooth" });
  showToast("Choose a session to get started.");
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