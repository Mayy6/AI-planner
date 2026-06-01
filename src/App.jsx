import { useState } from 'react';
import { useAuth, AuthContext } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { isConfigured } from './lib/supabase';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import Plans from './components/Plans';
import Settings from './components/Settings';
import Chats from './components/Chats';
import Login from './components/Login';

const DEMO_USER = {
  id: 'demo-user',
  email: 'demo@aiplanner.app',
  user_metadata: { name: 'Demo User', full_name: 'Demo User' },
};

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AppShell({ user }) {
  const [activePage, setActivePage] = useState('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard onNavigate={setActivePage} />;
      case 'calendar':  return <Calendar />;
      case 'plans':     return <Plans onNavigate={setActivePage} />;
      case 'chats':     return <Chats onNavigate={setActivePage} />;
      case 'settings':  return <Settings />;
      default:
        return (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
            Coming soon...
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar active={activePage} onNavigate={setActivePage} />
      <main className="ml-56 flex-1 p-8">{renderPage()}</main>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  const [demoMode, setDemoMode] = useState(false);

  if (loading) return <LoadingScreen />;

  // Real logged-in user
  if (user) {
    return (
      <SettingsProvider>
        <AppShell user={user} />
      </SettingsProvider>
    );
  }

  // Demo bypass — inject a mock user into AuthContext so hooks work normally
  if (demoMode) {
    return (
      <SettingsProvider>
        <AuthContext.Provider value={{ user: DEMO_USER, loading: false, signOut: () => setDemoMode(false) }}>
          <AppShell user={DEMO_USER} />
        </AuthContext.Provider>
      </SettingsProvider>
    );
  }

  return <Login onDemo={() => setDemoMode(true)} />;
}
