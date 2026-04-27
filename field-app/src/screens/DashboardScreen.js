import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { UserPlus, TrendingUp, Users, LogOut, CloudOff, RefreshCw } from 'lucide-react-native';
import api from '../api/axios';
import { useNetInfo } from '@react-native-community/netinfo';
import { getOfflinePatients, deleteOfflinePatient } from '../api/database';
import { useFocusEffect } from '@react-navigation/native';

const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ today: 0, monthly: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [offlineRecords, setOfflineRecords] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const netInfo = useNetInfo();

  // Check offline records when returning to dashboard
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadOfflineRecords();
    });
    return unsubscribe;
  }, [navigation]);

  const loadOfflineRecords = () => {
    const records = getOfflinePatients();
    setOfflineRecords(records || []);
  };

  // Auto-sync when internet comes back
  useEffect(() => {
    if (netInfo.isConnected && offlineRecords.length > 0 && !isSyncing) {
      syncOfflineData();
    }
  }, [netInfo.isConnected, offlineRecords.length]);

  const syncOfflineData = async () => {
    if (!netInfo.isConnected) return;
    setIsSyncing(true);
    let successCount = 0;
    
    for (const record of offlineRecords) {
      try {
        const payload = JSON.parse(record.payload);
        await api.post('/patients', payload);
        deleteOfflinePatient(record.id);
        successCount++;
      } catch (err) {
        console.error('Sync failed for record', record.id, err);
      }
    }
    
    setIsSyncing(false);
    loadOfflineRecords();
    if (successCount > 0) {
      fetchStats();
      Alert.alert('Sync Complete', `Successfully synced ${successCount} patient(s) to the cloud.`);
    }
  };

  const fetchStats = async () => {
    try {
      // In a real app, we would have a dedicated stats endpoint for the field executive
      // For now, we will just fetch the patient list registered by them to count
      const res = await api.get(`/patients?registered_by=${user.id}&limit=50`);
      const patients = res.data.data;
      
      const todayStr = new Date().toISOString().split('T')[0];
      const todayCount = patients.filter(p => p.created_at.startsWith(todayStr)).length;
      
      setStats({
        today: todayCount,
        monthly: patients.length // Simplified for demo
      });
    } catch (e) {
      console.log('Error fetching stats', e);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats().then(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.name}>{user?.name}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <LogOut size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {offlineRecords.length > 0 && (
          <View style={styles.offlineBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <CloudOff size={20} color="#b45309" style={{ marginRight: 8 }} />
              <View>
                <Text style={styles.offlineTitle}>Pending Sync: {offlineRecords.length}</Text>
                <Text style={styles.offlineDesc}>Patients waiting for connection</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.syncBtn} 
              onPress={syncOfflineData}
              disabled={isSyncing || !netInfo.isConnected}
            >
              {isSyncing ? <ActivityIndicator size="small" color="#fff" /> : <RefreshCw size={16} color="#fff" />}
              <Text style={styles.syncBtnText}>{isSyncing ? 'Syncing...' : 'Sync'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: '#e0f2fe' }]}>
              <TrendingUp size={24} color="#0284c7" />
            </View>
            <Text style={styles.statValue}>{stats.today}</Text>
            <Text style={styles.statLabel}>Today's Sales</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: '#fce7f3' }]}>
              <Users size={24} color="#db2777" />
            </View>
            <Text style={styles.statValue}>{stats.monthly}</Text>
            <Text style={styles.statLabel}>Monthly Total</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('Register')}
        >
          <View style={styles.actionIcon}>
            <UserPlus size={32} color="#fff" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Register Patient</Text>
            <Text style={styles.actionSubtitle}>Issue a new Namma Health Card</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 12,
  },
  greeting: {
    fontSize: 14,
    color: '#444746',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f1f1f',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  logoutBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#f1f3f4',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F3F6FC', // Material 3 secondary container
    padding: 20,
    borderRadius: 28, // M3 large rounding
    borderWidth: 0,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  statValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#001d35',
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 13,
    color: '#444746',
    fontWeight: '600',
    marginTop: 2,
  },
  actionCard: {
    backgroundColor: '#0b57d0', // Material 3 Primary
    borderRadius: 28,
    padding: 32,
    flexDirection: 'column',
    alignItems: 'flex-start',
    shadowColor: '#0b57d0',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
    marginTop: 12,
  },
  actionIcon: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  actionTextContainer: {
    width: '100%',
  },
  actionTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  actionSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    marginTop: 6,
    lineHeight: 20,
  },
  offlineBanner: {
    backgroundColor: '#fff8e1',
    borderWidth: 1,
    borderColor: '#ffe082',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offlineTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#795548',
  },
  offlineDesc: {
    fontSize: 13,
    color: '#8d6e63',
    marginTop: 2,
  },
  syncBtn: {
    backgroundColor: '#ffa000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 8,
  },
  syncBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  }
});

export default DashboardScreen;
