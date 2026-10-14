import { useEffect } from "react";
import { createRootRoute, useNavigate } from "@tanstack/react-router";
import AppLayout from "../components/AppLayout.jsx";

function NotFoundRedirect() {
  const navigate = useNavigate();

  useEffect(async() => {
   await navigate({ to: "/", replace: true });
  }, [navigate]);

  return null;
}

export const Route = createRootRoute({
  component: AppLayout,
  notFoundComponent: NotFoundRedirect,
});
