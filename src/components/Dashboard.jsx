import { Bell, Flame, ChevronRight } from 'lucide-react';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const weekDates = [20, 21, 22, 23, 24, 25, 26];
const todayIndex = 1; // Tuesday

// dot type: 'study' | 'review' | 'exam' | 'rest'
const weekActivity = ['study', 'study', 'review', 'review', 'exam', 'exam', 'rest'];

const dotColors = {
  study: 'bg-blue-400',
  review: 'bg-green-400',
  exam: 'bg-orange-400',
  rest: 'bg-gray-300',
};

function CircularProgress({ percent }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#ede9fe" strokeWidth="10" />
        <circle
          cx="64" cy="64" r={r}
          fill="none"
          stroke="#7c3aed"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-gray-800">{percent}%</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Good morning, Jane! 👋</h1>
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
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400 mb-0.5">10:00 AM – 12:00 PM</p>
              <p className="text-sm font-semibold text-gray-800">Azure Fundamentals</p>
              <p className="text-xs text-gray-400 mt-0.5">Cloud Concepts</p>
            </div>
          </div>
          <button className="mt-3 text-xs text-violet-600 font-medium flex items-center gap-0.5 hover:gap-1.5 transition-all">
            View all <ChevronRight size={12} />
          </button>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex flex-col items-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 self-start">Progress</p>
          <CircularProgress percent={35} />
          <p className="text-xs font-semibold text-gray-700 mt-1">Overall Progress</p>
          <p className="text-xs text-gray-400 mt-0.5">14 of 40 study hours completed</p>
        </div>
      </div>

      {/* Next Exam */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Next Exam</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">AZ-900: Microsoft Azure Fundamentals</p>
            <p className="text-xs text-gray-400 mt-0.5">June 20, 2024</p>
          </div>
          <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-full">
            30 days left
          </span>
        </div>
      </div>

      {/* Weekly Overview */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Weekly Overview</p>
          <p className="text-xs text-gray-400">May 20 – 26</p>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, i) => {
            const isToday = i === todayIndex;
            return (
              <div key={day} className="flex flex-col items-center gap-1.5">
                <span className="text-xs text-gray-400">{day}</span>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    isToday
                      ? 'bg-violet-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {weekDates[i]}
                </div>
                <div className={`w-2 h-2 rounded-full ${dotColors[weekActivity[i]]}`} />
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3 pt-3 border-t border-gray-50">
          {[
            { label: 'Study', color: 'bg-blue-400' },
            { label: 'Review', color: 'bg-green-400' },
            { label: 'Practice Exam', color: 'bg-orange-400' },
            { label: 'Rest', color: 'bg-gray-300' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-xs text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day Streak */}
      <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-50 w-fit">
        <Flame size={18} className="text-orange-500" />
        <span className="text-sm font-bold text-gray-800">7</span>
        <span className="text-sm text-gray-400">Day Streak</span>
      </div>
    </div>
  );
}
