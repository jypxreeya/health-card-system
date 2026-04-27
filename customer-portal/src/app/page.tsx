"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Phone, CreditCard, ArrowRight, Loader2, KeyRound, CheckCircle, AlertCircle, ChevronLeft } from 'lucide-react';
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
        setSuccess(`OTP sent to your registered email address. Please check your inbox and spam folder.`);
      } else if (data.devOtp) {
        setSuccess('');
      } else {
        setSuccess('OTP generated. Check the backend server terminal for the code.');
      }
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not find a patient with that phone and card number. Please check your details.');
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
      setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-12">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
          <Shield size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-2xl leading-none">Namma Health</h1>
          <p className="text-slate-400 text-sm">Patient Portal</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1.5 bg-slate-100">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        <div className="p-8">
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 1 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>1</div>
            <div className={`h-0.5 flex-1 transition-colors ${step >= 2 ? 'bg-primary' : 'bg-slate-100'}`} />
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= 2 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>2</div>
          </div>

          {/* Error / Success alerts */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl px-4 py-3 text-sm mb-5">
              <CheckCircle size={16} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {step === 1 ? (
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Verify your identity</h2>
              <p className="text-slate-500 text-sm mb-6">Enter the details from your Namma Health Card to receive an OTP.</p>
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Registered Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="e.g. 9500012345"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Health Card Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      id="cardNumber"
                      type="text"
                      required
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      placeholder="e.g. NHC-2026-01000"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-mono uppercase"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || !phone || !cardNumber}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-primary/20 mt-2"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <><span>Send OTP</span><ArrowRight size={18} /></>}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Enter your OTP</h2>
              <p className="text-slate-500 text-sm mb-4">
                {hasEmail && !devOtp
                  ? 'A 6-digit code was sent to your registered email. It expires in 5 minutes.'
                  : 'Enter the OTP code below to sign in.'}
              </p>

              {/* DEV MODE: OTP shown directly on screen */}
              {devOtp && (
                <div className="mb-5 rounded-xl border-2 border-amber-400 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🔑</span>
                    <span className="text-amber-800 font-bold text-sm">Dev Mode — Gmail not configured</span>
                  </div>
                  <p className="text-amber-700 text-xs mb-3">Your OTP is shown here because no email provider is set up. Configure Gmail in backend/.env for production.</p>
                  <div className="flex items-center justify-between bg-white border border-amber-300 rounded-lg px-4 py-3">
                    <span className="font-mono text-3xl font-bold tracking-widest text-slate-800">{devOtp}</span>
                    <button
                      type="button"
                      onClick={handleCopyOtp}
                      className="ml-4 text-xs font-semibold text-amber-700 hover:text-amber-900 border border-amber-400 rounded-md px-3 py-1.5 transition-colors"
                    >
                      {copied ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">6-Digit OTP Code</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit code"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-2xl font-mono tracking-widest text-center"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-primary/20 mt-2"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <><span>Verify & Sign In</span><Shield size={18} /></>}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(''); setError(''); setSuccess(''); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
                >
                  <ChevronLeft size={16} /> Back to login details
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <p className="mt-6 text-slate-500 text-sm text-center">
        Forgot your card number? Visit any Namma Health partner hospital.
      </p>
    </div>
  );
}
