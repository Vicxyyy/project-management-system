import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../lib/apiClient';
import { Task } from '../../types';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchTasks = async () => {
    try {
      const res = await apiClient.get<{ data: { tasks: Task[] } }>('/tasks');
      setTasks(res.data.tasks);
    } catch (e: any) {
      if (e.message !== 'UNAUTHORIZED') Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchTasks(); }, []));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  }, []);

  const toggleComplete = async (task: Task) => {
    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      await apiClient.put(`/tasks/${task.id}`, { status: newStatus });
    } catch (e: any) {
      Alert.alert('Error', e.message);
      fetchTasks();
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await apiClient.delete(`/tasks/${id}`);
          fetchTasks();
        } catch (e: any) {
          Alert.alert('Error', e.message);
        }
      } }
    ]);
  };

  const filteredTasks = tasks.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  const renderItem = ({ item }: { item: Task }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/tasks/${item.id}`)}>
      <TouchableOpacity style={styles.checkbox} onPress={() => toggleComplete(item)}>
        <Ionicons name={item.status === 'COMPLETED' ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={item.status === 'COMPLETED' ? '#10b981' : '#cbd5e1'} />
      </TouchableOpacity>
      
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, item.status === 'COMPLETED' && styles.completedText]} numberOfLines={1}>{item.name}</Text>
        <View style={styles.tagsRow}>
          <Text style={[styles.tag, { backgroundColor: item.priority === 'HIGH' ? '#fecaca' : item.priority === 'MEDIUM' ? '#fef3c7' : '#f1f5f9', color: item.priority === 'HIGH' ? '#ef4444' : item.priority === 'MEDIUM' ? '#f59e0b' : '#64748b' }]}>
            {item.priority}
          </Text>
          <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          {item.dueDate && (
            <Text style={[styles.dateText, { color: '#8b5cf6', fontWeight: '500' }]}>
              Due: {new Date(item.dueDate).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
      
      <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDelete(item.id)}>
        <Ionicons name="trash-outline" size={20} color="#ef4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tasks</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/tasks/new')}>
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94a3b8" />
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search tasks..." 
          value={search} 
          onChangeText={setSearch} 
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No tasks found.</Text>
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
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 16, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 16 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', elevation: 1 },
  checkbox: { marginRight: 12 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  completedText: { textDecorationLine: 'line-through', color: '#94a3b8' },
  tagsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tag: { fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  dateText: { fontSize: 12, color: '#94a3b8' },
  deleteBtn: { padding: 8 },
  emptyBox: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#64748b', fontSize: 16 },
});
