import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/axios';
import { CheckCircle, ChevronLeft } from 'lucide-react-native';

const RegistrationScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    plan_id: '',
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/plans');
      setPlans(res.data.data.filter(p => p.is_active));
    } catch (e) {
      console.log('Error fetching plans', e);
    }
  };

  const handleRegister = async () => {
    if (!formData.full_name || !formData.phone || !formData.plan_id) {
      Alert.alert('Error', 'Please fill in all required fields and select a plan.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/patients', formData);
      setStep(3); // Success step
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register Patient</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Step Indicators */}
        <View style={styles.stepper}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
          <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
          <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]} />
        </View>

        {step === 1 && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Primary Details</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              value={formData.full_name}
              onChangeText={(t) => setFormData({...formData, full_name: t})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Phone Number (10 digits) *"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(t) => setFormData({...formData, phone: t})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Email Address (Optional)"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(t) => setFormData({...formData, email: t})}
            />

            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Address"
              multiline
              value={formData.address}
              onChangeText={(t) => setFormData({...formData, address: t})}
            />

            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => {
                if(!formData.full_name || !formData.phone) {
                  Alert.alert('Required', 'Name and Phone are required.');
                  return;
                }
                setStep(2);
              }}
            >
              <Text style={styles.primaryButtonText}>Next: Select Plan</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Select Membership Plan</Text>
            
            {plans.map(plan => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  formData.plan_id === plan.id && styles.planCardActive
                ]}
                onPress={() => setFormData({...formData, plan_id: plan.id})}
              >
                <View style={styles.planHeader}>
                  <Text style={[styles.planName, formData.plan_id === plan.id && { color: '#e61d62' }]}>{plan.name}</Text>
                  {formData.plan_id === plan.id && <CheckCircle size={20} color="#e61d62" />}
                </View>
                <Text style={styles.planPrice}>₹{plan.price}</Text>
                <Text style={styles.planDesc}>Valid for {plan.validity_months} months • Up to {plan.max_family_members} members</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => setStep(1)}
              >
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.primaryButton, { flex: 1, marginLeft: 12 }]}
                onPress={handleRegister}
                disabled={loading || !formData.plan_id}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Complete & Issue Card</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.successSection}>
            <View style={styles.successIconWrapper}>
              <CheckCircle size={64} color="#22c55e" />
            </View>
            <Text style={styles.successTitle}>Registration Complete!</Text>
            <Text style={styles.successDesc}>The health card has been successfully generated and sent to the patient via SMS/Email.</Text>
            
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Dashboard')}
            >
              <Text style={styles.primaryButtonText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  content: {
    padding: 24,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
  },
  stepDotActive: {
    backgroundColor: '#e61d62',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#e61d62',
  },
  formSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#e61d62',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flex: 1,
  },
  secondaryButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  planCard: {
    borderWidth: 2,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#fff',
  },
  planCardActive: {
    borderColor: '#e61d62',
    backgroundColor: 'rgba(230, 29, 98, 0.05)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 8,
  },
  planDesc: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  successSection: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  successIconWrapper: {
    width: 120,
    height: 120,
    backgroundColor: '#dcfce7',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  successDesc: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
});

export default RegistrationScreen;
