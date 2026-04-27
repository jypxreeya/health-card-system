import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/axios';
import { CheckCircle, ChevronLeft, WifiOff } from 'lucide-react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import * as storage from '../utils/storage';
import { saveOfflinePatient } from '../api/database';

const RegistrationScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [isOfflineSave, setIsOfflineSave] = useState(false);
  const netInfo = useNetInfo();
  
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
      if (netInfo.isConnected === false) {
        // Offline: try loading from cache
        const cached = await storage.getItemAsync('cached_plans');
        if (cached) setPlans(JSON.parse(cached));
        return;
      }
      const res = await api.get('/plans');
      const activePlans = res.data.data.filter(p => p.is_active);
      setPlans(activePlans);
      await storage.setItemAsync('cached_plans', JSON.stringify(activePlans));
    } catch (e) {
      console.log('Error fetching plans', e);
      const cached = await storage.getItemAsync('cached_plans');
      if (cached) setPlans(JSON.parse(cached));
    }
  };

  const handleRegister = async () => {
    if (!formData.full_name || !formData.phone || !formData.plan_id) {
      Alert.alert('Error', 'Please fill in all required fields and select a plan.');
      return;
    }

    setLoading(true);
    
    // OFFLINE MODE handling
    if (netInfo.isConnected === false) {
      saveOfflinePatient(formData);
      setIsOfflineSave(true);
      setStep(3);
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/patients', formData);
      setIsOfflineSave(false);
      setStep(3); // Success step
    } catch (error) {
      // If network fails unexpectedly despite netInfo saying it's true
      if (error.message === 'Network Error') {
        saveOfflinePatient(formData);
        setIsOfflineSave(true);
        setStep(3);
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Registration failed');
      }
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
        {netInfo.isConnected === false ? (
          <WifiOff size={24} color="#f59e0b" />
        ) : (
          <View style={{ width: 24 }} />
        )}
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
            <View style={[styles.successIconWrapper, isOfflineSave && { backgroundColor: '#fef3c7' }]}>
              {isOfflineSave ? <WifiOff size={64} color="#f59e0b" /> : <CheckCircle size={64} color="#22c55e" />}
            </View>
            <Text style={styles.successTitle}>{isOfflineSave ? 'Saved Offline' : 'Registration Complete!'}</Text>
            <Text style={styles.successDesc}>
              {isOfflineSave 
                ? 'No internet connection. The patient details have been securely saved on your device and will sync automatically when you are back online.'
                : 'The health card has been successfully generated and sent to the patient via SMS/Email.'}
            </Text>
            
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f1f1f',
    letterSpacing: -0.5,
  },
  content: {
    padding: 20,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f1f3f4',
  },
  stepDotActive: {
    backgroundColor: '#0b57d0',
  },
  stepLine: {
    width: 48,
    height: 3,
    backgroundColor: '#f1f3f4',
    marginHorizontal: 12,
    borderRadius: 2,
  },
  stepLineActive: {
    backgroundColor: '#0b57d0',
  },
  formSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f1f1f',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#747775',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    color: '#1f1f1f',
  },
  primaryButton: {
    backgroundColor: '#0b57d0',
    padding: 18,
    borderRadius: 100,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#0b57d0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 100,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#747775',
    flex: 1,
  },
  secondaryButtonText: {
    color: '#444746',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  planCard: {
    borderWidth: 1,
    borderColor: '#c4c7c5',
    borderRadius: 24,
    padding: 24,
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  planCardActive: {
    borderColor: '#0b57d0',
    backgroundColor: '#f3f6fc',
    borderWidth: 2,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f1f1f',
    marginTop: 4,
  },
  planDesc: {
    fontSize: 14,
    color: '#444746',
    marginTop: 12,
    lineHeight: 20,
  },
  successSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successIconWrapper: {
    width: 96,
    height: 96,
    backgroundColor: '#e8f0fe',
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f1f1f',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  successDesc: {
    fontSize: 16,
    color: '#444746',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 12,
  },
});

export default RegistrationScreen;
