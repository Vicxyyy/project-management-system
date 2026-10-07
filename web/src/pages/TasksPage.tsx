import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/apiClient';
import { Task } from '../types';

export default function TasksPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (statusFilter) queryParams.set('status', statusFilter);
  if (priorityFilter) queryParams.set('priority', priorityFilter);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks', search, statusFilter, priorityFilter],
    queryFn: async () => {
      const res = await apiClient.get<{ data: { tasks: Task[] } }>(`/tasks?${queryParams.toString()}`);
      return res.data.tasks;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiClient.put(`/tasks/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Tasks</h2>
          <p className="text-slate-400 mt-1">Track and manage your tasks.</p>
        </div>
        <Link to="/tasks/new" className="btn-primary w-full sm:w-auto shrink-0">
          + New Task
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search tasks..."
          className="input-field flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input-field w-full sm:w-[180px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select
          className="input-field w-full sm:w-[180px]"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-slate-400 p-8 text-center bg-slate-800/20 rounded-xl border border-slate-700/30">Loading tasks...</div>
      ) : error ? (
        <div className="bg-rose-500/10 text-rose-400 p-4 rounded-xl border border-rose-500/20">
          Failed to load tasks.
        </div>
      ) : data?.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <p className="text-slate-400 text-lg mb-4">No tasks found.</p>
          <Link to="/tasks/new" className="btn-primary">Create your first task</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.map((task) => (
            <div key={task.id} className={`card flex flex-col cursor-pointer ${task.status === 'COMPLETED' ? 'opacity-70' : ''}`} onClick={() => navigate(`/tasks/${task.id}/edit`)}>
              <div className="flex justify-between items-start mb-4">
                <h3 className={`text-xl font-bold line-clamp-1 ${task.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                  {task.name}
                </h3>
                <div className="flex flex-col gap-2 items-end">
                  <span className={`badge ${
                    task.status === 'COMPLETED' ? 'badge-success' : 
                    task.status === 'IN_PROGRESS' ? 'badge-info' : 'badge-warning'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                    task.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-400' :
                    task.priority === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              </div>
              <p className="text-slate-400 text-sm flex-1 line-clamp-2 mb-2">
                {task.description || 'No description'}
              </p>
              {task.dueDate && (
                <div className="text-xs text-indigo-300/80 font-medium mb-4 flex items-center gap-1">
                  📅 Due: {new Date(task.dueDate).toLocaleDateString()}
                </div>
              )}
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-700/50" onClick={(e) => e.stopPropagation()}>
                {task.status !== 'COMPLETED' ? (
                  <button onClick={() => statusMutation.mutate({ id: task.id, status: 'COMPLETED' })} className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors">
                    ✓ Mark Complete
                  </button>
                ) : (
                  <button onClick={() => statusMutation.mutate({ id: task.id, status: 'PENDING' })} className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors">
                    ⟲ Reopen
                  </button>
                )}
                <button onClick={() => handleDelete(task.id)} className="text-rose-400 hover:text-rose-300 text-sm font-medium transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
