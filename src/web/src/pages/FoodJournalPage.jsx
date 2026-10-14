import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import FoodJournal from "../components/FoodJournal.jsx";
import { authApi } from "../services/api.js";

export default function FoodJournalPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(user);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    let active = true;
    authApi.me()
      .then((currentProfile) => {
        if (active) setProfile(currentProfile);
      })
      .catch((failure) => {
        if (active) setProfileError(failure.message);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="page-main section-wrap">
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR NUTRITION, YOUR WAY</p>
          <h1>FOOD <span>JOURNAL.</span></h1>
          <p>Log meals and drinks, review recent entries, and see your seven-day calorie history.</p>
        </div>
      </div>
      {profileError && <p className="form-message is-error" role="alert">{profileError}</p>}
      <FoodJournal profile={profile} />
    </main>
  );
}
