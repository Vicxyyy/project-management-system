import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { Task, Project, TaskStatus, TaskPriority } from '../types';

export default function TaskFormPage() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('PENDING');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [projectId, setProjectId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: { projects: Project[] } }>('/projects');
      return res.data.projects;
    }
  });

  const { data: taskData, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      // In a real app we'd fetch the single task, but API didn't define GET /tasks/:id
      // We can fallback to fetching all tasks and filtering
      const res = await apiClient.get<{ data: { tasks: Task[] } }>('/tasks');
      const task = res.data.tasks.find(t => t.id === id);
      if (!task) throw new Error('Task not found');
      return task;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (taskData) {
      setName(taskData.name);
      setDescription(taskData.description || '');
      setStatus(taskData.status);
      setPriority(taskData.priority);
      setProjectId(taskData.projectId);
      if (taskData.dueDate) {
        setDueDate(new Date(taskData.dueDate).toISOString().split('T')[0]);
      }
    }
  }, [taskData]);

  const mutation = useMutation({
    mutationFn: (payload: any) => {
      if (isEditing) {
        return apiClient.put(`/tasks/${id}`, payload);
      }
      return apiClient.post('/tasks', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      navigate('/tasks');
    },
  });

  if (isEditing && isLoading) return <div className="text-slate-400">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-6">
        {isEditing ? 'Edit Task' : 'Create Task'}
      </h2>

      <div className="card p-6 sm:p-8">
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          const payload = { 
            name, description, projectId, status, priority, 
            dueDate: dueDate ? new Date(dueDate).toISOString() : null 
          };
          mutation.mutate(payload); 
        }} className="space-y-6">
          {!isEditing && (
            <div>
              <label className="label">Project *</label>
              <select required className="input-field" value={projectId} onChange={e => setProjectId(e.target.value)}>
                <option value="">Select a project...</option>
                {projectsData?.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Task Name *</label>
            <input required type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input-field min-h-[120px]" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isEditing && (
              <div>
                <label className="label">Status</label>
                <select className="input-field" value={status} onChange={e => setStatus(e.target.value as TaskStatus)}>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            )}
            <div>
              <label className="label">Priority</label>
              <select className="input-field" value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input type="date" className="input-field" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
          
          <div className="flex gap-4 pt-4">
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Task'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
              Cancel
            </button>
          </div>
          {mutation.isError && <p className="text-rose-400 mt-4 text-sm">{mutation.error.message}</p>}
        </form>
      </div>
    </div>
  );
}
