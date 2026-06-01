import { useState } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, CalendarDays, MessageSquare } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';

const TYPE_STYLE = {
  study:  { bg: 'bg-blue-50',   text: 'text-blue-600',   label: 'Study' },
  review: { bg: 'bg-green-50',  text: 'text-green-600',  label: 'Review' },
  exam:   { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Practice Exam' },
  break:  { bg: 'bg-gray-50',   text: 'text-gray-400',   label: 'Break' },
};

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmt12(t) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function fmtDate(dateStr) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function daysUntil(dateStr) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  return Math.ceil((new Date(y, mo - 1, d) - new Date()) / (1000 * 60 * 60 * 24));
}

// Gather all sessions belonging to an exam's plan
function getPlanSessions(exam, allEvents, todayStr) {
  if (exam.conversationId) {
    return allEvents
      .filter(e => e.conversationId === exam.conversationId && e.id !== exam.id)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }
  // Fallback: non-break events between today and exam date
  return allEvents
    .filter(e =>
      e.date >= todayStr &&
      e.date <= exam.date &&
      e.id !== exam.id &&
      e.type !== 'break'
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
}

function PlanCard({ exam, sessions, todayStr, onToggleComplete }) {
  const [expanded, setExpanded] = useState(true);

  const trackable = sessions.filter(e => e.type !== 'break');
  const totalCount = trackable.length;
  const completedCount = trackable.filter(e => e.completed).length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const left = daysUntil(exam.date);

  // Group sessions by date
  const byDate = sessions.reduce((acc, ev) => {
    (acc[ev.date] ??= []).push(ev);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* ── Header ── */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 className="text-base font-bold text-gray-800">{exam.title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{fmtDate(exam.date)}</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${
            left <= 0  ? 'bg-red-50 text-red-600' :
            left <= 3  ? 'bg-red-50 text-red-600' :
            left <= 7  ? 'bg-amber-50 text-amber-600' :
                         'bg-violet-50 text-violet-600'
          }`}>
            {left <= 0 ? 'Today!' : left === 1 ? '1 day left' : `${left} days left`}
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-500 tabular-nums w-20 text-right">
            {totalCount > 0 ? `${completedCount}/${totalCount} done` : 'No tasks'}
          </span>
        </div>
      </div>

      {/* ── Sessions toggle ── */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-2.5 border-t border-gray-100 text-xs font-semibold text-gray-400 hover:bg-gray-50 transition-colors"
      >
        <span>{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* ── Session list ── */}
      {expanded && (
        <div className="border-t border-gray-100">
          {Object.entries(byDate).map(([date, evs]) => {
            const isPastDate = date < todayStr;
            const isToday   = date === todayStr;
            return (
              <div key={date}>
                {/* Date group header */}
                <div className={`px-5 py-1.5 text-xs font-semibold ${
                  isPastDate ? 'text-gray-300 bg-gray-50/50' :
                  isToday    ? 'text-violet-600 bg-violet-50/40' :
                               'text-gray-400'
                }`}>
                  {fmtDate(date)}{isToday ? ' — Today' : ''}
                </div>

                {/* Events */}
                {evs.map(ev => {
                  const s = TYPE_STYLE[ev.type] || TYPE_STYLE.study;
                  return (
                    <div
                      key={ev.id}
                      className={`flex items-center gap-3 px-5 py-3 border-t border-gray-50 hover:bg-gray-50 transition-colors ${
                        ev.completed ? 'opacity-55' : isPastDate && !ev.completed ? 'opacity-50' : ''
                      }`}
                    >
                      {/* Complete toggle */}
                      <button
                        onClick={() => onToggleComplete(ev.id)}
                        className="flex-shrink-0 transition-colors"
                        title={ev.completed ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {ev.completed
                          ? <CheckCircle2 size={17} className="text-violet-500" />
                          : <Circle      size={17} className="text-gray-250 hover:text-gray-400 text-gray-300" />
                        }
                      </button>

                      {/* Title + time */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium text-gray-700 truncate ${ev.completed ? 'line-through' : ''}`}>
                          {ev.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {fmt12(ev.startTime)} – {fmt12(ev.endTime)}
                        </p>
                      </div>

                      {/* Type badge */}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${s.bg} ${s.text}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Plans({ onNavigate }) {
  const { events, toggleComplete } = useEvents();
  const todayStr = toDateStr(new Date());

  const upcomingExams = events
    .filter(e => e.type === 'exam' && e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (upcomingExams.length === 0) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Plans</h1>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 flex flex-col items-center text-center">
          <CalendarDays size={44} className="text-gray-200 mb-4" />
          <p className="text-sm font-semibold text-gray-400 mb-1">No upcoming exam plans</p>
          <p className="text-xs text-gray-300 mb-5">
            Chat with the AI to generate a personalised study plan.
          </p>
          <button
            onClick={() => onNavigate('chats')}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-xs font-semibold rounded-xl hover:bg-violet-700 transition-colors"
          >
            <MessageSquare size={13} /> Go to Chats
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Plans</h1>
      <div className="space-y-4">
        {upcomingExams.map(exam => (
          <PlanCard
            key={exam.id}
            exam={exam}
            sessions={getPlanSessions(exam, events, todayStr)}
            todayStr={todayStr}
            onToggleComplete={toggleComplete}
          />
        ))}
      </div>
    </div>
  );
}
