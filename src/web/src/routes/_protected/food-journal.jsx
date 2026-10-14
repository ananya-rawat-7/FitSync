import { createFileRoute } from "@tanstack/react-router";
import FoodJournalPage from "../../pages/FoodJournalPage.jsx";

export const Route = createFileRoute("/_protected/food-journal")({
  component: FoodJournalPage,
});
