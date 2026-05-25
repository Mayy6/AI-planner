import { BookOpen, LayoutDashboard, Calendar, FileText, BarChart2, MessageSquare, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isConfigured } from '../lib/supabase';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: Calendar,        label: 'Calendar',  id: 'calendar'  },
  { icon: FileText,        label: 'Plans',     id: 'plans'     },
  { icon: BarChart2,       label: 'Progress',  id: 'progress'  },
  { icon: MessageSquare,   label: 'Chats',     id: 'chats'     },
  { icon: Settings,        label: 'Settings',  id: 'settings'  },
];

export default function Sidebar({ active, onNavigate }) {
  const { user, signOut } = useAuth();

  const displayName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'User';

  const email = user?.email || '';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-100 flex flex-col py-6 px-4 fixed left-0 top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8 px-2">
        <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
          <BookOpen size={16} className="text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-xs font-bold text-gray-800 leading-none">AI Study</p>
          <p className="text-xs font-bold text-gray-800 leading-none">Planner</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ icon: Icon, label, id }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left ${
                isActive
                  ? 'bg-violet-50 text-violet-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* User + sign out */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5 px-2 mb-2">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-violet-200 flex items-center justify-center text-violet-700 font-semibold text-xs">
              {initials}
            </div>
          )}
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-semibold text-gray-800 truncate">{displayName}</p>
            <p className="text-xs text-gray-400 truncate">{email}</p>
          </div>
        </div>

        {isConfigured && user && (
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        )}
      </div>
    </aside>
  );
}
