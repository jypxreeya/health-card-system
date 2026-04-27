import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { CreditCard, CheckCircle, Plus, X, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const inp = {
  width:'100%', padding:'11px 14px', border:'1px solid #E2E8F0',
  borderRadius:'8px', fontSize:'14px', fontFamily:'Poppins,sans-serif',
  color:'#1A202C', outline:'none', backgroundColor:'white', boxSizing:'border-box'
};
const lbl = { display:'block', fontSize:'11px', fontWeight:700, color:'#A0AEC0', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'6px' };

const Plans = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: plansData, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => { const res = await api.get('/plans'); return res.data; }
  });

  const createPlanMutation = useMutation({
    mutationFn: (newPlan) => api.post('/plans', newPlan),
    onSuccess: () => {
      queryClient.invalidateQueries(['plans']);
      toast.success('Membership plan created successfully!');
      setIsModalOpen(false);
      reset();
    },
    onError: (err) => toast.error(err.message || 'Failed to create plan')
  });

  const onSubmit = (data) => {
    const benefitsArray = data.benefits ? data.benefits.split('\n').filter(b => b.trim() !== '') : [];
    createPlanMutation.mutate({
      ...data,
      price: parseFloat(data.price),
      validity_months: parseInt(data.validity_months),
      max_family_members: parseInt(data.max_family_members),
      benefits: benefitsArray
    });
  };

  const plans = plansData?.data || [];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>

      {/* ── HEADER ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:800, color:'#1A202C', letterSpacing:'-0.02em' }}>Membership Plans</h1>
          <p style={{ fontSize:'13px', color:'#718096', marginTop:'4px', fontWeight:500 }}>Manage active health card packages and pricing.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-dark" style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <Plus size={16}/> Create New Plan
        </button>
      </div>

      {/* ── LOADING ── */}
      {isLoading && (
        <div style={{ textAlign:'center', padding:'48px' }}>
          <div style={{ width:'36px', height:'36px', border:'3px solid #FBCFE8', borderTopColor:'#E8528A', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto' }}></div>
        </div>
      )}

      {/* ── PLANS GRID ── */}
      {!isLoading && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'20px' }}>
          {plans.map(plan => (
            <div key={plan.id} className="pink-card"
              style={{ display:'flex', flexDirection:'column', position:'relative', overflow:'hidden', padding:'28px',
                transition:'transform 0.2s, box-shadow 0.2s', cursor:'default' }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-5px)';e.currentTarget.style.boxShadow='0 14px 32px rgba(232,82,138,0.12)';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none';}}
            >
              {/* Active badge */}
              <div style={{
                position:'absolute', top:0, right:0,
                padding:'4px 12px',
                fontSize:'10px', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em',
                backgroundColor: plan.is_active ? '#48BB78' : '#FC8181',
                color:'white', borderRadius:'0 14px 0 12px'
              }}>
                {plan.is_active ? 'Active' : 'Inactive'}
              </div>

              {/* Icon + Name */}
              <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'20px' }}>
                <div style={{ width:'48px', height:'48px', backgroundColor:'#FFF0F5', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', color:'#E8528A' }}>
                  <CreditCard size={22}/>
                </div>
                <div>
                  <h3 style={{ fontSize:'16px', fontWeight:800, color:'#1A202C' }}>{plan.name}</h3>
                  <p style={{ fontSize:'11px', color:'#A0AEC0', fontWeight:600, marginTop:'2px' }}>Code: {plan.code}</p>
                </div>
              </div>

              {/* Price */}
              <div style={{ marginBottom:'16px' }}>
                <p style={{ fontSize:'36px', fontWeight:800, color:'#E8528A', letterSpacing:'-0.02em' }}>₹{plan.price}</p>
                <p style={{ fontSize:'12px', color:'#A0AEC0', fontWeight:500, marginTop:'2px' }}>Validity: {plan.validity_months} months</p>
              </div>

              {/* Description */}
              <p style={{ fontSize:'13px', color:'#718096', lineHeight:'1.6', marginBottom:'20px', flex:1 }}>
                {plan.description || 'Comprehensive health coverage for individuals and families.'}
              </p>

              {/* Benefits */}
              <div style={{ borderTop:'1px solid #FFF0F5', paddingTop:'16px', marginBottom:'20px', display:'flex', flexDirection:'column', gap:'10px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <CheckCircle size={14} color="#48BB78"/>
                  <span style={{ fontSize:'12px', color:'#4A5568', fontWeight:600 }}>Covers {plan.max_family_members} family members</span>
                </div>
                {plan.benefits?.map((b, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'8px' }}>
                    <CheckCircle size={14} color="#48BB78" style={{ flexShrink:0, marginTop:'1px' }}/>
                    <span style={{ fontSize:'12px', color:'#4A5568' }}>{b}</span>
                  </div>
                ))}
              </div>

              <button className="btn-pink-outline" style={{ width:'100%', fontSize:'12px' }}>Edit Plan</button>
            </div>
          ))}

          {plans.length === 0 && !isLoading && (
            <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'60px', color:'#CBD5E0' }}>
              <CreditCard size={48} style={{ margin:'0 auto 16px' }}/>
              <p style={{ fontWeight:700, fontSize:'14px' }}>No plans created yet.</p>
              <p style={{ fontSize:'12px', marginTop:'4px' }}>Click "Create New Plan" to get started.</p>
            </div>
          )}
        </div>
      )}

      {/* ── CREATE PLAN MODAL ── */}
      {isModalOpen && (
        <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:'16px' }}>
          <div className="pink-card" style={{ width:'100%', maxWidth:'520px', padding:0, overflow:'hidden', maxHeight:'90vh', display:'flex', flexDirection:'column' }}>
            
            {/* Modal Header */}
            <div style={{ padding:'20px 24px', borderBottom:'1px solid #FFCCE0', display:'flex', justifyContent:'space-between', alignItems:'center', backgroundColor:'#FFF0F5', flexShrink:0 }}>
              <h2 style={{ fontSize:'16px', fontWeight:800, color:'#1A202C' }}>Create New Membership Plan</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#A0AEC0', display:'flex' }}>
                <X size={20}/>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ padding:'24px', display:'flex', flexDirection:'column', gap:'16px', overflowY:'auto' }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={lbl}>Plan Name *</label>
                <input {...register('name', { required:'Name is required' })} placeholder="e.g. Platinum Family Care" style={inp}/>
                {errors.name && <p style={{ color:'#E8528A', fontSize:'11px', marginTop:'4px' }}>{errors.name.message}</p>}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                <div>
                  <label style={lbl}>Plan Code *</label>
                  <input {...register('code', { required:'Code is required' })} placeholder="e.g. PLAT01" style={inp}/>
                  {errors.code && <p style={{ color:'#E8528A', fontSize:'11px', marginTop:'4px' }}>{errors.code.message}</p>}
                </div>
                <div>
                  <label style={lbl}>Price (₹) *</label>
                  <input type="number" {...register('price', { required:'Price is required' })} placeholder="1999" style={inp}/>
                  {errors.price && <p style={{ color:'#E8528A', fontSize:'11px', marginTop:'4px' }}>{errors.price.message}</p>}
                </div>
                <div>
                  <label style={lbl}>Validity (Months)</label>
                  <input type="number" {...register('validity_months', { required:true })} placeholder="12" style={inp}/>
                </div>
                <div>
                  <label style={lbl}>Max Family Members</label>
                  <input type="number" {...register('max_family_members', { required:true })} placeholder="4" style={inp}/>
                </div>
              </div>

              <div>
                <label style={lbl}>Description</label>
                <textarea {...register('description')} rows="2" placeholder="Plan summary..." style={{ ...inp, resize:'none' }}/>
              </div>

              <div>
                <label style={lbl}>Benefits (One per line)</label>
                <textarea {...register('benefits')} rows="4" placeholder={"Free OPD\n20% off Diagnostics\nPriority Booking"} style={{ ...inp, resize:'none' }}/>
              </div>

              <div style={{ display:'flex', gap:'12px', paddingTop:'4px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-pink-outline" style={{ flex:1 }}>Cancel</button>
                <button type="submit" disabled={createPlanMutation.isPending} className="btn-dark"
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', opacity:createPlanMutation.isPending?0.6:1 }}>
                  {createPlanMutation.isPending ? <><Loader2 size={16} className="animate-spin"/> Creating...</> : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plans;
