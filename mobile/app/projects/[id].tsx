import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../lib/apiClient';
import { Project, ProjectStatus, Task } from '../../types';

export default function ProjectModal() {
  const { id, view } = useLocalSearchParams<{ id: string; view?: string }>();
  const isNew = id === 'new';
  const isView = view === 'true';
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('NOT_STARTED');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchData = async () => {
    if (isNew) return;
    try {
      const res = await apiClient.get<{ data: { project: Project } }>(`/projects/${id}`);
      setName(res.data.project.name);
      setDescription(res.data.project.description || '');
      setStatus(res.data.project.status);

      if (isView) {
        const tasksRes = await apiClient.get<{ data: { tasks: Task[] } }>('/tasks');
        setTasks(tasksRes.data.tasks.filter(t => t.projectId === id));
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [id, isView]));

  const handleSave = async () => {
    if (!name) return Alert.alert('Error', 'Project name is required');
    setSaving(true);
    try {
      if (!isNew) {
        await apiClient.put(`/projects/${id}`, { name, description, status });
      } else {
        await apiClient.post('/projects', { name, description, status });
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>;

  if (isView) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{name}</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>{status.replace('_', ' ')}</Text></View>
          </View>
          <TouchableOpacity onPress={() => router.replace(`/projects/${id}`)} style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.description}>{description || 'No description.'}</Text>
        
        <View style={styles.tasksHeader}>
          <Text style={styles.tasksTitle}>Tasks</Text>
          <TouchableOpacity onPress={() => router.push('/tasks/new')}><Text style={styles.addTaskText}>+ Add Task</Text></TouchableOpacity>
        </View>

        {tasks.length === 0 ? (
          <Text style={styles.emptyText}>No tasks yet.</Text>
        ) : (
          tasks.map(task => (
            <View key={task.id} style={styles.taskCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.taskName}>{task.name}</Text>
                <Text style={styles.taskStatus}>{task.status.replace('_', ' ')}</Text>
              </View>
              <Text style={styles.taskPriority}>{task.priority}</Text>
            </View>
          ))
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>{!isNew ? 'Edit Project' : 'New Project'}</Text>

      <Text style={styles.label}>Project Name *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="E.g., App Redesign" />

      <Text style={styles.label}>Description</Text>
      <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Detailed description..." multiline numberOfLines={4} />

      {!isNew && (
        <>
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusRow}>
            {['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].map(s => (
              <TouchableOpacity key={s} style={[styles.statusBtn, status === s && styles.statusBtnActive]} onPress={() => setStatus(s as ProjectStatus)}>
                <Text style={[styles.statusBtnText, status === s && styles.statusBtnTextActive]}>{s.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
  badge: { backgroundColor: '#e0e7ff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#4f46e5' },
  editBtn: { backgroundColor: '#e2e8f0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  editBtnText: { fontWeight: 'bold', color: '#475569' },
  description: { fontSize: 16, color: '#475569', marginBottom: 32 },
  tasksHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  tasksTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  addTaskText: { color: '#4f46e5', fontWeight: 'bold' },
  emptyText: { color: '#94a3b8', fontStyle: 'italic' },
  taskCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  taskName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  taskStatus: { fontSize: 12, color: '#64748b', marginTop: 4 },
  taskPriority: { fontSize: 12, fontWeight: 'bold', color: '#f59e0b', backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, alignItems: 'center', backgroundColor: '#fff' },
  statusBtnActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  statusBtnText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  statusBtnTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: '#4f46e5', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
