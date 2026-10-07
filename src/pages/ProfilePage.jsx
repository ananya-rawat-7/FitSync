import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { authApi } from "../services/api.js";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(user);
  const [error, setError] = useState("");

  useEffect(() => {
    authApi.me().then(setProfile).catch((failure) => setError(failure.message));
  }, []);

  return (
    <main className="page-main section-wrap">
      <div className="page-heading"><div><p className="eyebrow">YOUR FITSYNC ACCOUNT</p><h1>YOUR <span>PROFILE.</span></h1><p>Account details associated with your personal workout log.</p></div></div>
      {error && <p className="form-message is-error" role="alert">{error}</p>}
      <section className="dashboard profile-card">
        <div className="profile-avatar">{(profile?.displayName || "F").charAt(0).toUpperCase()}</div>
        <div><span className="dashboard-overline">DISPLAY NAME</span><h2>{profile?.displayName || "Loading…"}</h2></div>
        <div><span className="dashboard-overline">EMAIL ADDRESS</span><p>{profile?.email || ""}</p></div>
        <p className="profile-note">Your workouts are private to this account. Your password is never returned by the API.</p>
      </section>
    </main>
  );
}
