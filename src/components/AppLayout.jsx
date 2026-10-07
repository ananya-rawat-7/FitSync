import { useState } from "react";
import { Activity, ArrowUpRight, Menu, X } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function AppLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const closeMenu = () => setMenuOpen(false);
  const endSession = () => {
    logout();
    navigate("/login", { replace: true });
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
          <NavLink to="/" onClick={closeMenu}>Home</NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/workouts" onClick={closeMenu}>Workouts</NavLink>
              <NavLink to="/dashboard" onClick={closeMenu}>Progress</NavLink>
              <NavLink to="/profile" onClick={closeMenu}>Profile</NavLink>
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
          <div className="footer-column"><h2>PRODUCT</h2><Link to="/workouts">Workouts</Link><Link to="/dashboard">Progress</Link><Link to="/#nutrition">Nutrition</Link></div>
          <div className="footer-column"><h2>ACCOUNT</h2>{isAuthenticated ? <><Link to="/profile">Profile</Link><Link to="/dashboard">Dashboard</Link></> : <><Link to="/login">Log in</Link><Link to="/register">Create account</Link></>}</div>
          <div className="footer-column"><h2>FITNESS</h2><Link to="/#about">About FitSync</Link><Link to="/#how-it-works">How it works</Link></div>
        </div>
        <div className="footer-bottom section-wrap"><span>© 2026 FitSync. All rights reserved.</span><span>MADE TO MOVE WITH YOU <Activity /></span></div>
      </footer>
    </>
  );
}
