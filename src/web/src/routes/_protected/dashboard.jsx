import { createFileRoute } from "@tanstack/react-router";
import DashboardPage from "../../pages/DashboardPage.jsx";

export const Route = createFileRoute("/_protected/dashboard")({
  component: DashboardPage,
});
