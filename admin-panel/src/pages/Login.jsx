import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

const inp = {
  width:'100%', padding:'12px 14px 12px 42px',
  border:'1px solid #E2E8F0', borderRadius:'10px',
  fontSize:'14px', fontFamily:'Poppins,sans-serif',
  color:'#1A202C', outline:'none', backgroundColor:'#F7FAFC',
  boxSizing:'border-box', transition:'border-color 0.2s, background 0.2s'
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Logged in successfully');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      backgroundColor:'#F7FAFC', fontFamily:'Poppins,sans-serif', padding:'16px'
    }}>
      <div style={{ width:'100%', maxWidth:'440px' }}>

        {/* ── BRAND ── */}
        <div style={{ textAlign:'center', marginBottom:'36px' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
            <div style={{
              width:'32px', height:'32px', backgroundColor:'#9B2C2C',
              borderRadius:'8px', display:'flex', alignItems:'center',
              justifyContent:'center', color:'white', fontWeight:900, fontSize:'20px'
            }}>+</div>
            <span style={{ fontSize:'22px', fontWeight:800, color:'#E8528A' }}>Namma Health Card</span>
          </div>
          <p style={{ color:'#A0AEC0', fontSize:'13px', fontWeight:500 }}>Staff & Administrator Sign In</p>
        </div>

        {/* ── CARD ── */}
        <div style={{
          backgroundColor:'white', borderRadius:'20px',
          border:'2px solid #FFCCE0', padding:'40px',
          boxShadow:'0 8px 32px rgba(232,82,138,0.06)'
        }}>
          <h2 style={{ fontSize:'18px', fontWeight:800, color:'#1A202C', marginBottom:'4px' }}>Welcome back</h2>
          <p style={{ color:'#A0AEC0', fontSize:'13px', fontWeight:500, marginBottom:'28px' }}>
            Enter your credentials to access the panel
          </p>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'18px' }}>

            {/* Email */}
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:'#A0AEC0', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'8px' }}>
                Email Address
              </label>
              <div style={{ position:'relative' }}>
                <Mail size={16} style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', color:'#CBD5E0' }}/>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="admin@nammahealth.com"
                  style={inp}
                  onFocus={e => { e.target.style.borderColor='#F687B3'; e.target.style.backgroundColor='white'; }}
                  onBlur={e => { e.target.style.borderColor='#E2E8F0'; e.target.style.backgroundColor='#F7FAFC'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:'#A0AEC0', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'8px' }}>
                Password
              </label>
              <div style={{ position:'relative' }}>
                <Lock size={16} style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', color:'#CBD5E0' }}/>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={inp}
                  onFocus={e => { e.target.style.borderColor='#F687B3'; e.target.style.backgroundColor='white'; }}
                  onBlur={e => { e.target.style.borderColor='#E2E8F0'; e.target.style.backgroundColor='#F7FAFC'; }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width:'100%', padding:'14px',
                backgroundColor:loading ? '#718096' : '#4A5568',
                color:'white', border:'none', borderRadius:'12px',
                fontSize:'14px', fontWeight:700, fontFamily:'Poppins,sans-serif',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
                cursor:loading ? 'not-allowed' : 'pointer',
                transition:'background 0.2s, transform 0.1s',
                marginTop:'8px'
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor='#2D3748'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor='#4A5568'; }}
            >
              {loading
                ? <><Loader2 size={18} style={{ animation:'spin 0.8s linear infinite' }}/> Signing in...</>
                : <> Sign In <ArrowRight size={18}/></>
              }
            </button>
          </form>
        </div>

        {/* ── HINT ── */}
        <p style={{ textAlign:'center', color:'#CBD5E0', fontSize:'12px', marginTop:'20px', fontWeight:500 }}>
          Credentials in{' '}
          <code style={{ backgroundColor:'#FFF0F5', color:'#E8528A', padding:'2px 6px', borderRadius:'4px', border:'1px solid #FFCCE0' }}>
            credentials.md
          </code>
        </p>
      </div>
    </div>
  );
};

export default Login;
