import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Components
import AppLayout from './components/Layout/AppLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CardVerification from './pages/CardVerification';
import PatientRegistration from './pages/PatientRegistration';
import Plans from './pages/Plans';
import AuditLogs from './pages/AuditLogs';
import PatientPortal from './pages/PatientPortal';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="verify-card" element={<CardVerification />} />
        <Route path="register" element={<PatientRegistration />} />
        <Route path="plans" element={<Plans />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="patients" element={<PatientPortal />} />
      </Route>
    </Routes>
  );
}

export default App;
