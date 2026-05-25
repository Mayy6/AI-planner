import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import AddEventModal from './AddEventModal';

// ── helpers ────────────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const TYPE_STYLE = {
  study: { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500',   label: 'Study' },
  review:{ bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500',  label: 'Review' },
  exam:  { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500', label: 'Practice Exam' },
  break: { bg: 'bg-gray-100',   text: 'text-gray-500',   dot: 'bg-gray-400',   label: 'Break' },
};

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isSameDay(a, b) {
  return toDateStr(a) === toDateStr(b);
}

// Monday-aligned week containing `base`
function getWeekDates(base) {
  const d = new Date(base);
  const dow = d.getDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    return day;
  });
}

// 6-week grid for month view (Mon-aligned)
function getMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const dow = first.getDay();
  const offset = dow === 0 ? 6 : dow - 1;

  const days = [];
  for (let i = offset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, current: false });
  }
  const last = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= last; d++) {
    days.push({ date: new Date(year, month, d), current: true });
  }
  while (days.length < 42) {
    const d = new Date(year, month + 1, days.length - last - offset + 1);
    days.push({ date: d, current: false });
  }
  return days;
}

// Week view constants
const HOUR_HEIGHT = 60; // px per hour
const START_HOUR = 0;
const END_HOUR = 24;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

function eventPosition(startTime, endTime) {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const top = ((sh - START_HOUR) * 60 + sm) * (HOUR_HEIGHT / 60);
  const height = Math.max(((eh - sh) * 60 + (em - sm)) * (HOUR_HEIGHT / 60), 22);
  return { top, height };
}

function fmt12(time) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ── sub-components ──────────────────────────────────────────────────────────

function MonthView({ currentDate, events, today, onDayClick, onDeleteEvent }) {
  const grid = getMonthGrid(currentDate.getFullYear(), currentDate.getMonth());

  return (
    <div className="flex-1 overflow-auto">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAYS_SHORT.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7" style={{ gridTemplateRows: 'repeat(6, minmax(100px, 1fr))' }}>
        {grid.map(({ date, current }, i) => {
          const isToday = isSameDay(date, today);
          const dayEvents = events.filter(e => e.date === toDateStr(date));

          return (
            <div
              key={i}
              onClick={() => onDayClick(toDateStr(date))}
              className={`border-b border-r border-gray-100 p-1.5 cursor-pointer hover:bg-gray-50 transition-colors ${
                !current ? 'bg-gray-50/50' : ''
              }`}
            >
              <span className={`inline-flex w-6 h-6 text-xs font-semibold items-center justify-center rounded-full mb-1 ${
                isToday
                  ? 'bg-violet-600 text-white'
                  : current ? 'text-gray-700' : 'text-gray-300'
              }`}>
                {date.getDate()}
              </span>

              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(ev => {
                  const s = TYPE_STYLE[ev.type] || TYPE_STYLE.study;
                  return (
                    <div
                      key={ev.id}
                      onClick={e => { e.stopPropagation(); onDeleteEvent(ev.id); }}
                      className={`text-xs px-1.5 py-0.5 rounded ${s.bg} ${s.text} truncate cursor-pointer hover:opacity-70 transition-opacity`}
                      title={`${ev.title} — click to delete`}
                    >
                      {ev.title}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-400 px-1">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ currentDate, events, today, onSlotClick, onDeleteEvent }) {
  const weekDates = getWeekDates(currentDate);

  return (
    <div className="flex-1 overflow-auto">
      {/* Day headers */}
      <div className="flex border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="w-14 flex-shrink-0" />
        {weekDates.map((d, i) => {
          const isToday = isSameDay(d, today);
          return (
            <div key={i} className="flex-1 text-center py-2 border-l border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase">{DAYS_SHORT[i]}</p>
              <span className={`inline-flex w-7 h-7 mt-0.5 text-sm font-bold items-center justify-center rounded-full ${
                isToday ? 'bg-violet-600 text-white' : 'text-gray-700'
              }`}>
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex">
        {/* Hour labels */}
        <div className="w-14 flex-shrink-0">
          {HOURS.map(h => (
            <div key={h} style={{ height: HOUR_HEIGHT }} className="flex items-start justify-end pr-2 pt-1">
              <span className="text-xs text-gray-400">
                {h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDates.map((d, di) => {
          const dayEvents = events.filter(e => e.date === toDateStr(d));
          return (
            <div
              key={di}
              className="flex-1 border-l border-gray-100 relative"
              style={{ height: HOURS.length * HOUR_HEIGHT }}
              onClick={() => onSlotClick(toDateStr(d))}
            >
              {/* Hour lines */}
              {HOURS.map(h => (
                <div
                  key={h}
                  style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                  className="absolute left-0 right-0 border-t border-gray-100"
                />
              ))}

              {/* Events */}
              {dayEvents.map(ev => {
                const s = TYPE_STYLE[ev.type] || TYPE_STYLE.study;
                const { top, height } = eventPosition(ev.startTime, ev.endTime);
                return (
                  <div
                    key={ev.id}
                    style={{ top, height, left: 2, right: 2 }}
                    className={`absolute rounded-lg px-2 py-1 text-xs font-medium ${s.bg} ${s.text} overflow-hidden cursor-pointer group`}
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="truncate">
                        <div className="font-semibold truncate">{ev.title}</div>
                        {height > 30 && (
                          <div className="opacity-70">{fmt12(ev.startTime)} – {fmt12(ev.endTime)}</div>
                        )}
                      </div>
                      <button
                        onClick={() => onDeleteEvent(ev.id)}
                        className="opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── main component ──────────────────────────────────────────────────────────
export default function Calendar() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week');
  const [showModal, setShowModal] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const { events, addEvent, removeEvent } = useEvents();

  // Navigation
  const prev = () => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };
  const next = () => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };
  const goToday = () => setCurrentDate(new Date());

  // Header label
  const weekDates = getWeekDates(currentDate);
  const headerLabel = view === 'month'
    ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    : `${MONTHS[weekDates[0].getMonth()]} ${weekDates[0].getFullYear()}`;

  const openModal = (date) => {
    setModalDate(date);
    setShowModal(true);
  };

  return (
    <div className="flex flex-col h-screen max-h-screen -m-8 p-8 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-800 mr-2">Calendar</h1>

        <button
          onClick={goToday}
          className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
        >
          Today
        </button>

        <button onClick={prev} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
          <ChevronLeft size={16} />
        </button>
        <button onClick={next} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
          <ChevronRight size={16} />
        </button>

        <span className="text-sm font-semibold text-gray-700 min-w-[160px]">{headerLabel}</span>

        {/* View toggle */}
        <div className="flex bg-gray-100 rounded-lg p-0.5 ml-2">
          {['week', 'month'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors capitalize ${
                view === v ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <button
          onClick={() => openModal(toDateStr(today))}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white text-xs font-semibold rounded-xl hover:bg-violet-700 transition-colors"
        >
          <Plus size={14} /> Add Event
        </button>
      </div>

      {/* Calendar body */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        {view === 'month' ? (
          <MonthView
            currentDate={currentDate}
            events={events}
            today={today}
            onDayClick={openModal}
            onDeleteEvent={removeEvent}
          />
        ) : (
          <WeekView
            currentDate={currentDate}
            events={events}
            today={today}
            onSlotClick={openModal}
            onDeleteEvent={removeEvent}
          />
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-100 flex-shrink-0">
          {Object.entries(TYPE_STYLE).map(([key, s]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className="text-xs text-gray-400">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <AddEventModal
          defaultDate={modalDate}
          onSave={addEvent}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
