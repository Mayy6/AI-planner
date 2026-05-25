import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import './index.css';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Coming soon...
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar active={activePage} onNavigate={setActivePage} />
      <main className="ml-56 flex-1 p-8">
        {renderPage()}
      </main>
    </div>
  );
}
