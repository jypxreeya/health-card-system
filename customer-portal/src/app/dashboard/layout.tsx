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
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield size={20} className="text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900 hidden sm:block">Namma Health</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                <User size={16} />
                <span className="font-medium">{patient.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
