import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Users, CreditCard, Activity, CalendarDays, TrendingUp, ShieldCheck } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

/* Pink palette matching Stitch reference image */
const PINK_COLORS = ['#F687B3', '#E8528A', '#FBCFE8', '#9B2C2C'];

const Dashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => api.get('/dashboard/stats').then(res => res.data),
  });

  if (isLoading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:'16px' }}>
      <div style={{ width:'40px', height:'40px', border:'3px solid #FBCFE8', borderTopColor:'#E8528A', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}></div>
      <p style={{ color:'#A0AEC0', fontWeight:600, fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.15em' }}>Loading Analytics</p>
    </div>
  );

  const { stats, monthly_trend, plan_distribution, recent_activity } = data;

  const StatCard = ({ title, value, icon, color, bgColor, trend }) => (
    <div className="pink-card" style={{ padding:'24px', transition:'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 12px 28px rgba(232,82,138,0.1)';}}
      onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none';}}
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
        <div style={{ backgroundColor:bgColor, padding:'12px', borderRadius:'12px', color, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {icon}
        </div>
        {trend && (
          <span style={{ fontSize:'11px', fontWeight:700, color:'#48BB78', backgroundColor:'#F0FFF4', padding:'4px 10px', borderRadius:'20px', border:'1px solid #C6F6D5' }}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p style={{ fontSize:'10px', fontWeight:700, color:'#A0AEC0', textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:'6px' }}>{title}</p>
        <p style={{ fontSize:'32px', fontWeight:800, color:'#1A202C', letterSpacing:'-0.02em' }}>{value}</p>
      </div>
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'28px' }}>

      {/* ── HEADER ── */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:800, color:'#1A202C', letterSpacing:'-0.02em' }}>Network Analytics</h1>
          <p style={{ fontSize:'13px', color:'#718096', marginTop:'4px', fontWeight:500 }}>Consolidated health network performance metrics.</p>
        </div>
        <button className="btn-dark">Export Report</button>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'20px' }}>
        <StatCard title="Total Registrations" value={stats.total_patients} icon={<Users size={22}/>} color="#E8528A" bgColor="#FFF0F5" trend="+14.2%" />
        <StatCard title="Active Cards" value={stats.active_cards} icon={<ShieldCheck size={22}/>} color="#48BB78" bgColor="#F0FFF4" />
        <StatCard title="Today's New" value={stats.today_registrations} icon={<TrendingUp size={22}/>} color="#667EEA" bgColor="#EBF4FF" trend="+24" />
        <StatCard title="Services This Month" value={stats.services_this_month} icon={<Activity size={22}/>} color="#ED8936" bgColor="#FFFBEB" />
      </div>

      {/* ── CHARTS ROW ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1.8fr 1.2fr', gap:'20px' }}>

        {/* Enrollment Trend */}
        <div className="pink-card" style={{ padding:'28px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
            <h2 style={{ fontSize:'15px', fontWeight:700, color:'#E8528A', display:'flex', alignItems:'center', gap:'8px' }}>
              <TrendingUp size={18}/> Enrollment Trend
            </h2>
            <div style={{ display:'flex', gap:'8px' }}>
              <span style={{ fontSize:'11px', fontWeight:700, backgroundColor:'#1A202C', color:'white', padding:'4px 12px', borderRadius:'12px' }}>Monthly</span>
              <span style={{ fontSize:'11px', fontWeight:600, color:'#A0AEC0', padding:'4px 12px' }}>Quarterly</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthly_trend} margin={{ top:4, right:4, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#FFF0F5" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill:'#A0AEC0', fontSize:11, fontWeight:700, fontFamily:'Poppins' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill:'#A0AEC0', fontSize:11, fontWeight:700, fontFamily:'Poppins' }} />
              <RechartsTooltip cursor={{ fill:'#FFF0F5' }}
                contentStyle={{ borderRadius:'12px', border:'2px solid #FFCCE0', boxShadow:'0 8px 24px rgba(232,82,138,0.12)', fontSize:'12px', fontWeight:700, padding:'12px' }}
              />
              <Bar dataKey="registrations" radius={[8,8,0,0]} barSize={36}>
                {monthly_trend.map((entry, i) => {
                  const max = Math.max(...monthly_trend.map(d=>d.registrations));
                  const ratio = entry.registrations / max;
                  const fill = ratio > 0.8 ? '#E8528A' : ratio > 0.5 ? '#F687B3' : ratio > 0.3 ? '#FBCFE8' : '#FFE4EE';
                  return <Cell key={i} fill={fill}/>;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Distribution */}
        <div className="pink-card" style={{ padding:'28px', background:'#1A202C', border:'none' }}>
          <h2 style={{ fontSize:'15px', fontWeight:700, color:'#F687B3', display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
            <CreditCard size={18}/> Plan Portfolio
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={plan_distribution} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="count">
                {plan_distribution.map((_, i) => <Cell key={i} fill={PINK_COLORS[i % PINK_COLORS.length]} stroke="none"/>)}
              </Pie>
              <RechartsTooltip contentStyle={{ borderRadius:'12px', border:'none', boxShadow:'0 8px 24px rgba(0,0,0,0.3)', backgroundColor:'#2D3748', color:'white', fontSize:'12px', fontWeight:700 }}/>
              <Legend verticalAlign="bottom" height={36} formatter={v=><span style={{ fontSize:'10px', fontWeight:700, color:'#718096', textTransform:'uppercase', letterSpacing:'0.1em' }}>{v}</span>}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── RECENT ENROLLMENTS ── */}
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
          <h2 style={{ fontSize:'15px', fontWeight:700, color:'#1A202C', display:'flex', alignItems:'center', gap:'8px' }}>
            <Users size={18} color="#E8528A"/> Recent Enrollments
          </h2>
          <span style={{ fontSize:'11px', fontWeight:700, color:'#E8528A', textTransform:'uppercase', letterSpacing:'0.1em', cursor:'pointer' }}>View All</span>
        </div>
        <div className="pink-card" style={{ overflow:'hidden', padding:0 }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ backgroundColor:'#FFF0F5' }}>
                {['Patient', 'Card Number', 'Plan', 'Enrolled On'].map(h=>(
                  <th key={h} style={{ padding:'14px 20px', textAlign:'left', fontSize:'10px', fontWeight:800, color:'#A0AEC0', textTransform:'uppercase', letterSpacing:'0.15em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent_activity.map((row, i) => (
                <tr key={i} style={{ borderTop:'1px solid #FFF0F5' }}>
                  <td style={{ padding:'16px 20px' }}>
                    <div style={{ fontWeight:700, color:'#1A202C', fontSize:'14px' }}>{row.full_name}</div>
                    <div style={{ fontSize:'11px', color:'#A0AEC0', fontWeight:600, marginTop:'2px' }}>{row.phone}</div>
                  </td>
                  <td style={{ padding:'16px 20px' }}>
                    <span style={{ fontFamily:'monospace', fontSize:'12px', fontWeight:700, color:'#1A202C', backgroundColor:'#FFF0F5', padding:'4px 10px', borderRadius:'8px', border:'1px solid #FFCCE0' }}>
                      {row.card_number}
                    </span>
                  </td>
                  <td style={{ padding:'16px 20px', fontWeight:700, color:'#E8528A', fontSize:'13px' }}>{row.plan_name}</td>
                  <td style={{ padding:'16px 20px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', color:'#A0AEC0', fontSize:'12px', fontWeight:600 }}>
                      <CalendarDays size={13}/>
                      {new Date(row.created_at).toLocaleDateString('en-US',{day:'2-digit',month:'short',year:'numeric'})}
                    </div>
                  </td>
                </tr>
              ))}
              {recent_activity.length === 0 && (
                <tr><td colSpan={4} style={{ padding:'48px', textAlign:'center', color:'#CBD5E0', fontSize:'12px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em' }}>No recent records</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
