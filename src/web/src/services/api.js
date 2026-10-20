const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api").replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, options = {}) {
  const token = sessionStorage.getItem("fitsync-token");
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, signal: controller.signal });

    if (response.status === 401) {
      sessionStorage.removeItem("fitsync-token");
      sessionStorage.removeItem("fitsync-user");
      window.dispatchEvent(new Event("fitsync:unauthorized"));
    }

    if (!response.ok) {
      let message = "Something went wrong. Please try again.";
      try {
        const body = await response.json();
        if (typeof body.message === "string") message = body.message;
        else if (typeof body.detail === "string") message = body.detail;
      } catch {
        if (response.status >= 500) message = "The server could not complete that request.";
      }
      throw new ApiError(message, response.status);
    }

    if (response.status === 204) return null;
    return await response.json();
  } catch (failure) {
    if (failure instanceof ApiError) throw failure;
    if (failure instanceof DOMException && failure.name === "AbortError") {
      throw new ApiError("The FitSync server did not respond in time. Please try again.");
    }
    if (failure instanceof SyntaxError) {
      throw new ApiError("The FitSync server returned an invalid response. Please try again.");
    }
    throw new ApiError("The FitSync server is unavailable. Check that the backend is running.");
  } finally {
    window.clearTimeout(timeoutId);
  }
}

const json = (method, body) => ({ method, body: JSON.stringify(body) });

export const authApi = {
  register: (details) => request("/auth/register", json("POST", details)),
  login: (credentials) => request("/auth/login", json("POST", credentials)),
  me: () => request("/auth/me"),
  updateProfile: (details) => request("/auth/me", json("PUT", details)),
};

export const workoutApi = {
  list: () => request("/workouts"),
  create: (workout) => request("/workouts", json("POST", workout)),
  update: (id, workout) => request(`/workouts/${id}`, json("PUT", workout)),
  remove: (id) => request(`/workouts/${id}`, { method: "DELETE" }),
};

export const workoutPlanApi = {
  list: () => request("/workout-plans"),
  create: (plan) => request("/workout-plans", json("POST", plan)),
  update: (id, plan) => request(`/workout-plans/${id}`, json("PUT", plan)),
  complete: (id) => request(`/workout-plans/${id}/complete`, { method: "POST" }),
  generateWeek: (startDate) => request("/workout-plans/generate-week", json("POST", startDate ? { startDate } : {})),
  reorder: (date, planIds) => request("/workout-plans/reorder", json("PUT", { date, planIds })),
  remove: (id) => request(`/workout-plans/${id}`, { method: "DELETE" }),
};

export const exerciseApi = {
  list: (goal) => request(`/exercises${goal ? `?goal=${encodeURIComponent(goal)}` : ""}`),
  createCustom: (exercise) => request("/exercises", json("POST", exercise)),
};

export const calorieApi = {
  list: () => request("/calories"),
  create: (entry) => request("/calories", json("POST", entry)),
  remove: (id) => request(`/calories/${id}`, { method: "DELETE" }),
};
