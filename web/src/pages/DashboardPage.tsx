import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  totalProjects: number;
  projectsInProgress: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: DashboardStats }>('/dashboard');
      return res.data;
    },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Welcome back, {user?.fullName?.split(' ')[0] || 'User'}!
        </h2>
        <p className="text-slate-400 mt-2 text-lg">Here's an overview of your work.</p>
      </div>

      {isLoading ? (
        <div className="text-slate-400">Loading your statistics...</div>
      ) : error ? (
        <div className="bg-rose-500/10 text-rose-400 p-4 rounded-xl border border-rose-500/20">
          Failed to load dashboard statistics.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {[
            { label: 'Total Projects', value: data?.totalProjects, color: 'text-indigo-400' },
            { label: 'Active Projects', value: data?.projectsInProgress, color: 'text-sky-400' },
            { label: 'Total Tasks', value: data?.totalTasks, color: 'text-purple-400' },
            { label: 'Completed Tasks', value: data?.completedTasks, color: 'text-emerald-400' },
            { label: 'Pending Tasks', value: data?.pendingTasks, color: 'text-amber-400' },
          ].map((stat) => (
            <div key={stat.label} className="card p-6 flex flex-col justify-between group">
              <p className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">{stat.label}</p>
              <p className={`text-4xl font-bold mt-4 ${stat.color}`}>{stat.value ?? '—'}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card p-6 sm:p-8 bg-gradient-to-br from-slate-800/80 to-slate-900/80">
        <h3 className="text-xl font-bold text-slate-200 mb-4">Quick Actions</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <a href="/projects" className="btn-primary">Manage Projects</a>
          <a href="/tasks" className="btn-secondary text-center justify-center">View All Tasks</a>
        </div>
      </div>
    </div>
  );
}
