import { createFileRoute } from "@tanstack/react-router";
import { RegisterPage } from "../pages/AuthPages.jsx";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});
