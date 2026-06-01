import { Sun, Moon, Bell, BellOff, Globe, Clock, CalendarDays, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { isConfigured } from '../lib/supabase';

// ── Reusable primitives ────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="px-6 py-3 border-b border-gray-50 dark:border-slate-700">
        <h2 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
          {title}
        </h2>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-slate-700">
        {children}
      </div>
    </div>
  );
}

function Row({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-6 px-6 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-700 dark:text-slate-200">{label}</p>
        {description && (
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// Segmented control (like the view toggle in Calendar)
function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-0.5 gap-0.5">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-md transition-all ${
            value === opt.value
              ? 'bg-white dark:bg-slate-600 text-gray-800 dark:text-slate-100 shadow-sm'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
          }`}
        >
          {opt.icon && <opt.icon size={14} />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// iOS-style toggle switch
function Toggle({ on, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
        disabled ? 'opacity-40 cursor-not-allowed' :
        on ? 'bg-violet-600' : 'bg-gray-200 dark:bg-slate-600'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
          on ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function Settings() {
  const { user, signOut } = useAuth();
  const { settings, update, t } = useSettings();
  const s = t.settings;

  const displayName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'User';
  const email = user?.email || '';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-gray-800 mb-6">{s.title}</h1>

      <div className="space-y-4">

        {/* ── Appearance ── */}
        <Section title={s.appearance}>
          <Row label={s.theme}>
            <SegmentedControl
              value={settings.theme}
              onChange={v => update('theme', v)}
              options={[
                { value: 'light', label: s.themeLight, icon: Sun },
                { value: 'dark',  label: s.themeDark,  icon: Moon },
              ]}
            />
          </Row>

          <Row label={s.language}>
            <SegmentedControl
              value={settings.language}
              onChange={v => update('language', v)}
              options={[
                { value: 'en', label: 'English' },
                { value: 'zh', label: '中文' },
              ]}
            />
          </Row>
        </Section>

        {/* ── Preferences ── */}
        <Section title={s.preferences}>
          <Row label={s.timeFormat}>
            <SegmentedControl
              value={settings.timeFormat}
              onChange={v => update('timeFormat', v)}
              options={[
                { value: '12h', label: s.tf12 },
                { value: '24h', label: s.tf24 },
              ]}
            />
          </Row>

          <Row label={s.weekStart}>
            <SegmentedControl
              value={settings.weekStart}
              onChange={v => update('weekStart', v)}
              options={[
                { value: 'monday', label: s.weekMon },
                { value: 'sunday', label: s.weekSun },
              ]}
            />
          </Row>
        </Section>

        {/* ── Notifications ── */}
        <Section title={s.notifications}>
          <Row label={s.studyReminders} description={s.studyRemindersDesc}>
            <Toggle
              on={settings.studyReminders}
              onChange={v => update('studyReminders', v)}
              disabled
            />
          </Row>

          <Row label={s.examAlerts} description={s.examAlertsDesc}>
            <Toggle
              on={settings.examAlerts}
              onChange={v => update('examAlerts', v)}
              disabled
            />
          </Row>

          <div className="px-6 py-3">
            <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1.5">
              <BellOff size={12} />
              {s.notifNote}
            </p>
          </div>
        </Section>

        {/* ── Account ── */}
        <Section title={s.account}>
          <Row label={displayName} description={email}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 font-semibold text-sm">
                {initials}
              </div>
            )}
          </Row>

          {isConfigured && user && (
            <Row label="">
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              >
                <LogOut size={15} />
                {s.signOut}
              </button>
            </Row>
          )}
        </Section>

      </div>
    </div>
  );
}
