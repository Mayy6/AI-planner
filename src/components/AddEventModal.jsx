import { X, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

const EVENT_TYPES = [
  { value: 'study', label: 'Study' },
  { value: 'review', label: 'Review' },
  { value: 'exam', label: 'Practice Exam' },
  { value: 'break', label: 'Break' },
];

function fmt12(t) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

export default function AddEventModal({
  defaultDate, defaultStartTime, defaultEndTime,
  existingEvents = [],
  onSave, onClose,
}) {
  const [form, setForm] = useState({
    title: '',
    date: defaultDate || (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    })(),
    startTime: defaultStartTime || '09:00',
    endTime: defaultEndTime || '10:00',
    type: 'study',
  });

  // null = no conflict; object = the first conflicting event found
  const [conflict, setConflict] = useState(null);

  const set = (field) => (e) => {
    setConflict(null); // clear warning when user edits
    setForm(f => ({ ...f, [field]: e.target.value }));
  };

  const findConflict = (f) =>
    existingEvents.find(e =>
      e.date === f.date &&
      e.startTime < f.endTime &&
      e.endTime > f.startTime
    ) || null;

  const handleSave = () => {
    if (!form.title.trim()) return;
    const hit = findConflict(form);
    if (hit && !conflict) {
      // First click → show warning, don't save yet
      setConflict(hit);
      return;
    }
    // Second click (confirmed) or no conflict → save
    onSave(form);
    onClose();
  };

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400';

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-800">Add Event</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Title</label>
            <input
              value={form.title}
              onChange={set('title')}
              placeholder="e.g. Azure Core Services"
              className={inputCls}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Date</label>
            <input type="date" value={form.date} onChange={set('date')} className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Start</label>
              <input type="time" value={form.startTime} onChange={set('startTime')} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">End</label>
              <input type="time" value={form.endTime} onChange={set('endTime')} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Type</label>
            <select value={form.type} onChange={set('type')} className={inputCls}>
              {EVENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Conflict warning */}
          {conflict && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                <span className="font-semibold">Time slot already taken.</span>{' '}
                <span className="font-medium">"{conflict.title}"</span> is scheduled{' '}
                {fmt12(conflict.startTime)}–{fmt12(conflict.endTime)} on this day.
                Click <span className="font-semibold">Save Anyway</span> to add both.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.title.trim()}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-40 ${
              conflict ? 'bg-amber-500 hover:bg-amber-600' : 'bg-violet-600 hover:bg-violet-700'
            }`}
          >
            {conflict ? 'Save Anyway' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
