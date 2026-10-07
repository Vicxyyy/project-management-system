import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/apiClient';

interface DashboardStats {
  totalProjects: number;
  projectsInProgress: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const res = await apiClient.get<{ data: DashboardStats }>('/dashboard');
      setStats(res.data);
      setError(null);
    } catch (e: any) {
      if (e.message !== 'UNAUTHORIZED') {
        setError(e.message || 'Failed to fetch statistics');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
      >
        <Text style={styles.greeting}>Welcome, {user?.fullName?.split(' ')[0] || 'User'}!</Text>
        <Text style={styles.subtitle}>Here's an overview of your work.</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : stats ? (
          <View style={styles.statsGrid}>
            {[
              { label: 'Total Projects', value: stats.totalProjects, color: '#4f46e5' },
              { label: 'Active Projects', value: stats.projectsInProgress, color: '#0ea5e9' },
              { label: 'Total Tasks', value: stats.totalTasks, color: '#8b5cf6' },
              { label: 'Completed Tasks', value: stats.completedTasks, color: '#10b981' },
              { label: 'Pending Tasks', value: stats.pendingTasks, color: '#f59e0b' },
            ].map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20 },
  greeting: { fontSize: 32, fontWeight: '900', color: '#0f172a' },
  subtitle: { fontSize: 16, color: '#64748b', marginTop: 4, marginBottom: 24 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 20 },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statLabel: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  statValue: { fontSize: 36, fontWeight: '900', marginTop: 8 },
  errorBox: { backgroundColor: '#fef2f2', borderColor: '#f87171', borderWidth: 1, padding: 16, borderRadius: 12, marginTop: 20 },
  errorText: { color: '#ef4444', textAlign: 'center', fontSize: 15 },
});
