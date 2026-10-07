import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { Project, Task } from '../types';

export default function ProjectDetailsPage() {
  const { id } = useParams();

  const { data: project, isLoading: projLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await apiClient.get<{ data: { project: Project } }>(`/projects/${id}`);
      return res.data.project;
    },
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', { projectId: id }],
    queryFn: async () => {
      // Fetch tasks and filter locally since there is no project id filter in backend yet? Wait, maybe there is.
      const res = await apiClient.get<{ data: { tasks: Task[] } }>('/tasks');
      return res.data.tasks.filter(t => t.projectId === id);
    },
  });

  if (projLoading) return <div className="text-slate-400">Loading project...</div>;
  if (!project) return <div className="text-rose-400">Project not found.</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/projects" className="text-indigo-400 text-sm hover:underline mb-2 inline-block">&larr; Back to Projects</Link>
          <h2 className="text-4xl font-bold text-slate-100">{project.name}</h2>
          <span className={`badge mt-3 ${
            project.status === 'COMPLETED' ? 'badge-success' : 
            project.status === 'IN_PROGRESS' ? 'badge-info' : 'badge-warning'
          }`}>
            {project.status.replace('_', ' ')}
          </span>
        </div>
        <Link to={`/projects/${project.id}/edit`} className="btn-secondary">Edit Project</Link>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-bold text-slate-200 mb-2">Description</h3>
        <p className="text-slate-400">{project.description || 'No description provided.'}</p>
        <p className="text-sm text-slate-500 mt-4">Created on {new Date(project.createdAt).toLocaleDateString()}</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-slate-100">Tasks</h3>
          <Link to="/tasks/new" className="btn-primary py-1.5 px-4 text-xs">+ Add Task</Link>
        </div>
        
        {tasksLoading ? (
          <div className="text-slate-400">Loading tasks...</div>
        ) : tasks?.length === 0 ? (
          <div className="card p-8 text-center text-slate-400">No tasks in this project yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks?.map(task => (
              <div key={task.id} className="card p-5">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-200">{task.name}</h4>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                    task.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-400' :
                    task.priority === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {task.priority}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">{task.description}</p>
                <div className="flex justify-between items-center mt-auto">
                  <span className={`badge ${
                    task.status === 'COMPLETED' ? 'badge-success' : 
                    task.status === 'IN_PROGRESS' ? 'badge-info' : 'badge-warning'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <Link to={`/tasks/${task.id}/edit`} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">Edit</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
