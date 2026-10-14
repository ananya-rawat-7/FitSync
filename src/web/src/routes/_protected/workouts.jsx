import { createFileRoute } from "@tanstack/react-router";
import WorkoutsPage from "../../pages/WorkoutsPage.jsx";

export const Route = createFileRoute("/_protected/workouts")({
  validateSearch: (search) => ({
    name: typeof search.name === "string" ? search.name : undefined,
  }),
  component: WorkoutsPage,
});
