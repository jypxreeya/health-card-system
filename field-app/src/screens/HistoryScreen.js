import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Calendar } from 'lucide-react-native';

const HistoryScreen = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPatients = async () => {
    try {
      const res = await api.get(`/patients?registered_by=${user.id}`);
      setPatients(res.data.data);
    } catch (e) {
      console.log('Error fetching history', e);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPatients().then(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    fetchPatients();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.patientName}>{item.full_name}</Text>
        <View style={[styles.statusBadge, item.card_status === 'active' ? styles.statusActive : styles.statusInactive]}>
          <Text style={styles.statusText}>{item.card_status}</Text>
        </View>
      </View>
      
      <Text style={styles.phone}>{item.phone}</Text>
      
      <View style={styles.divider} />
      
      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <CreditCard size={16} color="#64748b" />
          <Text style={styles.footerText}>{item.card_number || 'Pending'}</Text>
        </View>
        <View style={styles.footerItem}>
          <Calendar size={16} color="#64748b" />
          <Text style={styles.footerText}>{item.created_at.split('T')[0]}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Registrations</Text>
      </View>
      
      <FlatList
        data={patients}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No patients registered yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f1f1f',
    letterSpacing: -0.5,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#F3F6FC', // M3 secondary container
    borderRadius: 28, // M3 large rounding
    padding: 20,
    borderWidth: 0,
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#001d35',
  },
  phone: {
    fontSize: 14,
    color: '#444746',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#c4eed0', // M3 positive container
  },
  statusInactive: {
    backgroundColor: '#f1f3f4',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#072711',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#444746',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    color: '#444746',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HistoryScreen;
