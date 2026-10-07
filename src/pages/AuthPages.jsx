import { useState } from "react";
import { Activity, ArrowUpRight } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { authApi } from "../services/api.js";

function AuthCard({ title, eyebrow, children }) {
  return (
    <main className="auth-page section-wrap">
      <section className="auth-card">
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
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      await login({ email: form.get("email"), password: form.get("password") });
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
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
      <label htmlFor="login-password">Password</label><input id="login-password" name="password" type="password" autoComplete="current-password" maxLength="72" required />
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
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

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
      });
      navigate("/login", { replace: true, state: { registered: true } });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSubmitting(false);
    }
  };

  return <AuthCard eyebrow="A FRESH START, YOUR WAY" title={<>MAKE IT<br /><span>YOUR FIT.</span></>}>
    <form onSubmit={submit}>
      <label htmlFor="register-name">Your name</label><input id="register-name" name="displayName" autoComplete="name" maxLength="80" required />
      <label htmlFor="register-email">Email address</label><input id="register-email" name="email" type="email" autoComplete="email" maxLength="254" required />
      <label htmlFor="register-password">Password (at least 8 characters)</label><input id="register-password" name="password" type="password" autoComplete="new-password" minLength="8" maxLength="72" required />
      <label htmlFor="register-confirm">Confirm password</label><input id="register-confirm" name="confirmPassword" type="password" autoComplete="new-password" minLength="8" maxLength="72" required />
      {error && <p className="form-message is-error" role="alert">{error}</p>}
      <button className="button dialog-submit" type="submit" disabled={submitting}>{submitting ? "Creating account…" : "Create account"} <ArrowUpRight /></button>
    </form>
    <p className="dialog-footnote">Already have an account? <Link className="text-button" to="/login">Log in</Link></p>
  </AuthCard>;
}
