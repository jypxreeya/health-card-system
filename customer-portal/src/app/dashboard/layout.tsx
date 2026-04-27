"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, LogOut, User } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [patient, setPatient] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const data = localStorage.getItem('patientData');
    if (!data) {
      router.push('/');
    } else {
      setPatient(JSON.parse(data));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('patientToken');
    localStorage.removeItem('patientData');
    router.push('/');
  };

  if (!patient) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Navigation */}
      <nav className="glass sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Shield size={24} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl text-slate-900 leading-none tracking-tight italic">NAMMA<span className="text-primary">HEALTH</span></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Universal Care</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-3 text-sm text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
                <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-primary">
                  <User size={14} />
                </div>
                <span className="font-bold">{patient.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="group flex items-center gap-2 text-slate-400 hover:text-red-600 font-bold text-sm transition-all px-4 py-2 rounded-xl hover:bg-red-50"
              >
                <span className="hidden sm:inline">Sign Out</span>
                <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {children}
      </main>
    </div>
  );
}
