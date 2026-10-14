import { createFileRoute } from "@tanstack/react-router";
import ProfilePage from "../../pages/ProfilePage.jsx";

export const Route = createFileRoute("/_protected/profile")({
  component: ProfilePage,
});
