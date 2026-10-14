import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "./AuthContext.jsx";

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const pathname = useLocation({ select: (location) => location.pathname });
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated && pathname !== "/login") {
      navigate({ to: "/login", replace: true, state: { from: pathname } });
    }
  }, [isAuthenticated, navigate, pathname]);

  return isAuthenticated ? <Outlet /> : null;
}
