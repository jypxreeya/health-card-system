import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, CreditCard, Building2, LogOut } from 'lucide-react';

const AppLayout = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Verify Card', path: '/verify-card', icon: <CreditCard size={20} /> },
    { name: 'Register Patient', path: '/register', icon: <Users size={20} /> },
    { name: 'Plans', path: '/plans', icon: <Building2 size={20} /> },
  ];

  if (['super_admin', 'admin'].includes(user?.role)) {
    navItems.push({ name: 'Hospitals', path: '/hospitals', icon: <Building2 size={20} /> });
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
          <h1 style={{ color: 'var(--primary)', fontSize: '20px', fontWeight: 900 }}>Namma Health</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Admin Operations</p>
        </div>
        <nav style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                borderRadius: '8px', color: isActive ? 'var(--primary)' : 'var(--text-main)',
                backgroundColor: isActive ? 'rgba(230, 29, 98, 0.05)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
              })}
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '24px', borderTop: '1px solid var(--border)' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>{user?.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user?.role.replace('_', ' ').toUpperCase()}</div>
          </div>
          <button onClick={logout} className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <header className="topbar">
          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
            {user?.hospital_name ? `Hospital: ${user.hospital_name}` : 'Central Administration'}
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
