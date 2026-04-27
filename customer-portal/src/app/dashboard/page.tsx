"use client";

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  CheckCircle2, IndianRupee, History, Shield, 
  Calendar, Activity, ArrowUpRight, Plus, 
  MapPin, Phone, ExternalLink, Sparkles,
  CreditCard, Search, ArrowRight, Heart,
  Zap, Star
} from 'lucide-react';
import api from '../../lib/api';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);

  useEffect(() => {
    const pt = localStorage.getItem('patientData');
    if (pt) setPatient(JSON.parse(pt));

    const fetchDashboard = async () => {
      try {
        const res = await api.get('/patients/me/dashboard');
        setData(res.data.data);
      } catch (e) {
        console.error('Failed to fetch dashboard', e);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] space-y-8">
        <div className="relative">
          <div className="w-14 h-14 border-[3px] border-slate-100 border-t-[#111827] rounded-full animate-spin"></div>
        </div>
        <p className="text-slate-400 font-semibold tracking-wide uppercase text-[10px]">Preparing your wellness space</p>
      </div>
    );
  }

  const savings = data?.savings || { total_saved: 0, services_used: 0 };
  const history = data?.history || [];

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-32 pt-8">
      
      {/* Luxurious Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-extrabold text-[#111827] tracking-tight">
            Hello, <span className="text-[#64748B] font-medium">{patient?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-[#64748B] text-lg font-medium flex items-center gap-2">
            Welcome to your premium health companion.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button className="btn-pill bg-white border border-[#F1F5F9] text-[#64748B] hover:text-[#111827] shadow-sm">
            <Phone size={18} strokeWidth={1.5} />
            Concierge
          </button>
          <button className="btn-pill btn-navy shadow-xl shadow-slate-900/10">
            <Plus size={18} strokeWidth={2.5} />
            Quick Booking
          </button>
        </div>
      </div>

      {/* Symmetrical Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="card-premium relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8">
             <div className="icon-box bg-[#F0F9FF] text-[#0EA5E9]">
                <Zap size={24} />
             </div>
          </div>
          <div className="space-y-6">
            <span className="text-label">Verified Savings</span>
            <div>
              <h3 className="text-4xl font-bold text-[#111827] tracking-tight">₹{savings.total_saved}</h3>
              <p className="text-[#10B981] text-xs font-bold mt-2 flex items-center gap-1">
                <ArrowUpRight size={14} /> +₹450 this month
              </p>
            </div>
          </div>
        </div>

        <div className="card-premium relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8">
             <div className="icon-box bg-[#FFF1F2] text-[#E11D48]">
                <Heart size={24} />
             </div>
          </div>
          <div className="space-y-6">
            <span className="text-label">Active Status</span>
            <div>
              <h3 className="text-4xl font-bold text-[#111827] tracking-tight">Verified</h3>
              <p className="text-[#64748B] text-xs font-bold mt-2 flex items-center gap-1">
                <CheckCircle2 size={14} className="text-emerald-500" /> Member since 2024
              </p>
            </div>
          </div>
        </div>

        <div className="card-premium relative overflow-hidden group bg-[#111827] text-white border-none">
          <div className="absolute top-0 right-0 p-8">
             <div className="icon-box bg-white/10 text-white">
                <Star size={24} />
             </div>
          </div>
          <div className="space-y-6 relative z-10">
            <span className="text-label text-slate-500">Current Plan</span>
            <div>
              <h3 className="text-3xl font-bold tracking-tight">{patient?.plan_name || 'Platinum Care'}</h3>
              <button className="text-[#3B82F6] text-xs font-bold mt-4 flex items-center gap-2 group">
                Upgrade Membership <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left: ID Card Section */}
        <div className="lg:col-span-5 space-y-12">
          <div className="space-y-6">
            <h2 className="text-label ml-1">Digital Membership</h2>
            
            {/* LUXURIOUS ID CARD */}
            <div className="relative group">
              <div className="relative w-full aspect-[1.58/1] bg-white rounded-[32px] p-12 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100 transition-all duration-700 group-hover:-translate-y-2">
                
                {/* Pastel Accents */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#F5F3FF] rounded-full blur-3xl opacity-60" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#FFF1F2] rounded-full blur-3xl opacity-60" />

                <div className="relative h-full flex flex-col justify-between z-10">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#111827] rounded-2xl flex items-center justify-center shadow-lg">
                        <Shield size={24} className="text-white" fill="white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xl font-extrabold tracking-tight text-[#111827]">NAMMA<span className="text-[#64748B]">HEALTH</span></span>
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">Universal Member</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Card Holder</span>
                    <h2 className="text-4xl font-bold tracking-tight text-[#111827] uppercase truncate">{patient?.name}</h2>
                  </div>

                  <div className="flex justify-between items-end border-t border-slate-50 pt-8">
                    <div className="space-y-1">
                       <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">Identity ID</span>
                       <code className="text-xl font-bold tracking-[0.1em] text-[#111827]">{patient?.cardNumber}</code>
                    </div>
                    <div className="text-right">
                       <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">Expires</span>
                       <p className="text-sm font-bold text-[#111827]">04 / 2028</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-premium p-10 flex items-center justify-between gap-10">
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-[#111827] tracking-tight">QR Verification</h4>
                <p className="text-sm text-[#64748B] leading-relaxed">Simply scan this code at any premium network hospital to instantly apply your membership benefits.</p>
              </div>
              <div className="bg-white p-4 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-slate-50 shrink-0">
                <QRCodeSVG value={patient?.cardNumber || 'N/A'} size={100} level="H" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: History & Actions */}
        <div className="lg:col-span-7 space-y-12">
          
          <div className="space-y-6">
            <h2 className="text-label ml-1">Savings Timeline</h2>
            <div className="card-premium p-4 divide-y divide-slate-50">
              {history.length > 0 ? history.map((item: any, idx: number) => (
                <div key={idx} className="p-6 flex items-center justify-between gap-6 hover:bg-[#F8FAFC] transition-all rounded-3xl border border-transparent hover:border-slate-100 group">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-50 group-hover:scale-110 transition-transform">
                      <Zap size={24} strokeWidth={1.5} className="text-[#0EA5E9]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#111827] text-lg">{item.service_category}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar size={14} className="text-slate-300" />
                        <p className="text-xs text-[#64748B] font-semibold">{new Date(item.visit_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#111827] font-extrabold text-2xl tracking-tight">−₹{item.discount_amount}</p>
                    <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">Applied</span>
                  </div>
                </div>
              )) : (
                <div className="py-24 text-center">
                   <History size={48} className="mx-auto mb-6 text-slate-200" />
                   <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No records available yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Premium Concierge Box */}
          <div className="card-premium bg-[#F5F3FF] border-none flex flex-col md:flex-row items-center gap-10 p-12 group overflow-hidden relative">
             <div className="absolute -top-12 -left-12 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
             <div className="space-y-4 flex-1 relative z-10">
               <h4 className="text-2xl font-bold text-[#7C3AED] tracking-tight">Network Explorer</h4>
               <p className="text-slate-500 text-sm leading-relaxed font-medium">Discover over 500+ elite healthcare institutions near your current location.</p>
               <div className="pt-4">
                 <button className="btn-pill bg-[#7C3AED] text-white shadow-lg shadow-purple-200 hover:bg-[#6D28D9]">
                   <Search size={18} />
                   Find Institutions
                 </button>
               </div>
             </div>
             <div className="w-48 h-48 bg-white/40 backdrop-blur-md rounded-[40px] flex items-center justify-center border border-white/20 shadow-inner group-hover:rotate-3 transition-transform">
                <MapPin size={64} className="text-[#7C3AED]" strokeWidth={1.5} />
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
