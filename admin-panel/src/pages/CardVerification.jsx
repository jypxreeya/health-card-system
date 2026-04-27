import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../api/axios';
import { Search, CheckCircle, XCircle, Clock, Plus } from 'lucide-react';
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
      const response = await api.get(`/cards/${searchQuery}`);
      return response.data;
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
        <h1 className="text-2xl font-bold text-gray-900">Verify Card</h1>
        <p className="text-gray-500 mt-1">Scan QR or enter card number to verify patient details.</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter Card Number (e.g., NHC-2026-01000) or Phone..."
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={!searchTerm}
          className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Verify
        </button>
      </form>

      {/* Results Section */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4">Verifying card...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-xl text-center">
          <XCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <h3 className="text-lg font-semibold">Card Not Found</h3>
          <p>Please check the card number and try again.</p>
        </div>
      )}

      {card && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Status & Patient Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className={`p-4 flex items-center justify-between text-white ${
                card.status === 'active' ? 'bg-green-500' : 
                card.status === 'expired' ? 'bg-red-500' : 'bg-yellow-500'
              }`}>
                <div className="flex items-center gap-2">
                  {card.status === 'active' ? <CheckCircle className="w-5 h-5" /> : 
                   card.status === 'expired' ? <Clock className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  <span className="font-medium uppercase tracking-wider text-sm">
                    {card.status} CARD
                  </span>
                </div>
                <span className="font-bold">{card.card_number}</span>
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{card.patient_name}</h2>
                    <p className="text-gray-500">{card.patient_phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Plan</p>
                    <p className="font-semibold text-primary">{card.plan_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Valid From</p>
                    <p className="font-medium">{format(new Date(card.valid_from), 'dd MMM yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Valid Until</p>
                    <p className="font-medium">{format(new Date(card.valid_until), 'dd MMM yyyy')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Plan Benefits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {card.benefits?.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Panel */}
          <div className="space-y-4">
            <button
              onClick={() => setShowLogModal(true)}
              disabled={card.status !== 'active'}
              className="w-full bg-secondary hover:bg-secondary-hover text-white p-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              Log Service & Discount
            </button>
            <p className="text-xs text-center text-gray-500">
              Only active cards can be used for logging services and claiming discounts.
            </p>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">Log Service</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
            <input
              required
              type="text"
              placeholder="e.g., OPD Consultation, Pharmacy, Lab Test"
              value={formData.service_type}
              onChange={(e) => setFormData({...formData, service_type: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input
              type="text"
              placeholder="e.g., Cardiology, General Medicine"
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Original Bill (₹)</label>
              <input
                required
                type="number"
                min="0"
                value={formData.original_amount}
                onChange={(e) => setFormData({...formData, original_amount: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount (₹)</label>
              <input
                required
                type="number"
                min="0"
                value={formData.discount_amount}
                onChange={(e) => setFormData({...formData, discount_amount: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-primary/10 text-primary p-4 rounded-lg flex justify-between items-center font-medium">
            <span>Final Amount to Pay:</span>
            <span className="text-xl font-bold">₹{finalAmount > 0 ? finalAmount : 0}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
            ></textarea>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Logging...' : 'Confirm & Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CardVerification;
