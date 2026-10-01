const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector(".primary-nav");
const loginDialog = document.querySelector("#login-dialog");
const registerDialog = document.querySelector("#register-dialog");
const workoutDialog = document.querySelector("#workout-dialog");
const accountSection = document.querySelector("#account");
const accountNav = document.querySelector("[data-account-nav]");
const loginTrigger = document.querySelector("[data-open-login]");
const toast = document.querySelector(".toast");
const usersStorageKey = "fitsync-users";
const sessionStorageKey = "fitsync-session";

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

function getUsers() {
  try {
    const users = JSON.parse(window.localStorage.getItem(usersStorageKey) || "[]");
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

async function hashPassword(password, existingSalt) {
  if (!window.crypto?.subtle) {
    throw new Error("Secure password storage is unavailable in this browser. Open FitSync on localhost and try again.");
  }

  const salt = existingSalt
    ? Uint8Array.from(existingSalt.match(/.{2}/g), (byte) => Number.parseInt(byte, 16))
    : window.crypto.getRandomValues(new Uint8Array(16));
  const key = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await window.crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" }, key, 256);
  const hex = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return { salt: hex(salt), hash: hex(new Uint8Array(bits)) };
}

function showProfile(user, shouldScroll = true) {
  accountSection.hidden = false;
  accountNav.hidden = false;
  document.querySelector("[data-profile-name]").textContent = user.name;
  document.querySelector("[data-profile-email]").textContent = user.email;
  document.querySelector("[data-profile-goal]").textContent = user.goal;
  document.querySelector("[data-profile-activity]").textContent = user.activity;
  document.querySelector("[data-profile-created]").textContent = new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  document.querySelector("[data-profile-initials]").textContent = user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  loginTrigger.innerHTML = 'My profile <i data-lucide="user-round"></i>';
  window.lucide?.createIcons();
  if (shouldScroll) accountSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function completeSignIn(user) {
  currentUser = user;
  window.sessionStorage.setItem(sessionStorageKey, user.email);
  showProfile(user);
}

const activeUserEmail = window.sessionStorage.getItem(sessionStorageKey);
let currentUser = getUsers().find((user) => user.email === activeUserEmail);
if (currentUser) showProfile(currentUser, false);
else window.sessionStorage.removeItem(sessionStorageKey);

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
    if (currentUser) {
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
  const email = form.elements.email.value.trim().toLowerCase();
  const user = getUsers().find((account) => account.email === email);
  if (!user) {
    message.textContent = "No account found for that email. Register to get started.";
    return;
  }
  try {
    const credentials = await hashPassword(form.elements.password.value, user.salt);
    if (credentials.hash !== user.passwordHash) {
      message.textContent = "That email and password do not match.";
      return;
    }
    form.reset();
    message.textContent = "";
    loginDialog.close();
    completeSignIn(user);
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

document.querySelector("#register-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = registerDialog.querySelector(".dialog-message");
  const email = form.elements.email.value.trim().toLowerCase();
  if (form.elements.password.value !== form.elements.confirmPassword.value) {
    message.textContent = "Your passwords do not match.";
    return;
  }

  const users = getUsers();
  if (users.some((user) => user.email === email)) {
    message.textContent = "An account with that email already exists. Log in instead.";
    return;
  }

  try {
    const credentials = await hashPassword(form.elements.password.value);
    const user = {
      name: form.elements.name.value.trim(),
      email,
      goal: form.elements.goal.value,
      activity: form.elements.activity.value,
      createdAt: new Date().toISOString(),
      salt: credentials.salt,
      passwordHash: credentials.hash,
    };
    users.push(user);
    window.localStorage.setItem(usersStorageKey, JSON.stringify(users));
    form.reset();
    message.textContent = "";
    registerDialog.close();
    completeSignIn(user);
  } catch (error) {
    message.textContent = error.name === "QuotaExceededError"
      ? "Browser storage is full. Clear some space and try again."
      : error.message;
  }
});

accountNav.addEventListener("click", (event) => {
  event.preventDefault();
  primaryNav.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  accountSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelector("[data-logout]").addEventListener("click", () => {
  currentUser = null;
  window.sessionStorage.removeItem(sessionStorageKey);
  accountSection.hidden = true;
  accountNav.hidden = true;
  loginTrigger.innerHTML = 'Log in <i data-lucide="arrow-up-right"></i>';
  window.lucide?.createIcons();
  document.querySelector("#home").scrollIntoView({ behavior: "smooth" });
  showToast("You have logged out.");
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