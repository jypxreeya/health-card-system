import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Shield, User, Clock, Activity, Search } from 'lucide-react';
import { format } from 'date-fns';

const getActionStyle = (action) => {
  if (action.includes('CREATE') || action.includes('REGISTER'))
    return { bg:'#F0FFF4', color:'#22863A', border:'#C6F6D5' };
  if (action.includes('UPDATE'))
    return { bg:'#EBF8FF', color:'#2B6CB0', border:'#BEE3F8' };
  if (action.includes('DELETE'))
    return { bg:'#FFF5F5', color:'#C53030', border:'#FEB2B2' };
  return { bg:'#FFF0F5', color:'#E8528A', border:'#FFCCE0' };
};

const AuditLogs = () => {
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => { const res = await api.get('/admin/audit-logs'); return res.data; }
  });

  const logs = logsData?.data || [];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>

      {/* ── HEADER ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:800, color:'#1A202C', letterSpacing:'-0.02em' }}>Audit Logs</h1>
          <p style={{ fontSize:'13px', color:'#718096', marginTop:'4px', fontWeight:500 }}>
            Track staff actions and system changes for security compliance.
          </p>
        </div>
        <div style={{ position:'relative' }}>
          <Search size={15} style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#CBD5E0' }}/>
          <input
            type="text"
            placeholder="Filter actions..."
            style={{
              paddingLeft:'36px', paddingRight:'14px', paddingTop:'10px', paddingBottom:'10px',
              border:'2px solid #FFCCE0', borderRadius:'10px', fontSize:'13px',
              fontFamily:'Poppins,sans-serif', outline:'none', backgroundColor:'white',
              color:'#1A202C', width:'220px'
            }}
          />
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="pink-card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ backgroundColor:'#FFF0F5' }}>
                {['Timestamp', 'User', 'Action', 'Entity', 'Details'].map(h => (
                  <th key={h} style={{
                    padding:'14px 20px', textAlign:'left',
                    fontSize:'10px', fontWeight:800, color:'#A0AEC0',
                    textTransform:'uppercase', letterSpacing:'0.15em',
                    borderBottom:'1px solid #FFCCE0'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} style={{ padding:'48px', textAlign:'center' }}>
                    <div style={{ width:'36px', height:'36px', border:'3px solid #FBCFE8', borderTopColor:'#E8528A', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }}></div>
                  </td>
                </tr>
              )}

              {!isLoading && logs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding:'48px', textAlign:'center', color:'#CBD5E0' }}>
                    <Shield size={40} style={{ margin:'0 auto 12px' }}/>
                    <p style={{ fontWeight:600, fontSize:'13px' }}>No audit logs found.</p>
                  </td>
                </tr>
              )}

              {!isLoading && logs.map((log) => {
                const style = getActionStyle(log.action);
                return (
                  <tr key={log.id} style={{ borderBottom:'1px solid #FFF0F5', transition:'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor='#FFF8FB'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}
                  >
                    {/* Timestamp */}
                    <td style={{ padding:'16px 20px', whiteSpace:'nowrap' }}>
                      <div style={{ fontWeight:700, color:'#1A202C', fontSize:'13px' }}>
                        {format(new Date(log.created_at), 'dd MMM yyyy')}
                      </div>
                      <div style={{ fontSize:'11px', color:'#A0AEC0', marginTop:'2px', display:'flex', alignItems:'center', gap:'4px' }}>
                        <Clock size={11}/> {format(new Date(log.created_at), 'HH:mm:ss')}
                      </div>
                    </td>

                    {/* User */}
                    <td style={{ padding:'16px 20px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'10px', backgroundColor:'#FFF0F5', display:'flex', alignItems:'center', justifyContent:'center', color:'#E8528A', flexShrink:0 }}>
                          <User size={15}/>
                        </div>
                        <div>
                          <div style={{ fontWeight:700, color:'#1A202C', fontSize:'13px' }}>{log.user_name || 'System'}</div>
                          <div style={{ fontSize:'11px', color:'#A0AEC0', textTransform:'capitalize' }}>{log.user_role?.replace('_', ' ')}</div>
                        </div>
                      </div>
                    </td>

                    {/* Action badge */}
                    <td style={{ padding:'16px 20px' }}>
                      <span style={{
                        display:'inline-block', padding:'4px 12px',
                        borderRadius:'20px', fontSize:'10px', fontWeight:800,
                        textTransform:'uppercase', letterSpacing:'0.1em',
                        backgroundColor:style.bg, color:style.color, border:`1px solid ${style.border}`
                      }}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Entity */}
                    <td style={{ padding:'16px 20px', fontSize:'13px', color:'#4A5568', fontWeight:600, textTransform:'capitalize' }}>
                      {log.entity.replace('_', ' ')}
                    </td>

                    {/* Details */}
                    <td style={{ padding:'16px 20px', maxWidth:'200px' }}>
                      <code style={{
                        display:'block', fontSize:'10px', color:'#718096',
                        backgroundColor:'#FFF0F5', padding:'6px 10px',
                        borderRadius:'8px', border:'1px solid #FFCCE0',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'
                      }}>
                        {JSON.stringify(log.details)}
                      </code>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
