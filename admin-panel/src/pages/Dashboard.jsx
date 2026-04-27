import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Users, CreditCard, Activity, CalendarDays } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#e61d62', '#004791', '#10b981', '#f59e0b'];

const Dashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => api.get('/dashboard/stats').then(res => res.data),
  });

  if (isLoading) return <div className="p-4">Loading dashboard...</div>;

  const { stats, monthly_trend, plan_distribution, recent_activity } = data;

  const StatCard = ({ title, value, icon, color }) => (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ backgroundColor: `${color}15`, padding: '16px', borderRadius: '12px', color }}>
        {icon}
      </div>
      <div>
        <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)' }}>{value}</div>
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="page-title">Overview</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <StatCard title="Total Patients" value={stats.total_patients} icon={<Users size={24} />} color="var(--primary)" />
        <StatCard title="Active Cards" value={stats.active_cards} icon={<CreditCard size={24} />} color="var(--success)" />
        <StatCard title="Today's Registrations" value={stats.today_registrations} icon={<CalendarDays size={24} />} color="var(--secondary)" />
        <StatCard title="Services This Month" value={stats.services_this_month} icon={<Activity size={24} />} color="var(--warning)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Trend Chart */}
        <div className="card">
          <h2 className="section-title">Registration Trends (Last 6 Months)</h2>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: 'var(--surface-hover)' }} />
                <Bar dataKey="registrations" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="card">
          <h2 className="section-title">Active Plans</h2>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={plan_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {plan_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Recent Registrations</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Card Number</th>
                <th>Plan</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recent_activity.map((activity, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{activity.full_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{activity.phone}</div>
                  </td>
                  <td><span className="badge badge-info">{activity.card_number}</span></td>
                  <td>{activity.plan_name}</td>
                  <td>{new Date(activity.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {recent_activity.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center" style={{ padding: '32px' }}>No recent activity</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
