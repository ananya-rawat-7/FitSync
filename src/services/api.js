const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api").replace(/\/$/, "");

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

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError("The FitSync server is unavailable. Check that the backend is running.");
  }

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
  return response.json();
}

const json = (method, body) => ({ method, body: JSON.stringify(body) });

export const authApi = {
  register: (details) => request("/auth/register", json("POST", details)),
  login: (credentials) => request("/auth/login", json("POST", credentials)),
  me: () => request("/auth/me"),
};

export const workoutApi = {
  list: () => request("/workouts"),
  create: (workout) => request("/workouts", json("POST", workout)),
  update: (id, workout) => request(`/workouts/${id}`, json("PUT", workout)),
  remove: (id) => request(`/workouts/${id}`, { method: "DELETE" }),
};
