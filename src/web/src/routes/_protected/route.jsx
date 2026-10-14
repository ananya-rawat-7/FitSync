import { createFileRoute } from "@tanstack/react-router";
import ProtectedRoute from "../../auth/ProtectedRoute.jsx";

export const Route = createFileRoute("/_protected")({
  component: ProtectedRoute,
});
