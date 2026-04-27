import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { CreditCard, CheckCircle, Plus, X, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const Plans = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: plansData, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const res = await api.get('/plans');
      return res.data;
    }
  });

  const createPlanMutation = useMutation({
    mutationFn: (newPlan) => api.post('/plans', newPlan),
    onSuccess: () => {
      queryClient.invalidateQueries(['plans']);
      toast.success('Membership plan created successfully!');
      setIsModalOpen(false);
      reset();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create plan');
    }
  });

  const onSubmit = (data) => {
    // Convert benefits string to array
    const benefitsArray = data.benefits ? data.benefits.split('\n').filter(b => b.trim() !== '') : [];
    createPlanMutation.mutate({
      ...data,
      price: parseFloat(data.price),
      validity_months: parseInt(data.validity_months),
      max_family_members: parseInt(data.max_family_members),
      benefits: benefitsArray
    });
  };

  const plans = plansData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membership Plans</h1>
          <p className="text-gray-500 mt-1">Manage active health card packages and pricing.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
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

      {/* Create Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Create New Membership Plan</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                  <input 
                    {...register('name', { required: 'Name is required' })}
                    placeholder="e.g. Platinum Family Care"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Code</label>
                  <input 
                    {...register('code', { required: 'Code is required' })}
                    placeholder="e.g. PLAT01"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                  {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input 
                    type="number"
                    {...register('price', { required: 'Price is required' })}
                    placeholder="1999"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Validity (Months)</label>
                  <input 
                    type="number"
                    {...register('validity_months', { required: 'Validity is required' })}
                    placeholder="12"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Family Members</label>
                  <input 
                    type="number"
                    {...register('max_family_members', { required: 'Max members is required' })}
                    placeholder="4"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  {...register('description')}
                  rows="2"
                  placeholder="Plan summary..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Benefits (One per line)</label>
                <textarea 
                  {...register('benefits')}
                  rows="3"
                  placeholder="Free OPD&#10;20% off Diagnostics&#10;Priority Booking"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                ></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={createPlanMutation.isPending}
                  className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {createPlanMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plans;
