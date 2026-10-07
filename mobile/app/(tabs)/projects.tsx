import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { apiClient } from '../../lib/apiClient';
import { Project } from '../../types';

export default function ProjectsScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchProjects = async () => {
    try {
      const res = await apiClient.get<{ data: { projects: Project[] } }>('/projects');
      setProjects(res.data.projects);
      setError(null);
    } catch (e: any) {
      if (e.message !== 'UNAUTHORIZED') setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProjects();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProjects();
    setRefreshing(false);
  }, []);

  const confirmDelete = (id: string) => {
    Alert.alert('Delete Project', 'Are you sure? This will delete all tasks inside it.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await apiClient.delete(`/projects/${id}`);
          fetchProjects();
        } catch (e: any) {
          Alert.alert('Error', e.message);
        }
      } }
    ]);
  };

  const renderItem = ({ item }: { item: Project }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/projects/${item.id}?view=true`)}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.status.replace('_', ' ')}</Text>
        </View>
      </View>
      <Text style={styles.cardDescription} numberOfLines={2}>
        {item.description || 'No description provided.'}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(item.id)}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Projects</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/projects/new')}>
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No projects found. Create one!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  addButton: { backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', flex: 1, marginRight: 8 },
  badge: { backgroundColor: '#e0e7ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#4f46e5' },
  cardDescription: { fontSize: 14, color: '#64748b', marginBottom: 16 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  dateText: { fontSize: 12, color: '#94a3b8' },
  deleteButton: { padding: 4 },
  deleteText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
  errorBox: { margin: 20, backgroundColor: '#fef2f2', borderColor: '#f87171', borderWidth: 1, padding: 12, borderRadius: 8 },
  errorText: { color: '#ef4444', textAlign: 'center' },
  emptyBox: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#64748b', fontSize: 16 },
});
