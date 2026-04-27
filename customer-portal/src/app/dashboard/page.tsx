"use client";

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, IndianRupee, History, Shield, Calendar, Activity } from 'lucide-react';
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
      <div className="flex justify-center items-center h-64">
        <Activity className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // Fallback if API is not yet built
  const cardData = data?.card || {
    plan_name: 'Premium Health Card',
    valid_until: '2027-04-26',
    status: 'active'
  };
  
  const benefits = data?.benefits || [
    'Unlimited Free OPD Consultations',
    '30% Discount on Diagnostics',
    '15% Discount on Pharmacy',
  ];

  const savings = data?.savings || {
    total_saved: 0,
    services_used: 0
  };

  const history = data?.history || [];

  return (
    <div className="space-y-8">
      
      {/* Top Section: Digital Card & Savings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Digital Card (Takes up 2 columns on lg) */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Your Digital Health Card</h2>
          
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 group">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 blur-3xl group-hover:bg-primary/20 transition-colors duration-500" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-primary/10 blur-2xl" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
              <div className="space-y-6 flex-1">
                <div className="flex items-center gap-3">
                  <Shield className="text-primary" size={32} />
                  <div>
                    <h3 className="font-bold text-xl tracking-wide text-white">NAMMA HEALTH</h3>
                    <p className="text-primary-300 text-xs tracking-widest uppercase font-semibold">{cardData.plan_name}</p>
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-slate-400 text-sm mb-1 uppercase tracking-wider">Patient Name</p>
                  <p className="text-2xl font-bold tracking-wide">{patient?.name}</p>
                </div>

                <div className="flex gap-8 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Card Number</p>
                    <p className="font-mono text-lg">{patient?.cardNumber}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Valid Thru</p>
                    <p className="font-mono text-lg">{cardData.valid_until ? new Date(cardData.valid_until).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-white p-4 rounded-xl shadow-inner flex flex-col items-center justify-center shrink-0">
                <QRCodeSVG value={patient?.cardNumber || 'N/A'} size={120} level="H" />
                <p className="text-slate-500 text-xs mt-2 font-medium">Scan at Reception</p>
              </div>
            </div>
          </div>
        </div>

        {/* Savings Tracker */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Total Savings</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-[calc(100%-2.5rem)] flex flex-col justify-center">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6">
              <IndianRupee size={32} />
            </div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Money Saved</p>
            <h3 className="text-5xl font-extrabold text-slate-900 mb-4">₹{savings.total_saved}</h3>
            
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <Activity size={16} className="text-primary" />
              <span>Across <strong>{savings.services_used}</strong> hospital visits</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Benefits & History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Active Benefits */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Shield size={24} className="text-primary" />
            Your Plan Benefits
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-100">
              <p className="text-sm text-slate-600">
                Show your QR code at any Namma Health partner hospital to automatically apply these benefits.
              </p>
            </div>
            <ul className="divide-y divide-slate-100">
              {benefits.map((benefit: string, idx: number) => (
                <li key={idx} className="p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                  <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={20} />
                  <span className="text-slate-700 font-medium">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Service History */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <History size={24} className="text-slate-600" />
            Recent Visits
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {history.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {history.map((item: any, idx: number) => (
                  <li key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-slate-900">{item.service_category}</div>
                      <div className="text-sm font-bold text-green-600">-₹{item.discount_amount} Saved</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(item.visit_date).toLocaleDateString()}
                      </div>
                      <div className="font-medium bg-slate-100 px-2 py-1 rounded">
                        Total: ₹{item.final_amount}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-12 text-center text-slate-500">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <History size={24} className="text-slate-400" />
                </div>
                <p>No hospital visits recorded yet.</p>
                <p className="text-sm mt-1">When you visit a hospital, your savings will appear here.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
