import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext.jsx";
import FoodJournal from "../components/FoodJournal.jsx";
import { authApi } from "../services/api.js";

export default function FoodJournalPage() {
  const { user } = useAuth();
  const accountKey = user?.id ?? user?.email ?? "current";
  const profileQuery = useQuery({
    queryKey: ["dashboard", accountKey, "profile"],
    queryFn: authApi.me,
    initialData: user,
    retry: false,
  });
  const profile = profileQuery.data ?? user;

  return (
    <main className="page-main section-wrap">
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR NUTRITION, YOUR WAY</p>
          <h1>FOOD <span>JOURNAL.</span></h1>
          <p>Log meals and drinks, review recent entries, and see your seven-day calorie history.</p>
        </div>
      </div>
      {profileQuery.error && <p className="form-message is-error" role="alert">{profileQuery.error.message}</p>}
      <FoodJournal profile={profile} />
    </main>
  );
}
