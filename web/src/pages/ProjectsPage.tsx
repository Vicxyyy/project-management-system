import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/apiClient';
import { Project } from '../types';

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (statusFilter) queryParams.set('status', statusFilter);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects', search, statusFilter],
    queryFn: async () => {
      const res = await apiClient.get<{ data: { projects: Project[] } }>(`/projects?${queryParams.toString()}`);
      return res.data.projects;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this project? All associated tasks will be lost.')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Projects</h2>
          <p className="text-slate-400 mt-1">Manage all your projects in one place.</p>
        </div>
        <Link to="/projects/new" className="btn-primary w-full sm:w-auto shrink-0">
          + New Project
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search projects..."
          className="input-field w-full sm:max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input-field w-full sm:max-w-[200px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="NOT_STARTED">Not Started</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-slate-400 p-8 text-center bg-slate-800/20 rounded-xl border border-slate-700/30">Loading projects...</div>
      ) : error ? (
        <div className="bg-rose-500/10 text-rose-400 p-4 rounded-xl border border-rose-500/20">
          Failed to load projects.
        </div>
      ) : data?.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <p className="text-slate-400 text-lg mb-4">No projects found.</p>
          <Link to="/projects/new" className="btn-primary">Create your first project</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {data?.map((project) => (
            <div key={project.id} className="card flex flex-col cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-slate-100 line-clamp-1">{project.name}</h3>
                <span className={`badge ${
                  project.status === 'COMPLETED' ? 'badge-success' : 
                  project.status === 'IN_PROGRESS' ? 'badge-info' : 'badge-warning'
                }`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-slate-400 text-sm flex-1 line-clamp-3 mb-6">
                {project.description || 'No description provided.'}
              </p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-700/50">
                <span className="text-xs text-slate-500">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Link to={`/projects/${project.id}/edit`} className="btn-secondary px-3 py-1 text-xs">Edit</Link>
                  <button onClick={() => handleDelete(project.id)} className="btn-danger px-3 py-1 text-xs">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
