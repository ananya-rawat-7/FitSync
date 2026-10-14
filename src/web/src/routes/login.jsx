import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "../pages/AuthPages.jsx";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});
