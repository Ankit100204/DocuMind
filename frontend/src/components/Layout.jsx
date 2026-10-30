import { NavLink, Outlet } from 'react-router-dom';
import { BrainCircuit, Files, MessageSquare, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">
            <BrainCircuit />
          </span>
          <span>
            documind<small>DOCUMENT INTELLIGENCE</small>
          </span>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="nav">
          <NavLink to="/" end className="nav-link">
            <Files size={18} /> Documents
          </NavLink>
          <NavLink to="/chat" className="nav-link">
            <MessageSquare size={18} /> AI Assistant
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <div className="user-card">
            <div className="avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
            <div className="user-info">
              <strong>{user?.name}</strong>
              <small>{user?.email}</small>
            </div>
            <button className="icon-btn" onClick={logout} title="Sign out">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <span>
            Workspace <span className="muted">/</span> <b>Overview</b>
          </span>
          <span className="status-pill">
            <i /> AI services ready when configured
          </span>
        </header>
        <Outlet />
      </main>
    </div>
  );
}

