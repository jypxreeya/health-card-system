import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { CreditCard, CheckCircle, Plus } from 'lucide-react';

const Plans = () => {
  const { data: plansData, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const res = await api.get('/plans');
      return res.data;
    }
  });

  const plans = plansData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membership Plans</h1>
          <p className="text-gray-500 mt-1">Manage active health card packages and pricing.</p>
        </div>
        <button className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors">
          <Plus className="w-5 h-5" />
          Create New Plan
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden">
              {/* Active Badge */}
              <div className={`absolute top-0 right-0 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white ${plan.is_active ? 'bg-green-500' : 'bg-red-500'}`}>
                {plan.is_active ? 'Active' : 'Inactive'}
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-500">Code: {plan.code}</p>
                </div>
              </div>

              <div className="my-4">
                <p className="text-4xl font-bold text-gray-900">₹{plan.price}</p>
                <p className="text-sm text-gray-500 mt-1">Validity: {plan.validity_months} months</p>
              </div>

              <p className="text-gray-600 mb-6 text-sm flex-grow">
                {plan.description || "Comprehensive health coverage for individuals and families."}
              </p>

              <div className="border-t border-gray-100 pt-4 mb-6 space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">Covers {plan.max_family_members} family members</span>
                </div>
                {plan.benefits?.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    <span className="text-sm text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <button className="w-full mt-auto py-2 border border-gray-200 rounded-lg text-gray-600 font-medium hover:bg-gray-50 transition-colors">
                Edit Plan
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Plans;
