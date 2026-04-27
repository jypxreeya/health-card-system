"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Phone, CreditCard, ArrowRight, Loader2, KeyRound, CheckCircle, AlertCircle, ChevronLeft, Sparkles, Fingerprint } from 'lucide-react';
import api from '../lib/api';

export default function LoginPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [hasEmail, setHasEmail] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!phone.trim() || !cardNumber.trim()) {
      setError('Please enter both your Phone Number and Card Number.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/patient-login/request-otp', {
        phone: phone.trim(),
        cardNumber: cardNumber.trim().toUpperCase(),
      });
      const data = res.data.data;
      setHasEmail(data.hasEmail);
      setDevOtp(data.devOtp || null);
      if (data.emailSent) {
        setSuccess(`OTP sent to your registered email address.`);
      }
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid details. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/patient-login/verify-otp', {
        phone: phone.trim(),
        cardNumber: cardNumber.trim().toUpperCase(),
        otp: otp.trim(),
      });
      const { accessToken, user } = res.data.data;
      localStorage.setItem('patientToken', accessToken);
      localStorage.setItem('patientData', JSON.stringify(user));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOtp = () => {
    if (devOtp) {
      navigator.clipboard.writeText(devOtp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] px-4 py-12 selection:bg-rose-100">
      
      {/* Luxurious Branding */}
      <div className="flex flex-col items-center mb-16 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="w-16 h-16 rounded-[24px] bg-[#111827] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.15)] mb-8">
          <Shield size={32} fill="white" className="text-white" />
        </div>
        <h1 className="text-[#111827] font-extrabold text-4xl tracking-tight">Member Portal</h1>
        <p className="text-[#64748B] font-semibold mt-3 text-lg">Secure access to your wellness journey.</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-[480px] animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
        <div className="card-premium p-12 md:p-16 hover:scale-100 hover:translate-y-0">
          
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-[#111827] tracking-tight">{step === 1 ? 'Welcome Back' : 'Security Verification'}</h2>
            <p className="text-[#64748B] text-sm mt-3 font-medium">
              {step === 1 ? 'Authenticate with your member credentials.' : 'Please enter the secure code sent to you.'}
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-start gap-4 bg-[#FFF1F2] text-[#E11D48] rounded-[20px] p-5 text-sm mb-10 border border-rose-100/50">
              <AlertCircle size={20} className="shrink-0" />
              <span className="font-bold">{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-4 bg-emerald-50 text-emerald-700 rounded-[20px] p-5 text-sm mb-10 border border-emerald-100/50">
              <CheckCircle size={20} className="shrink-0" />
              <span className="font-bold">{success}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-10">
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-label ml-2">Registered Phone</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none group-focus-within:text-[#111827] transition-colors">
                      <Phone size={20} className="text-slate-300" strokeWidth={1.5} />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 00000 00000"
                      className="w-full pl-14 pr-6 py-5 bg-[#F8FAFC] border border-[#F1F5F9] rounded-[20px] text-sm font-bold focus:ring-[6px] focus:ring-rose-500/5 focus:border-rose-400 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-label ml-2">Membership ID</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none group-focus-within:text-[#111827] transition-colors">
                      <CreditCard size={20} className="text-slate-300" strokeWidth={1.5} />
                    </div>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      placeholder="NAMMA-0000-0000"
                      className="w-full pl-14 pr-6 py-5 bg-[#F8FAFC] border border-[#F1F5F9] rounded-[20px] text-sm font-bold font-mono focus:ring-[6px] focus:ring-rose-500/5 focus:border-rose-400 focus:bg-white outline-none transition-all uppercase tracking-widest"
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !phone || !cardNumber}
                className="w-full btn-pill btn-navy py-5 text-base shadow-[0_15px_35px_rgba(17,24,39,0.15)]"
              >
                {loading ? <Loader2 size={24} className="animate-spin" /> : (
                  <>
                    Sign In
                    <ArrowRight size={20} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-10">
              
              {/* DEV OTP BOX */}
              {devOtp && (
                <div className="bg-[#111827] rounded-[28px] p-8 text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
                    <Fingerprint size={80} />
                  </div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">
                      Environment Verification
                    </div>
                    <div className="flex items-center justify-between w-full bg-white/5 rounded-[20px] p-6 border border-white/10 backdrop-blur-sm">
                      <span className="font-mono text-4xl font-bold tracking-[0.5em] ml-2">{devOtp}</span>
                      <button
                        type="button"
                        onClick={handleCopyOtp}
                        className="p-3 hover:bg-white/10 rounded-2xl transition-all"
                      >
                        <CreditCard size={20} className={copied ? 'text-rose-400' : 'text-slate-500'} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 text-center">
                <label className="text-label">Security Code</label>
                <div className="relative group mt-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="0 0 0 0 0 0"
                    className="w-full py-6 bg-[#F8FAFC] border border-[#F1F5F9] rounded-[24px] text-5xl font-extrabold font-mono focus:ring-[8px] focus:ring-rose-500/5 focus:border-rose-400 focus:bg-white outline-none transition-all text-center tracking-[0.4em] text-[#111827]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full btn-pill btn-navy py-5 text-base shadow-[0_15px_35px_rgba(17,24,39,0.15)]"
              >
                {loading ? <Loader2 size={24} className="animate-spin" /> : (
                  <>
                    Confirm Identity
                    <Shield size={20} strokeWidth={2.5} />
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => { setStep(1); setOtp(''); setError(''); setSuccess(''); }}
                className="w-full flex items-center justify-center gap-3 py-2 text-[#64748B] hover:text-[#111827] text-xs font-black transition-all uppercase tracking-[0.2em]"
              >
                <ChevronLeft size={18} /> Re-enter details
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="mt-20 text-center opacity-40">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
          ISO 27001 Certified Platform
        </p>
      </div>

    </div>
  );
}
