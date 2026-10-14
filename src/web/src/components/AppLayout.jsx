import { useState } from "react";
import { Activity, ArrowUpRight, Menu, X } from "lucide-react";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../auth/AuthContext.jsx";

export default function AppLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const closeMenu = () => setMenuOpen(false);
  const endSession = async () => {
    logout();
    await navigate({ to: "/login", replace: true });
  };

  return (
    <>
      <header className="site-header">
        <Link className="brand" to="/" aria-label="FitSync home" onClick={closeMenu}>
          <span className="brand-mark"><Activity /></span>
          <span>FIT<span>SYNC</span></span>
        </Link>
        <button className="menu-toggle icon-button" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X /> : <Menu />}
        </button>
        <nav className={`primary-nav${menuOpen ? " is-open" : ""}`} aria-label="Main navigation">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "active", "aria-current": "page" }} onClick={closeMenu}>Home</Link>
          {isAuthenticated ? (
            <>
             <Link to="/dashboard" activeProps={{ className: "active", "aria-current": "page" }} onClick={closeMenu}>Progress</Link>
              <Link to="/workouts" activeProps={{ className: "active", "aria-current": "page" }} onClick={closeMenu}>Workouts</Link>
              <Link to="/food-journal" activeProps={{ className: "active", "aria-current": "page" }} onClick={closeMenu}>Food journal</Link>
              <Link to="/profile" activeProps={{ className: "active", "aria-current": "page" }} onClick={closeMenu}>Profile</Link>
            </>
          ) : (
            <>
              <Link to="/#workouts" onClick={closeMenu}>Workouts</Link>
              <Link to="/#progress" onClick={closeMenu}>Progress</Link>
              <Link to="/#nutrition" onClick={closeMenu}>Nutrition</Link>
              <Link to="/#about" onClick={closeMenu}>About</Link>
            </>
          )}
        </nav>
        {isAuthenticated ? (
          <div className="header-account">
            <span className="header-greeting">Hi, {user?.displayName}</span>
            <button className="button button-small button-outline" type="button" onClick={endSession}>Log out</button>
          </div>
        ) : (
          <Link className="login-trigger button button-small" to="/login">Log in <ArrowUpRight /></Link>
        )}
      </header>
      <Outlet />
      <footer className="site-footer">
        <div className="footer-main section-wrap">
          <div className="footer-brand"><Link className="brand" to="/"><span className="brand-mark"><Activity /></span><span>FIT<span>SYNC</span></span></Link><p>A straightforward way to plan, track and understand your fitness.</p></div>
          <div className="footer-column"><h2>PRODUCT</h2><Link to="/workouts">Workouts</Link><Link to="/dashboard">Progress</Link>{isAuthenticated ? <Link to="/food-journal">Food journal</Link> : <Link to="/#nutrition">Nutrition</Link>}</div>
          <div className="footer-column"><h2>ACCOUNT</h2>{isAuthenticated ? <><Link to="/profile">Profile</Link><Link to="/dashboard">Dashboard</Link></> : <><Link to="/login">Log in</Link><Link to="/register">Create account</Link></>}</div>
          <div className="footer-column"><h2>FITNESS</h2><Link to="/#about">About FitSync</Link><Link to="/#how-it-works">How it works</Link></div>
        </div>
        <div className="footer-bottom section-wrap"><span>© 2026 FitSync. All rights reserved.</span><span>MADE TO MOVE WITH YOU <Activity /></span></div>
      </footer>
    </>
  );
}
