import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/api.js";

const AuthContext = createContext(null);

function readUser() {
  try {
    return JSON.parse(sessionStorage.getItem("fitsync-user") || "null");
  } catch {
    sessionStorage.removeItem("fitsync-user");
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem("fitsync-token"));
  const [user, setUser] = useState(readUser);

  const logout = () => {
    sessionStorage.removeItem("fitsync-token");
    sessionStorage.removeItem("fitsync-user");
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    window.addEventListener("fitsync:unauthorized", logout);
    return () => window.removeEventListener("fitsync:unauthorized", logout);
  }, []);

  const login = async (credentials) => {
    const result = await authApi.login(credentials);
    sessionStorage.setItem("fitsync-token", result.token);
    sessionStorage.setItem("fitsync-user", JSON.stringify(result.user));
    setToken(result.token);
    setUser(result.user);
  };

  const value = useMemo(() => ({
    token,
    user,
    isAuthenticated: Boolean(token && user),
    login,
    logout,
  }), [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
