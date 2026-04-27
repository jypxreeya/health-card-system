import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../api/axios';
import { Search, CheckCircle, XCircle, Clock, Plus, User, MapPin, Phone, Mail, Activity, CalendarDays, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const CardVerification = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogModal, setShowLogModal] = useState(false);

  // Fetch card details
  const { data, isLoading, error } = useQuery({
    queryKey: ['card', searchQuery],
    queryFn: async () => {
      if (!searchQuery) return null;
      // Note: axios interceptor already returns response.data (the JSON body)
      // So `response` here is { success, data: {...card} }
      const term = searchQuery.trim();
      // Phone numbers are all digits - don't uppercase them
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
    if (searchTerm.trim()) {
      setSearchQuery(searchTerm.trim());
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verify Patient Card</h1>
        <p className="text-gray-500 mt-1">Scan QR or enter card number / phone to view complete patient profile and log services.</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter Card Number (e.g., NHC-2026-00001) or Phone Number..."
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={!searchTerm || isLoading}
          className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-primary/20"
        >
          {isLoading ? 'Searching...' : 'Search Patient'}
        </button>
      </form>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4 font-medium">Fetching patient records...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-8 rounded-xl text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold">No Records Found</h3>
          <p className="mt-2 text-red-500">We couldn't find any patient matching that card number or phone number.</p>
        </div>
      )}

      {/* Results Section */}
      {card && !isLoading && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Left Column: Patient Identity & Address */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
              <div className="h-24 bg-gradient-to-br from-slate-800 to-slate-900"></div>
              <div className="px-6 pb-6 relative">
                <div className="w-20 h-20 bg-primary text-white rounded-2xl flex items-center justify-center text-3xl font-bold border-4 border-white shadow-md absolute -top-10 left-6">
                  {card.full_name?.charAt(0)}
                </div>
                
                <div className="mt-14">
                  <h2 className="text-2xl font-bold text-gray-900">{card.full_name}</h2>
                  <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm">
                    <span className="capitalize">{card.gender || 'Not specified'}</span>
                    <span>•</span>
                    <span>{card.age ? `${card.age} years old` : 'Age unknown'}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                      <Phone size={16} className="text-slate-400" />
                    </div>
                    <span className="font-medium">{card.phone}</span>
                  </div>
                  
                  {card.email && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                        <Mail size={16} className="text-slate-400" />
                      </div>
                      <span className="font-medium">{card.email}</span>
                    </div>
                  )}

                  <div className="flex items-start gap-3 text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={16} className="text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm leading-relaxed">
                        {card.address ? card.address : <span className="text-gray-400 italic">No address provided</span>}
                      </p>
                      {(card.area || card.city) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {[card.area, card.city, card.state, card.pincode].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Family Members */}
            {card.family_members && card.family_members.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Covered Family Members</h3>
                <div className="space-y-3">
                  {card.family_members.map((member, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{member.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{member.relationship}</p>
                      </div>
                      <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
                        {member.age ? `${member.age} yrs` : '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Health Card & Actions */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* The Health Card UI */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Card Banner */}
              <div className={`p-5 flex items-center justify-between text-white ${
                card.status === 'active' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 
                card.status === 'expired' ? 'bg-gradient-to-r from-red-500 to-rose-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}>
                <div className="flex items-center gap-3">
                  {card.status === 'active' ? <CheckCircle className="w-6 h-6" /> : 
                   card.status === 'expired' ? <Clock className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                  <div>
                    <span className="font-bold uppercase tracking-widest block text-sm">
                      {card.status} MEMBERSHIP
                    </span>
                    <span className="text-white/80 text-xs">Present this card to avail benefits</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-2xl font-bold tracking-tight bg-black/20 px-3 py-1 rounded-lg">
                    {card.card_number}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Current Plan</p>
                    <p className="font-bold text-gray-900">{card.plan_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Plan Code</p>
                    <p className="font-bold text-gray-900">{card.plan_code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Valid From</p>
                    <p className="font-bold text-gray-900">{format(new Date(card.valid_from), 'MMM dd, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Valid Until</p>
                    <p className={`font-bold ${card.status === 'expired' ? 'text-red-500' : 'text-gray-900'}`}>
                      {format(new Date(card.valid_until), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>

                {/* Plan Benefits */}
                <div className="mt-8 border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-primary" /> Active Plan Benefits
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {card.benefits?.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700 font-medium">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Hospital Services</h3>
                <p className="text-sm text-gray-500 mt-1">Record a visit and apply membership discounts.</p>
              </div>
              <button
                onClick={() => setShowLogModal(true)}
                disabled={card.status !== 'active'}
                className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed shadow-sm shadow-primary/20"
              >
                <Plus className="w-5 h-5" />
                Log Service & Discount
              </button>
            </div>

            {/* Recent Services History */}
            {card.recent_services && card.recent_services.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-2">
                  <CalendarDays size={18} className="text-slate-400" />
                  <h3 className="font-bold text-gray-900">Recent Services Used</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {card.recent_services.map((service, idx) => (
                    <div key={idx} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{service.service_type}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{service.hospital_name} • {format(new Date(service.visit_date), 'dd MMM yyyy')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600 text-sm">Saved ₹{service.discount_amount}</p>
                        <p className="text-xs text-gray-400 mt-0.5 line-through">Bill: ₹{service.original_amount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Log Service Modal */}
      {showLogModal && card && (
        <LogServiceModal 
          card={card} 
          onClose={() => setShowLogModal(false)} 
        />
      )}
    </div>
  );
};

// ... existing LogServiceModal code ...
const LogServiceModal = ({ card, onClose }) => {
  const [formData, setFormData] = useState({
    service_type: '',
    department: '',
    original_amount: '',
    discount_amount: '',
    notes: ''
  });

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Log Hospital Service</h2>
            <p className="text-xs text-slate-500 mt-1">For patient: <span className="font-semibold text-slate-700">{card.full_name}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm border border-gray-100">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Service Type *</label>
              <input
                required
                type="text"
                placeholder="e.g. OPD Consultation"
                value={formData.service_type}
                onChange={(e) => setFormData({...formData, service_type: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none transition-all"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Department</label>
              <input
                type="text"
                placeholder="e.g. Cardiology"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Original Bill (₹) *</label>
              <input
                required
                type="number"
                min="0"
                placeholder="0.00"
                value={formData.original_amount}
                onChange={(e) => setFormData({...formData, original_amount: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none transition-all font-mono text-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1.5">Membership Discount (₹) *</label>
              <input
                required
                type="number"
                min="0"
                placeholder="0.00"
                value={formData.discount_amount}
                onChange={(e) => setFormData({...formData, discount_amount: e.target.value})}
                className="w-full px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all font-mono text-lg text-emerald-700"
              />
            </div>
          </div>

          <div className="bg-slate-900 text-white p-5 rounded-xl flex justify-between items-center shadow-inner">
            <span className="font-medium text-slate-300">Final Amount to Pay:</span>
            <span className="text-3xl font-bold tracking-tight">₹{finalAmount > 0 ? finalAmount : 0}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Doctor / Notes (Optional)</label>
            <textarea
              rows="2"
              placeholder="Add any specific notes or doctor name..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none transition-all resize-none"
            ></textarea>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-transform active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2 shadow-md shadow-primary/20"
            >
              {isSubmitting ? <Activity className="animate-spin" size={20} /> : <CheckCircle size={20} />}
              {isSubmitting ? 'Processing...' : 'Confirm & Log Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CardVerification;
