import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { UserPlus, Users, CreditCard, CheckCircle } from 'lucide-react';

const STEPS = [
  { num: 1, label: 'Primary Details', icon: UserPlus },
  { num: 2, label: 'Select Plan',     icon: CreditCard },
  { num: 3, label: 'Family Members',  icon: Users },
  { num: 4, label: 'Completion',      icon: CheckCircle },
];

const PatientRegistration = () => {
  const [step, setStep] = useState(1);
  const queryClient = useQueryClient();

  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => { const res = await api.get('/plans'); return res.data; }
  });
  const plans = plansData?.data || [];

  const [formData, setFormData] = useState({
    full_name: '', phone: '', email: '', gender: 'male',
    date_of_birth: '', address: '', plan_id: '', family_members: []
  });

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const addFamilyMember = () => setFormData({
    ...formData,
    family_members: [...formData.family_members, { name:'', relationship:'', gender:'male', date_of_birth:'' }]
  });

  const updateFamilyMember = (index, field, value) => {
    const m = [...formData.family_members];
    m[index][field] = value;
    setFormData({ ...formData, family_members: m });
  };

  const removeFamilyMember = (index) => {
    const m = [...formData.family_members];
    m.splice(index, 1);
    setFormData({ ...formData, family_members: m });
  };

  const registerMutation = useMutation({
    mutationFn: async (data) => { const res = await api.post('/patients', data); return res.data; },
    onSuccess: () => { toast.success('Patient registered and Health Card generated!'); setStep(4); queryClient.invalidateQueries(['dashboard']); },
    onError: (err) => toast.error(err.response?.data?.message || 'Registration failed')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step < 3) setStep(step + 1);
    else registerMutation.mutate(formData);
  };

  /* ── INPUT STYLE ── */
  const inp = {
    width:'100%', padding:'11px 14px', border:'1px solid #E2E8F0',
    borderRadius:'8px', fontSize:'14px', fontFamily:'Poppins,sans-serif',
    color:'#1A202C', outline:'none', backgroundColor:'white',
    boxSizing:'border-box'
  };
  const lbl = { display:'block', fontSize:'11px', fontWeight:700, color:'#A0AEC0', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'6px' };

  return (
    <div style={{ maxWidth:'860px', margin:'0 auto' }}>

      {/* ── HEADER ── */}
      <div style={{ marginBottom:'28px' }}>
        <h1 style={{ fontSize:'22px', fontWeight:800, color:'#1A202C', letterSpacing:'-0.02em' }}>Register New Patient</h1>
        <p style={{ fontSize:'13px', color:'#718096', marginTop:'4px', fontWeight:500 }}>Issue a new Namma Health Card instantly.</p>
      </div>

      {/* ── STEPPER ── */}
      <div style={{ display:'flex', alignItems:'center', marginBottom:'28px' }}>
        {STEPS.map((s, idx) => {
          const done = step > s.num, active = step === s.num;
          return (
            <React.Fragment key={s.num}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
                <div style={{
                  width:'40px', height:'40px', borderRadius:'50%',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  backgroundColor: done ? '#E8528A' : active ? '#FFF0F5' : '#F7FAFC',
                  border: active ? '2px solid #E8528A' : done ? 'none' : '2px solid #E2E8F0',
                  color: done ? 'white' : active ? '#E8528A' : '#CBD5E0',
                }}>
                  <s.icon size={18}/>
                </div>
                <span style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color: active ? '#E8528A' : done ? '#4A5568' : '#CBD5E0', textAlign:'center', width:'80px' }}>
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div style={{ flex:1, height:'2px', backgroundColor: step > s.num ? '#E8528A' : '#EDF2F7', margin:'0 8px', marginBottom:'24px' }}/>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── FORM CARD ── */}
      <form onSubmit={handleSubmit}>
        <div className="pink-card" style={{ padding:'32px' }}>

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize:'16px', fontWeight:800, color:'#1A202C', marginBottom:'24px', paddingBottom:'16px', borderBottom:'1px solid #FFF0F5' }}>Primary Patient Details</h2>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
                {[
                  { label:'Full Name *', name:'full_name', type:'text', required:true },
                  { label:'Phone Number *', name:'phone', type:'tel', required:true },
                  { label:'Email Address', name:'email', type:'email' },
                  { label:'Date of Birth', name:'date_of_birth', type:'date' },
                ].map(f => (
                  <div key={f.name}>
                    <label style={lbl}>{f.label}</label>
                    <input required={f.required} name={f.name} type={f.type} value={formData[f.name]}
                      onChange={handleInputChange} style={inp}/>
                  </div>
                ))}
                <div>
                  <label style={lbl}>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} style={inp}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style={{ gridColumn:'1 / -1' }}>
                  <label style={lbl}>Full Address</label>
                  <textarea name="address" value={formData.address} onChange={handleInputChange} rows="2"
                    style={{ ...inp, resize:'none' }}/>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize:'16px', fontWeight:800, color:'#1A202C', marginBottom:'24px', paddingBottom:'16px', borderBottom:'1px solid #FFF0F5' }}>Select Membership Plan</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'16px' }}>
                {plans.map(plan => {
                  const selected = formData.plan_id === plan.id;
                  return (
                    <div key={plan.id} onClick={() => setFormData({...formData, plan_id:plan.id})}
                      style={{
                        padding:'24px', borderRadius:'16px', cursor:'pointer', transition:'all 0.2s',
                        border: selected ? '2px solid #E8528A' : '2px solid #E2E8F0',
                        backgroundColor: selected ? '#FFF0F5' : 'white',
                        transform: selected ? 'translateY(-4px)' : 'none',
                        boxShadow: selected ? '0 8px 20px rgba(232,82,138,0.15)' : 'none'
                      }}>
                      <h3 style={{ fontWeight:800, color:'#1A202C', fontSize:'15px' }}>{plan.name}</h3>
                      <p style={{ fontSize:'26px', fontWeight:800, color:'#E8528A', margin:'8px 0 4px' }}>₹{plan.price}</p>
                      <p style={{ fontSize:'12px', color:'#A0AEC0', fontWeight:500 }}>Valid {plan.validity_months} months</p>
                      <div style={{ marginTop:'14px', display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'#4A5568', fontWeight:600 }}>
                        <CheckCircle size={14} color="#48BB78"/> Up to {plan.max_family_members} family members
                      </div>
                    </div>
                  );
                })}
              </div>
              {!formData.plan_id && <p style={{ color:'#E8528A', fontSize:'12px', fontWeight:600, marginTop:'12px' }}>Please select a plan to continue.</p>}
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px', paddingBottom:'16px', borderBottom:'1px solid #FFF0F5' }}>
                <h2 style={{ fontSize:'16px', fontWeight:800, color:'#1A202C' }}>Add Family Members</h2>
                <button type="button" onClick={addFamilyMember} className="btn-pink-outline" style={{ padding:'8px 16px', fontSize:'12px' }}>
                  + Add Member
                </button>
              </div>
              {formData.family_members.length === 0 ? (
                <div style={{ textAlign:'center', padding:'48px 0', color:'#CBD5E0' }}>
                  <Users size={40} style={{ margin:'0 auto 12px' }}/>
                  <p style={{ fontWeight:600, fontSize:'13px' }}>No family members added yet.</p>
                  <p style={{ fontSize:'12px', marginTop:'4px' }}>Click "Add Member" to include family.</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                  {formData.family_members.map((m, idx) => (
                    <div key={idx} style={{ padding:'20px', backgroundColor:'#FFF0F5', borderRadius:'12px', border:'1px solid #FFCCE0', position:'relative' }}>
                      <button type="button" onClick={() => removeFamilyMember(idx)}
                        style={{ position:'absolute', top:'14px', right:'16px', background:'none', border:'none', color:'#E8528A', fontWeight:700, fontSize:'12px', cursor:'pointer' }}>
                        Remove
                      </button>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                        {[
                          { label:'Full Name', field:'name', type:'text' },
                          { label:'Relationship', field:'relationship', type:'text', placeholder:'e.g. Spouse, Son' },
                          { label:'Date of Birth', field:'date_of_birth', type:'date' },
                        ].map(f => (
                          <div key={f.field}>
                            <label style={lbl}>{f.label}</label>
                            <input type={f.type} placeholder={f.placeholder||''} value={m[f.field]}
                              onChange={e => updateFamilyMember(idx, f.field, e.target.value)} style={inp}/>
                          </div>
                        ))}
                        <div>
                          <label style={lbl}>Gender</label>
                          <select value={m.gender} onChange={e => updateFamilyMember(idx,'gender',e.target.value)} style={inp}>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4 — SUCCESS */}
          {step === 4 && (
            <div style={{ textAlign:'center', padding:'40px 0' }}>
              <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:'linear-gradient(135deg, #E8528A, #F687B3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', boxShadow:'0 12px 32px rgba(232,82,138,0.3)' }}>
                <CheckCircle size={40} color="white"/>
              </div>
              <h2 style={{ fontSize:'26px', fontWeight:800, color:'#1A202C' }}>Registration Complete!</h2>
              <p style={{ color:'#718096', fontSize:'14px', maxWidth:'400px', margin:'12px auto 0', lineHeight:1.6 }}>
                The health card has been generated and a welcome email has been sent to the patient.
              </p>
              <button type="button" className="btn-dark" style={{ marginTop:'32px' }}
                onClick={() => { setStep(1); setFormData({ full_name:'', phone:'', email:'', gender:'male', date_of_birth:'', address:'', plan_id:'', family_members:[] }); }}>
                Register Another Patient
              </button>
            </div>
          )}

          {/* NAV BUTTONS */}
          {step < 4 && (
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:'32px', paddingTop:'20px', borderTop:'1px solid #FFF0F5' }}>
              {step > 1 ? (
                <button type="button" onClick={() => setStep(step-1)} className="btn-pink-outline">← Back</button>
              ) : <div/>}
              <button
                type="submit"
                disabled={registerMutation.isPending || (step===2 && !formData.plan_id)}
                className="btn-dark"
                style={{ opacity:(registerMutation.isPending||(step===2&&!formData.plan_id))?0.5:1 }}
              >
                {registerMutation.isPending ? 'Processing...' : step===3 ? 'Complete Registration' : 'Continue →'}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default PatientRegistration;
