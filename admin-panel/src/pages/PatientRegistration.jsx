import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { UserPlus, Users, CreditCard, CheckCircle } from 'lucide-react';

const PatientRegistration = () => {
  const [step, setStep] = useState(1);
  const queryClient = useQueryClient();

  // Fetch active plans
  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const res = await api.get('/plans');
      return res.data;
    }
  });
  const plans = plansData?.data || [];

  const [formData, setFormData] = useState({
    // Patient Details
    full_name: '',
    phone: '',
    email: '',
    gender: 'male',
    date_of_birth: '',
    address: '',
    
    // Plan Details
    plan_id: '',
    
    // Family Members (Dynamic)
    family_members: []
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addFamilyMember = () => {
    setFormData({
      ...formData,
      family_members: [
        ...formData.family_members,
        { name: '', relationship: '', gender: 'male', date_of_birth: '' }
      ]
    });
  };

  const updateFamilyMember = (index, field, value) => {
    const newMembers = [...formData.family_members];
    newMembers[index][field] = value;
    setFormData({ ...formData, family_members: newMembers });
  };

  const removeFamilyMember = (index) => {
    const newMembers = [...formData.family_members];
    newMembers.splice(index, 1);
    setFormData({ ...formData, family_members: newMembers });
  };

  const registerMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/patients', data);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Patient registered and Health Card generated!');
      setStep(4);
      queryClient.invalidateQueries(['dashboard']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      registerMutation.mutate(formData);
    }
  };

  const selectedPlan = plans.find(p => p.id === formData.plan_id);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Register New Patient</h1>
        <p className="text-gray-500 mt-1">Issue a new Namma Health Card instantly.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {[
          { num: 1, label: 'Primary Details', icon: UserPlus },
          { num: 2, label: 'Select Plan', icon: CreditCard },
          { num: 3, label: 'Family Members', icon: Users },
          { num: 4, label: 'Completion', icon: CheckCircle },
        ].map((s, idx) => (
          <div key={idx} className={`flex flex-col items-center w-1/4 ${step >= s.num ? 'text-primary' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
              step > s.num ? 'bg-primary text-white' : 
              step === s.num ? 'border-2 border-primary bg-primary/10 text-primary' : 
              'bg-gray-100'
            }`}>
              <s.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium uppercase tracking-wider text-center">{s.label}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold border-b pb-4">Primary Patient Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input required name="full_name" value={formData.full_name} onChange={handleInputChange} type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input required name="phone" value={formData.phone} onChange={handleInputChange} type="tel" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input name="email" value={formData.email} onChange={handleInputChange} type="email" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange} type="date" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                <textarea name="address" value={formData.address} onChange={handleInputChange} rows="2" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"></textarea>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold border-b pb-4">Select Membership Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div 
                  key={plan.id}
                  onClick={() => setFormData({ ...formData, plan_id: plan.id })}
                  className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                    formData.plan_id === plan.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'
                  }`}
                >
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="text-2xl font-bold text-primary mt-2">₹{plan.price}</p>
                  <p className="text-sm text-gray-500 mt-1">Valid for {plan.validity_months} months</p>
                  <ul className="mt-4 space-y-2">
                    <li className="text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Up to {plan.max_family_members} family members
                    </li>
                  </ul>
                </div>
              ))}
            </div>
            {!formData.plan_id && <p className="text-red-500 text-sm">Please select a plan to continue.</p>}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-xl font-bold">Add Family Members</h2>
              <button type="button" onClick={addFamilyMember} className="text-primary font-medium flex items-center gap-1 hover:bg-primary/10 px-3 py-1 rounded-lg">
                <UserPlus className="w-4 h-4" /> Add Member
              </button>
            </div>
            
            {formData.family_members.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No family members added. Click 'Add Member' to include family.</p>
            ) : (
              <div className="space-y-6">
                {formData.family_members.map((member, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100 relative">
                    <button type="button" onClick={() => removeFamilyMember(idx)} className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-sm font-medium">Remove</button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Full Name</label>
                        <input required value={member.name} onChange={(e) => updateFamilyMember(idx, 'name', e.target.value)} type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Relationship</label>
                        <input required value={member.relationship} onChange={(e) => updateFamilyMember(idx, 'relationship', e.target.value)} placeholder="e.g. Spouse, Son, Mother" type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Gender</label>
                        <select value={member.gender} onChange={(e) => updateFamilyMember(idx, 'gender', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none">
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Date of Birth</label>
                        <input value={member.date_of_birth} onChange={(e) => updateFamilyMember(idx, 'date_of_birth', e.target.value)} type="date" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-12 space-y-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Registration Complete!</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              The health card has been successfully generated. The PDF and welcome email have been sent to the patient.
            </p>
            <div className="pt-8">
              <button type="button" onClick={() => { setStep(1); setFormData({ full_name: '', phone: '', email: '', gender: 'male', date_of_birth: '', address: '', plan_id: '', family_members: [] }); }} className="bg-primary text-white px-8 py-3 rounded-xl font-medium hover:bg-primary-hover">
                Register Another Patient
              </button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 4 && (
          <div className="flex justify-between mt-8 pt-6 border-t">
            {step > 1 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="px-6 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium">
                Back
              </button>
            ) : <div></div>}
            
            <button 
              type="submit" 
              disabled={registerMutation.isPending || (step === 2 && !formData.plan_id)}
              className="px-8 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover disabled:opacity-50 flex items-center gap-2"
            >
              {registerMutation.isPending ? 'Processing...' : step === 3 ? 'Complete Registration' : 'Continue'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default PatientRegistration;
