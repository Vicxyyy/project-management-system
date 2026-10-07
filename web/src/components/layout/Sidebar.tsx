import { NavLink } from 'react-router-dom';

interface NavItem {
  label: string;
  to: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: '⊞' },
  { label: 'Projects', to: '/projects', icon: '📁' },
  { label: 'Tasks', to: '/tasks', icon: '✓' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0 bg-slate-900/50 backdrop-blur-xl border-r border-slate-700/50 flex flex-col transition-all duration-300">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
        <span className="text-2xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">ProjectMS</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 mt-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300',
                isActive
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 hover:border-slate-700 border border-transparent',
              ].join(' ')
            }
          >
            <span className="text-xl leading-none">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-slate-700/50">
        <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/50">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Status</p>
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-300">System Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
