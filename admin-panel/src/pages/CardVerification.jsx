import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { Search, CheckCircle, XCircle, Clock, Plus, User, MapPin, Phone, Mail, Activity, CalendarDays, ShieldAlert, BadgeCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const CardVerification = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogModal, setShowLogModal] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['card', searchQuery],
    queryFn: async () => {
      if (!searchQuery) return null;
      const term = searchQuery.trim();
      const searchParam = /^\d+$/.test(term) ? term : term.toUpperCase();
      const response = await api.get(`/cards/${encodeURIComponent(searchParam)}`);
      return response;
    },
    enabled: !!searchQuery,
    retry: false
  });

  const card = data?.data;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) setSearchQuery(searchTerm.trim());
  };

  /* ── status color helper ── */
  const statusStyle = (status) => {
    if (status === 'active')   return { bg:'#F0FFF4', color:'#22863A', border:'#C6F6D5' };
    if (status === 'expired')  return { bg:'#FFF5F5', color:'#E53E3E', border:'#FEB2B2' };
    return                            { bg:'#FFFBEB', color:'#D97706', border:'#FDE68A' };
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>

      {/* ── HEADER ── */}
      <div>
        <h1 style={{ fontSize:'22px', fontWeight:800, color:'#1A202C', letterSpacing:'-0.02em' }}>Card Verification</h1>
        <p style={{ fontSize:'13px', color:'#718096', marginTop:'4px', fontWeight:500 }}>
          Search by card number or phone number to view patient profile and log services.
        </p>
      </div>

      {/* ── SEARCH BAR ── */}
      <form onSubmit={handleSearch}>
        <div className="pink-card" style={{ padding:'20px', display:'flex', gap:'12px', alignItems:'center' }}>
          <div style={{ flex:1, position:'relative' }}>
            <Search size={16} style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', color:'#CBD5E0' }}/>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Enter Card Number (NHC-2026-XXXXX) or Phone Number..."
              className="form-input"
              style={{ paddingLeft:'42px' }}
            />
          </div>
          <button
            type="submit"
            disabled={!searchTerm || isLoading}
            className="btn-dark"
            style={{ whiteSpace:'nowrap', opacity:(!searchTerm || isLoading) ? 0.5 : 1 }}
          >
            {isLoading ? 'Searching...' : 'Search Patient'}
          </button>
        </div>
      </form>

      {/* ── LOADING ── */}
      {isLoading && (
        <div className="pink-card" style={{ padding:'60px', textAlign:'center' }}>
          <div style={{ width:'36px', height:'36px', border:'3px solid #FBCFE8', borderTopColor:'#E8528A', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }}></div>
          <p style={{ color:'#A0AEC0', fontWeight:600, fontSize:'13px' }}>Fetching patient records...</p>
        </div>
      )}

      {/* ── ERROR ── */}
      {error && !isLoading && (
        <div className="pink-card" style={{ padding:'48px', textAlign:'center' }}>
          <XCircle size={48} style={{ margin:'0 auto 16px', color:'#FEB2B2' }}/>
          <h3 style={{ fontWeight:800, color:'#1A202C', fontSize:'16px' }}>No Records Found</h3>
          <p style={{ color:'#A0AEC0', fontSize:'13px', marginTop:'6px' }}>
            No patient matching that card number or phone number.
          </p>
        </div>
      )}

      {/* ── RESULTS ── */}
      {card && !isLoading && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:'20px' }}>

          {/* ── LEFT: Profile ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

            {/* Profile Card */}
            <div className="pink-card" style={{ overflow:'hidden' }}>
              <div style={{ height:'80px', background:'linear-gradient(135deg, #E8528A, #F687B3)' }}></div>
              <div style={{ padding:'0 24px 24px', position:'relative' }}>
                <div style={{
                  width:'64px', height:'64px', borderRadius:'16px',
                  background:'linear-gradient(135deg, #9B2C2C, #E8528A)',
                  color:'white', fontWeight:800, fontSize:'26px',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  border:'4px solid white', position:'absolute', top:'-32px', left:'20px',
                  boxShadow:'0 4px 12px rgba(232,82,138,0.3)'
                }}>
                  {card.full_name?.charAt(0)}
                </div>
                <div style={{ marginTop:'40px' }}>
                  <h2 style={{ fontSize:'18px', fontWeight:800, color:'#1A202C' }}>{card.full_name}</h2>
                  <p style={{ fontSize:'12px', color:'#A0AEC0', marginTop:'2px', fontWeight:500, textTransform:'capitalize' }}>
                    {card.gender || 'N/A'} • {card.age ? `${card.age} yrs` : 'Age unknown'}
                  </p>
                </div>

                <div style={{ marginTop:'20px', display:'flex', flexDirection:'column', gap:'12px' }}>
                  {[
                    { icon:<Phone size={14}/>, val:card.phone },
                    card.email && { icon:<Mail size={14}/>, val:card.email },
                    { icon:<MapPin size={14}/>, val:[card.address, card.area, card.city, card.state, card.pincode].filter(Boolean).join(', ') || 'No address' },
                  ].filter(Boolean).map((item, i) => (
                    <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                      <div style={{ width:'28px', height:'28px', borderRadius:'8px', backgroundColor:'#FFF0F5', display:'flex', alignItems:'center', justifyContent:'center', color:'#E8528A', flexShrink:0 }}>
                        {item.icon}
                      </div>
                      <span style={{ fontSize:'13px', color:'#4A5568', fontWeight:500, lineHeight:'1.5' }}>{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Family Members */}
            {card.family_members?.length > 0 && (
              <div className="pink-card" style={{ padding:'20px' }}>
                <h3 style={{ fontSize:'11px', fontWeight:800, color:'#A0AEC0', textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:'14px' }}>Covered Members</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {card.family_members.map((m, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:i < card.family_members.length-1 ? '1px solid #FFF0F5' : 'none' }}>
                      <div>
                        <p style={{ fontWeight:700, color:'#1A202C', fontSize:'13px' }}>{m.name}</p>
                        <p style={{ fontSize:'11px', color:'#A0AEC0', textTransform:'capitalize' }}>{m.relationship}</p>
                      </div>
                      <span style={{ fontSize:'11px', fontWeight:700, backgroundColor:'#FFF0F5', color:'#E8528A', padding:'3px 10px', borderRadius:'20px', border:'1px solid #FFCCE0' }}>
                        {m.age ? `${m.age} yrs` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Card Details ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

            {/* Status Banner */}
            <div className="pink-card" style={{ overflow:'hidden', padding:0 }}>
              <div style={{
                padding:'16px 24px', display:'flex', justifyContent:'space-between', alignItems:'center',
                background: card.status==='active' ? 'linear-gradient(135deg, #E8528A, #F687B3)' :
                            card.status==='expired' ? 'linear-gradient(135deg, #E53E3E, #FC8181)' :
                                                      'linear-gradient(135deg, #D97706, #FBBF24)',
                color:'white'
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  {card.status==='active' ? <CheckCircle size={22}/> : card.status==='expired' ? <Clock size={22}/> : <ShieldAlert size={22}/>}
                  <div>
                    <div style={{ fontWeight:800, fontSize:'13px', textTransform:'uppercase', letterSpacing:'0.1em' }}>
                      {card.status} Membership
                    </div>
                    <div style={{ fontSize:'11px', opacity:0.85 }}>Present this card to avail benefits</div>
                  </div>
                </div>
                <span style={{ fontFamily:'monospace', fontSize:'16px', fontWeight:800, backgroundColor:'rgba(0,0,0,0.15)', padding:'6px 14px', borderRadius:'10px' }}>
                  {card.card_number}
                </span>
              </div>

              <div style={{ padding:'24px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'20px' }}>
                  {[
                    { label:'Plan', val:card.plan_name },
                    { label:'Plan Code', val:card.plan_code },
                    { label:'Valid From', val:format(new Date(card.valid_from), 'MMM dd, yyyy') },
                    { label:'Valid Until', val:format(new Date(card.valid_until), 'MMM dd, yyyy') },
                  ].map((item,i) => (
                    <div key={i}>
                      <p style={{ fontSize:'10px', fontWeight:700, color:'#A0AEC0', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'4px' }}>{item.label}</p>
                      <p style={{ fontWeight:700, color:item.label==='Valid Until'&&card.status==='expired' ? '#E53E3E' : '#1A202C', fontSize:'13px' }}>{item.val}</p>
                    </div>
                  ))}
                </div>

                {/* Benefits */}
                {card.benefits?.length > 0 && (
                  <div style={{ marginTop:'24px', borderTop:'1px solid #FFF0F5', paddingTop:'20px' }}>
                    <h3 style={{ fontSize:'11px', fontWeight:800, color:'#A0AEC0', textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:'12px', display:'flex', alignItems:'center', gap:'6px' }}>
                      <Activity size={14} color="#E8528A"/> Plan Benefits
                    </h3>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'8px' }}>
                      {card.benefits.map((b, i) => (
                        <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'8px', padding:'10px 12px', backgroundColor:'#FFF0F5', borderRadius:'10px', border:'1px solid #FFCCE0' }}>
                          <CheckCircle size={14} style={{ color:'#E8528A', flexShrink:0, marginTop:'1px' }}/>
                          <span style={{ fontSize:'12px', color:'#4A5568', fontWeight:600 }}>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Log Service Action */}
            <div className="pink-card" style={{ padding:'20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <h3 style={{ fontWeight:700, color:'#1A202C', fontSize:'15px' }}>Log Hospital Service</h3>
                <p style={{ fontSize:'12px', color:'#A0AEC0', marginTop:'3px' }}>Record a visit and apply membership discounts.</p>
              </div>
              <button
                onClick={() => setShowLogModal(true)}
                disabled={card.status !== 'active'}
                className="btn-dark"
                style={{ display:'flex', alignItems:'center', gap:'8px', opacity:card.status!=='active'?0.4:1 }}
              >
                <Plus size={16}/> Log Service & Discount
              </button>
            </div>

            {/* Recent Services */}
            {card.recent_services?.length > 0 && (
              <div className="pink-card" style={{ overflow:'hidden', padding:0 }}>
                <div style={{ padding:'16px 20px', borderBottom:'1px solid #FFCCE0', display:'flex', alignItems:'center', gap:'8px' }}>
                  <CalendarDays size={16} color="#E8528A"/>
                  <h3 style={{ fontWeight:700, color:'#1A202C', fontSize:'14px' }}>Recent Services Used</h3>
                </div>
                {card.recent_services.map((svc, i) => (
                  <div key={i} style={{ padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:i<card.recent_services.length-1?'1px solid #FFF0F5':'none' }}>
                    <div>
                      <p style={{ fontWeight:700, color:'#1A202C', fontSize:'13px' }}>{svc.service_type}</p>
                      <p style={{ fontSize:'11px', color:'#A0AEC0', marginTop:'2px' }}>{svc.hospital_name} • {format(new Date(svc.visit_date), 'dd MMM yyyy')}</p>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <p style={{ fontWeight:800, color:'#48BB78', fontSize:'14px' }}>Saved ₹{svc.discount_amount}</p>
                      <p style={{ fontSize:'11px', color:'#CBD5E0', textDecoration:'line-through' }}>₹{svc.original_amount}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LOG SERVICE MODAL ── */}
      {showLogModal && card && (
        <LogServiceModal card={card} onClose={() => setShowLogModal(false)} />
      )}
    </div>
  );
};

/* ── LOG SERVICE MODAL ── */
const LogServiceModal = ({ card, onClose }) => {
  const [formData, setFormData] = useState({ service_type:'', department:'', original_amount:'', discount_amount:'', notes:'' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/services', {
        card_number: card.card_number,
        service_type: formData.service_type,
        department: formData.department,
        original_amount: Number(formData.original_amount),
        discount_amount: Number(formData.discount_amount),
        notes: formData.notes
      });
      toast.success('Service logged successfully!');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to log service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const finalAmount = Number(formData.original_amount || 0) - Number(formData.discount_amount || 0);

  return (
    <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:'16px' }}>
      <div className="pink-card" style={{ width:'100%', maxWidth:'520px', padding:0, overflow:'hidden' }}>
        
        {/* Modal Header */}
        <div style={{ padding:'20px 24px', borderBottom:'1px solid #FFCCE0', display:'flex', justifyContent:'space-between', alignItems:'center', backgroundColor:'#FFF0F5' }}>
          <div>
            <h2 style={{ fontSize:'16px', fontWeight:800, color:'#1A202C' }}>Log Hospital Service</h2>
            <p style={{ fontSize:'12px', color:'#A0AEC0', marginTop:'2px' }}>Patient: <strong style={{color:'#E8528A'}}>{card.full_name}</strong></p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#A0AEC0' }}>
            <XCircle size={22}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:'24px', display:'flex', flexDirection:'column', gap:'16px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
            <div>
              <label className="form-label">Service Type *</label>
              <input required type="text" placeholder="e.g. OPD Consultation" className="form-input"
                value={formData.service_type} onChange={e=>setFormData({...formData,service_type:e.target.value})}/>
            </div>
            <div>
              <label className="form-label">Department</label>
              <input type="text" placeholder="e.g. Cardiology" className="form-input"
                value={formData.department} onChange={e=>setFormData({...formData,department:e.target.value})}/>
            </div>
            <div>
              <label className="form-label">Original Bill (₹) *</label>
              <input required type="number" min="0" placeholder="0.00" className="form-input"
                style={{ fontFamily:'monospace', fontSize:'16px', fontWeight:700 }}
                value={formData.original_amount} onChange={e=>setFormData({...formData,original_amount:e.target.value})}/>
            </div>
            <div>
              <label className="form-label" style={{color:'#48BB78'}}>Discount Amount (₹) *</label>
              <input required type="number" min="0" placeholder="0.00" className="form-input"
                style={{ fontFamily:'monospace', fontSize:'16px', fontWeight:700, borderColor:'#C6F6D5', backgroundColor:'#F0FFF4', color:'#22863A' }}
                value={formData.discount_amount} onChange={e=>setFormData({...formData,discount_amount:e.target.value})}/>
            </div>
          </div>

          {/* Final Amount Display */}
          <div style={{ backgroundColor:'#1A202C', borderRadius:'12px', padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ color:'#A0AEC0', fontWeight:600, fontSize:'13px' }}>Final Amount Payable:</span>
            <span style={{ color:'white', fontWeight:800, fontSize:'26px', letterSpacing:'-0.02em' }}>₹{finalAmount > 0 ? finalAmount : 0}</span>
          </div>

          <div>
            <label className="form-label">Notes (Optional)</label>
            <textarea rows="2" placeholder="Doctor name or any notes..." className="form-input"
              style={{ resize:'none' }}
              value={formData.notes} onChange={e=>setFormData({...formData,notes:e.target.value})}/>
          </div>

          <div style={{ display:'flex', gap:'12px', paddingTop:'4px' }}>
            <button type="button" onClick={onClose} className="btn-pink-outline" style={{ flex:1 }}>Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-dark"
              style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', opacity:isSubmitting?0.6:1 }}>
              {isSubmitting ? <Activity size={16} className="animate-spin"/> : <CheckCircle size={16}/>}
              {isSubmitting ? 'Processing...' : 'Confirm & Log Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CardVerification;
