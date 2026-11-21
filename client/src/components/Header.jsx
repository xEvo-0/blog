import { BookOpen, PenLine } from "lucide-react";
import { Link } from "react-router-dom";

export default function Header({ isAuthenticated, onLogout }) {
  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="Inkwell home">
        <span className="brand-mark"><BookOpen size={19} strokeWidth={1.8} /></span>
        <span>inkwell<span className="brand-period">.</span></span>
      </Link>
      <nav className="header-nav" aria-label="Main navigation">
        <Link to="/" className="nav-link">Stories</Link>
        {isAuthenticated ? (
          <>
            <Link to="/write" className="button button-dark button-small">
              <PenLine size={15} /> Write a story
            </Link>
            <button type="button" className="button button-outline button-small" onClick={onLogout}>Sign out</button>
          </>
        ) : (
          <>
            <Link to="/register" className="nav-link register-link">Register</Link>
            <Link to="/login" className="button button-dark button-small">Sign in</Link>
          </>
        )}
      </nav>
    </header>
  );
}
