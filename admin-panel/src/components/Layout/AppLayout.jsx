import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutGrid, Building2, UserCircle2, Briefcase, 
  Bell, Plus, BarChart2
} from 'lucide-react';

const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const topLinks = [
    { name: 'Patient Portal', path: '/patients' },
    { name: 'Sales App', path: '/sales-dummy' },
    { name: 'Hospital Panel', path: '/' },
  ];

  const sideLinks = [
    { name: 'Dashboard', path: '/analytics', icon: <BarChart2 size={17} /> },
    { name: 'Hospital Panel', path: '/', icon: <LayoutGrid size={17} /> },
    { name: 'Patient Portal', path: '/patients', icon: <UserCircle2 size={17} /> },
    { name: 'Sales App', path: '/sales-dummy', icon: <Briefcase size={17} /> },
  ];

  if (['super_admin', 'admin'].includes(user?.role)) {
    sideLinks.splice(2, 0, { name: 'Hospitals', path: '/hospitals', icon: <Building2 size={17} /> });
  }

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-shell">

      {/* ── TOP NAV ── */}
      <header className="topnav">
        <div className="topnav-brand">
          <div className="topnav-cross">+</div>
          <span className="topnav-title">Namma Health Card</span>
        </div>

        <nav className="topnav-links">
          {topLinks.map(link => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) => `topnav-link${isActive ? ' active' : ''}`}
            >
              {link.name}
            </NavLink>
          ))}
        </nav>

        <div className="topnav-right">
          <button className="topnav-icon-btn">
            <Bell size={18} />
          </button>
          <button className="topnav-avatar" onClick={handleLogout} title="Click to logout">
            {user?.name?.charAt(0) || 'A'}
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="app-body">

        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-title">Namma Health</div>
            <div className="sidebar-sub">Medical Management</div>
          </div>

          <nav className="sidebar-nav">
            {sideLinks.map(link => (
              <NavLink
                key={link.name}
                to={link.path}
                end={link.path === '/'}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              >
                {link.icon}
                {link.name}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <button className="sidebar-add-btn" onClick={() => navigate('/register')}>
              <Plus size={16} />
              Add New Record
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
