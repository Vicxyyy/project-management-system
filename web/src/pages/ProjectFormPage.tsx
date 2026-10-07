import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { Project, ProjectStatus } from '../types';

export default function ProjectFormPage() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('NOT_STARTED');

  const { data, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await apiClient.get<{ data: { project: Project } }>(`/projects/${id}`);
      return res.data.project;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (data) {
      setName(data.name);
      setDescription(data.description || '');
      setStatus(data.status);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (payload: any) => {
      if (isEditing) {
        return apiClient.put(`/projects/${id}`, payload);
      }
      return apiClient.post('/projects', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      navigate('/projects');
    },
  });

  if (isEditing && isLoading) return <div className="text-slate-400">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-6">
        {isEditing ? 'Edit Project' : 'Create Project'}
      </h2>

      <div className="card p-6 sm:p-8">
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate({ name, description, status }); }} className="space-y-6">
          <div>
            <label className="label">Project Name *</label>
            <input required type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input-field min-h-[120px]" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          {isEditing && (
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={status} onChange={e => setStatus(e.target.value as ProjectStatus)}>
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          )}
          
          <div className="flex gap-4 pt-4">
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Project'}
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
