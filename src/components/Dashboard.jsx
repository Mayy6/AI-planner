import { Bell, Flame, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../hooks/useEvents';
import { useStreak } from '../hooks/useStreak';

const TYPE_DOT = {
  study: 'bg-blue-400',
  review: 'bg-green-400',
  exam: 'bg-orange-400',
  break: 'bg-gray-300',
};

const TYPE_LABEL = {
  study: 'Study',
  review: 'Review',
  exam: 'Practice Exam',
  break: 'Break',
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmt12(t) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function getWeekDates() {
  const today = new Date();
  const dow = today.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function CircularProgress({ percent }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#ede9fe" strokeWidth="10" />
        <circle cx="64" cy="64" r={r} fill="none" stroke="#7c3aed" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-2xl font-bold text-gray-800">{percent}%</span>
    </div>
  );
}

export default function Dashboard({ onNavigate }) {
  const { user } = useAuth();
  const { events } = useEvents();
  const streak = useStreak(user?.id);

  const today = new Date();
  const todayStr = toDateStr(today);
  const weekDates = getWeekDates();

  // Today's events sorted by start time
  const todayEvents = events
    .filter(e => e.date === todayStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Next upcoming event today (not yet started)
  const nowTime = `${String(today.getHours()).padStart(2,'0')}:${String(today.getMinutes()).padStart(2,'0')}`;
  const upcomingEvent = todayEvents.find(e => e.endTime > nowTime) || todayEvents[0];

  // Next exam (future, type === 'exam')
  const nextExam = events
    .filter(e => e.type === 'exam' && e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const daysUntilExam = nextExam
    ? Math.ceil((new Date(nextExam.date) - today) / (1000 * 60 * 60 * 24))
    : null;

  // Study hours: sum up all study/review/exam events (hours)
  const totalHours = events.reduce((sum, e) => {
    const [sh, sm] = e.startTime.split(':').map(Number);
    const [eh, em] = e.endTime.split(':').map(Number);
    return sum + ((eh * 60 + em - sh * 60 - sm) / 60);
  }, 0);
  const completedHours = Math.round(totalHours);
  const progress = totalHours > 0 ? Math.min(Math.round((completedHours / Math.max(completedHours + 10, 40)) * 100), 100) : 0;

  // First name from OAuth metadata
  const firstName =
    user?.user_metadata?.name?.split(' ')[0] ||
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'there';

  // Avatar
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = firstName.slice(0, 2).toUpperCase();

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{greeting()}, {firstName}! 👋</h1>
          <p className="text-sm text-gray-400 mt-0.5">Let's get you closer to your goals.</p>
        </div>
        <button className="w-9 h-9 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
          <Bell size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Top row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Upcoming Today */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Upcoming Today</p>
          {upcomingEvent ? (
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${TYPE_DOT[upcomingEvent.type] || 'bg-blue-400'}`} />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">
                  {fmt12(upcomingEvent.startTime)} – {fmt12(upcomingEvent.endTime)}
                </p>
                <p className="text-sm font-semibold text-gray-800">{upcomingEvent.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{TYPE_LABEL[upcomingEvent.type]}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No sessions scheduled for today.</p>
          )}
          <button
            onClick={() => onNavigate('calendar')}
            className="mt-3 text-xs text-violet-600 font-medium flex items-center gap-0.5 hover:gap-1.5 transition-all"
          >
            View all <ChevronRight size={12} />
          </button>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex flex-col items-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 self-start">Progress</p>
          <CircularProgress percent={progress} />
          <p className="text-xs font-semibold text-gray-700 mt-1">Overall Progress</p>
          <p className="text-xs text-gray-400 mt-0.5">{completedHours} study hours scheduled</p>
        </div>
      </div>

      {/* Next Exam */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Next Exam</p>
        {nextExam ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">{nextExam.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{nextExam.date}</p>
            </div>
            <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-full">
              {daysUntilExam === 0 ? 'Today!' : `${daysUntilExam} day${daysUntilExam !== 1 ? 's' : ''} left`}
            </span>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No upcoming exams. Add one in the calendar.</p>
        )}
      </div>

      {/* Weekly Overview */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Weekly Overview</p>
          <p className="text-xs text-gray-400">
            {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
            {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDates.map((d, i) => {
            const isToday = toDateStr(d) === todayStr;
            const dayEvents = events.filter(e => e.date === toDateStr(d));
            const dotType = dayEvents[0]?.type || null;

            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-xs text-gray-400">
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}
                </span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                  isToday ? 'bg-violet-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                  {d.getDate()}
                </div>
                <div className={`w-2 h-2 rounded-full ${dotType ? TYPE_DOT[dotType] : 'bg-gray-200'}`} />
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 mt-3 pt-3 border-t border-gray-50">
          {Object.entries(TYPE_DOT).map(([key, color]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-xs text-gray-400">{TYPE_LABEL[key]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Streak */}
      <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-50 w-fit">
        <Flame size={18} className="text-orange-500" />
        <span className="text-sm font-bold text-gray-800">{streak}</span>
        <span className="text-sm text-gray-400">Day Streak</span>
      </div>
    </div>
  );
}
