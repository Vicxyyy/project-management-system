import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/tasks': 'Tasks',
};

export default function TopBar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  
  // Extract base path for title
  const basePath = '/' + pathname.split('/')[1];
  const title = PAGE_TITLES[basePath] ?? 'Project Management System';
  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

  return (
    <header className="h-16 flex-shrink-0 bg-slate-900/50 backdrop-blur-xl border-b border-slate-700/50 flex items-center justify-between px-8 relative z-10 transition-all duration-300">
      <h1 className="text-xl font-bold text-slate-100">{title}</h1>

      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-slate-400 hidden sm:block">{user?.email}</span>
        <div className="group relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg cursor-pointer ring-2 ring-slate-800 group-hover:ring-indigo-500 transition-all duration-300">
            {initials}
          </div>
          <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-xl shadow-xl border border-slate-700/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
            <div className="p-3 border-b border-slate-700/50">
              <p className="text-sm font-bold text-slate-200">{user?.fullName}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
            <div className="p-1">
              <button 
                onClick={logout}
                className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
