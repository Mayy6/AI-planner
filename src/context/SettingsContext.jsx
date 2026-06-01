import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import T from '../lib/i18n';

const SettingsContext = createContext(null);

const DEFAULTS = {
  theme:          'light',   // 'light' | 'dark'
  language:       'en',      // 'en' | 'zh'
  notifications:  true,
  studyReminders: true,
  examAlerts:     true,
  timeFormat:     '12h',     // '12h' | '24h'
  weekStart:      'monday',  // 'monday' | 'sunday'
};

const KEY = 'app_settings';

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  // Apply / remove 'dark' class on <html> whenever theme changes
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const update = useCallback((key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Returns a time string formatted per user preference
  const formatTime = useCallback((t) => {
    const [h, m] = t.split(':').map(Number);
    if (settings.timeFormat === '24h') {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  }, [settings.timeFormat]);

  // Current language's translation strings
  const t = T[settings.language] || T.en;

  return (
    <SettingsContext.Provider value={{ settings, update, formatTime, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
