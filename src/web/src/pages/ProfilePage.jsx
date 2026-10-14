import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext.jsx";
import { emptyFitnessProfile, fitnessGoalLabels, genderLabels } from "../constants/profile.js";
import { ApiError, authApi } from "../services/api.js";

function getProfileError(queryError, mutationError) {
  if (queryError) return queryError.message;
  if (!mutationError) return "";
  if (mutationError instanceof ApiError) return mutationError.message;
  return "Could not save your fitness details. Please try again.";
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [fitnessProfile, setFitnessProfile] = useState(emptyFitnessProfile);
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const accountKey = user?.id ?? user?.email ?? "current";
  const profileQueryKey = ["dashboard", accountKey, "profile"];
  const profileQuery = useQuery({
    queryKey: profileQueryKey,
    queryFn: authApi.me,
    initialData: user,
    retry: false,
  });
  const profile = profileQuery.data ?? user;
  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileQueryKey, updatedProfile);
      setMessage("Your fitness details have been saved.");
    },
  });
  const loadingProfile = profileQuery.isFetching;
  const error = getProfileError(profileQuery.error, updateProfileMutation.error);

  useEffect(() => {
    if (!profile) return;
    setFitnessProfile({
      weightKg: profile.weightKg ?? "",
      heightCm: profile.heightCm ?? "",
      age: profile.age ?? "",
      gender: profile.gender ?? "",
      fitnessGoal: profile.fitnessGoal ?? "",
    });
  }, [profile]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setFitnessProfile((current) => ({ ...current, [name]: value }));
    setMessage("");
    updateProfileMutation.reset();
  };

  const saveProfile = (event) => {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const numericValue = (key) => form.get(key) ? Number(form.get(key)) : null;
    updateProfileMutation.mutate({
      weightKg: numericValue("weightKg"),
      heightCm: numericValue("heightCm"),
      age: numericValue("age"),
      gender: form.get("gender") || null,
      fitnessGoal: form.get("fitnessGoal") || null,
    });
  };

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
      <section className="dashboard fitness-profile-card">
        <div className="fitness-profile-heading">
          <span className="dashboard-overline">PERSONAL FITNESS</span>
          <h2>Your details and target</h2>
          <p>These details are optional and help keep your fitness profile up to date.</p>
        </div>
        <form className="fitness-profile-form" onSubmit={saveProfile}>
          <label htmlFor="profile-weight">Weight (kg)
            <input id="profile-weight" name="weightKg" type="number" min="0.1" max="500" step="0.1" inputMode="decimal" value={fitnessProfile.weightKg} onChange={updateField} disabled={loadingProfile} />
          </label>
          <label htmlFor="profile-height">Height (cm)
            <input id="profile-height" name="heightCm" type="number" min="0.1" max="300" step="0.1" inputMode="decimal" value={fitnessProfile.heightCm} onChange={updateField} disabled={loadingProfile} />
          </label>
          <label htmlFor="profile-age">Age
            <input id="profile-age" name="age" type="number" min="13" max="120" step="1" inputMode="numeric" value={fitnessProfile.age} onChange={updateField} disabled={loadingProfile} />
          </label>
          <label htmlFor="profile-gender">Gender
            <select id="profile-gender" name="gender" value={fitnessProfile.gender} onChange={updateField} disabled={loadingProfile}>
              <option value="">Not specified</option>
              {Object.entries(genderLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="fitness-goal-field" htmlFor="profile-goal">Fitness target
            <select id="profile-goal" name="fitnessGoal" value={fitnessProfile.fitnessGoal} onChange={updateField} disabled={loadingProfile}>
              <option value="">Not specified</option>
              {Object.entries(fitnessGoalLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          {error && <p className="form-message is-error" role="alert">{error}</p>}
          {message && <p className="form-message" role="status">{message}</p>}
          <button className="button fitness-profile-submit" type="submit" disabled={updateProfileMutation.isPending || loadingProfile}>{updateProfileMutation.isPending ? "Saving…" : "Save fitness details"}</button>
        </form>
      </section>
    </main>
  );
}
