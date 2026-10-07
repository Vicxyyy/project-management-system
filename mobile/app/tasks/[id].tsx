import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '../../lib/apiClient';
import { Task, TaskStatus, TaskPriority, Project } from '../../types';

export default function TaskFormModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEditing = id && id !== 'new';
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [status, setStatus] = useState<TaskStatus>('PENDING');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const projRes = await apiClient.get<{ data: { projects: Project[] } }>('/projects');
        setProjects(projRes.data.projects);

        if (isEditing) {
          // fetch all tasks to find the one we edit
          const taskRes = await apiClient.get<{ data: { tasks: Task[] } }>('/tasks');
          const task = taskRes.data.tasks.find(t => t.id === id);
          if (task) {
            setName(task.name);
            setDescription(task.description || '');
            setProjectId(task.projectId);
            setStatus(task.status);
            setPriority(task.priority);
          } else {
            Alert.alert('Error', 'Task not found');
            router.back();
          }
        }
      } catch (e: any) {
        Alert.alert('Error', e.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  const handleSave = async () => {
    if (!name || (!isEditing && !projectId)) return Alert.alert('Error', 'Name and Project are required');
    setSaving(true);
    try {
      if (isEditing) {
        await apiClient.put(`/tasks/${id}`, { name, description, status, priority });
      } else {
        await apiClient.post('/tasks', { name, description, projectId, status, priority });
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4f46e5" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>{isEditing ? 'Edit Task' : 'New Task'}</Text>

      {!isEditing && (
        <>
          <Text style={styles.label}>Project *</Text>
          <View style={styles.optionsGrid}>
            {projects.map(p => (
              <TouchableOpacity key={p.id} style={[styles.optionBtn, projectId === p.id && styles.optionBtnActive]} onPress={() => setProjectId(p.id)}>
                <Text style={[styles.optionBtnText, projectId === p.id && styles.optionBtnTextActive]} numberOfLines={1}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={styles.label}>Task Name *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="E.g., Update API" />

      <Text style={styles.label}>Description</Text>
      <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline numberOfLines={3} />

      <Text style={styles.label}>Priority</Text>
      <View style={styles.optionsGrid}>
        {['LOW', 'MEDIUM', 'HIGH'].map(p => (
          <TouchableOpacity key={p} style={[styles.optionBtn, priority === p && styles.optionBtnActive]} onPress={() => setPriority(p as TaskPriority)}>
            <Text style={[styles.optionBtnText, priority === p && styles.optionBtnTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isEditing && (
        <>
          <Text style={styles.label}>Status</Text>
          <View style={styles.optionsGrid}>
            {['PENDING', 'IN_PROGRESS', 'COMPLETED'].map(s => (
              <TouchableOpacity key={s} style={[styles.optionBtn, status === s && styles.optionBtnActive]} onPress={() => setStatus(s as TaskStatus)}>
                <Text style={[styles.optionBtnText, status === s && styles.optionBtnTextActive]}>{s.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Task</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, backgroundColor: '#fff' },
  optionBtnActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  optionBtnText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  optionBtnTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: '#4f46e5', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
