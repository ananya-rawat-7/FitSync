import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../auth/AuthContext.jsx";
import { authApi } from "../services/api.js";

function PasswordField({ id, name, label, autoComplete, minLength, maxLength = 72 }) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <label htmlFor={id}>{label}</label>
      <div className="password-input-wrap">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={maxLength}
          required
        />
        <button
          className="password-toggle icon-button"
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </div>
    </>
  );
}

function AuthCard({ title, eyebrow, className = "", children }) {
  return (
    <main className="auth-page section-wrap">
      <section className={`auth-card ${className}`.trim()}>
        <div className="dialog-mark"><Activity /></div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {children}
      </section>
    </main>
  );
}

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const requestedPath = location.state?.from ?? window.history.state?.from;
  const redirectTo = typeof requestedPath === "string"
    && requestedPath.startsWith("/")
    && !requestedPath.startsWith("//")
    ? requestedPath
    : "/dashboard";
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(async () => {
    if (isAuthenticated) {
      await navigate({ to: redirectTo, replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  if (isAuthenticated) return null;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      await login({ email: form.get("email"), password: form.get("password") });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSubmitting(false);
    }
  };

  return <AuthCard eyebrow="GOOD TO HAVE YOU BACK" title={<>LET'S GET<br /><span>IN SYNC.</span></>}>
    {location.state?.registered && <p className="form-message" role="status">Account created. Please log in.</p>}
    <form onSubmit={submit}>
      <label htmlFor="login-email">Email address</label><input id="login-email" name="email" type="email" autoComplete="email" maxLength="254" required />
      <PasswordField id="login-password" name="password" label="Password" autoComplete="current-password" />
      {error && <p className="form-message is-error" role="alert">{error}</p>}
      <button className="button dialog-submit" type="submit" disabled={submitting}>{submitting ? "Signing in…" : "Log in"} <ArrowUpRight /></button>
    </form>
    <p className="dialog-footnote">New to FitSync? <Link className="text-button" to="/register">Create an account</Link></p>
  </AuthCard>;
}

export function RegisterPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(async () => {
    if (isAuthenticated) {
      await navigate({ to: "/dashboard", replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return null;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    if (password !== form.get("confirmPassword")) {
      setError("The passwords do not match.");
      setSubmitting(false);
      return;
    }
    try {
      await authApi.register({
        displayName: form.get("displayName"),
        email: form.get("email"),
        password,
        weightKg: form.get("weightKg") ? Number(form.get("weightKg")) : null,
        heightCm: form.get("heightCm") ? Number(form.get("heightCm")) : null,
        age: form.get("age") ? Number(form.get("age")) : null,
        gender: form.get("gender") || null,
        fitnessGoal: form.get("fitnessGoal") || null,
      });
      navigate({ to: "/login", replace: true, state: { registered: true } });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSubmitting(false);
    }
  };

  return <AuthCard className="auth-card-register" eyebrow="A FRESH START, YOUR WAY" title={<>MAKE IT<br /><span>YOUR FIT.</span></>}>
    <form onSubmit={submit}>
      <label htmlFor="register-name">Your name</label><input id="register-name" name="displayName" autoComplete="name" maxLength="80" required />
      <label htmlFor="register-email">Email address</label><input id="register-email" name="email" type="email" autoComplete="email" maxLength="254" required />
      <PasswordField id="register-password" name="password" label="Password (at least 8 characters)" autoComplete="new-password" minLength={8} />
      <PasswordField id="register-confirm" name="confirmPassword" label="Confirm password" autoComplete="new-password" minLength={8} />
      <fieldset className="fitness-details">
        <legend>Fitness details <span>(optional)</span></legend>
        <p>You can add or update these details later from your profile.</p>
        <div className="fitness-fields">
          <label htmlFor="register-weight">Weight (kg)<input id="register-weight" name="weightKg" type="number" min="0.1" max="500" step="0.1" inputMode="decimal" /></label>
          <label htmlFor="register-height">Height (cm)<input id="register-height" name="heightCm" type="number" min="0.1" max="300" step="0.1" inputMode="decimal" /></label>
          <label htmlFor="register-age">Age<input id="register-age" name="age" type="number" min="13" max="120" step="1" inputMode="numeric" /></label>
          <label htmlFor="register-gender">Gender
            <select id="register-gender" name="gender" defaultValue="">
              <option value="">Select (optional)</option>
              <option value="FEMALE">Female</option>
              <option value="MALE">Male</option>
              <option value="NON_BINARY">Non-binary</option>
              <option value="SELF_DESCRIBED">Another identity</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </select>
          </label>
          <label className="fitness-goal-field" htmlFor="register-goal">Fitness target
            <select id="register-goal" name="fitnessGoal" defaultValue="">
              <option value="">Select a target (optional)</option>
              <option value="BUILD_STRENGTH">Build strength</option>
              <option value="LOSE_WEIGHT">Lose weight</option>
              <option value="IMPROVE_ENDURANCE">Improve endurance</option>
              <option value="IMPROVE_FLEXIBILITY">Improve flexibility</option>
              <option value="MAINTAIN_FITNESS">Maintain my fitness</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
        </div>
      </fieldset>
      {error && <p className="form-message is-error" role="alert">{error}</p>}
      <button className="button dialog-submit" type="submit" disabled={submitting}>{submitting ? "Creating account…" : "Create account"} <ArrowUpRight /></button>
    </form>
    <p className="dialog-footnote">Already have an account? <Link className="text-button" to="/login">Log in</Link></p>
  </AuthCard>;
}
