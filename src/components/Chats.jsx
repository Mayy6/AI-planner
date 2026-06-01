import { useState, useRef, useEffect } from 'react';
import {
  Send, RotateCcw, CheckCircle, BookOpen, Sparkles,
  Calendar, Plus, Trash2, MessageSquare, AlertTriangle,
} from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { useConversations } from '../hooks/useConversations';
import { chatCompletion } from '../lib/api';

const WELCOME_MSG = {
  role: 'assistant',
  content: "Hi! I'm your AI Study Assistant. 👋\n\nI'll help you create a personalized study schedule. What would you like to study or prepare for?",
};

const QUICK_REPLIES_REGENERATE = [
  'Too intensive',
  'Not enough time on weekends',
  'I have other commitments',
  'Need more practice exams',
];

const TYPE_STYLE = {
  study:  { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  review: { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  exam:   { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  break:  { bg: 'bg-gray-100',   text: 'text-gray-500',   dot: 'bg-gray-400'   },
};

// ── message bubble ───────────────────────────────────────────────────────────
function Bubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <BookOpen size={14} className="text-violet-600" />
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-violet-600 text-white rounded-tr-sm'
            : 'bg-gray-100 text-gray-800 rounded-tl-sm'
        }`}
      >
        {content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
        <BookOpen size={14} className="text-violet-600" />
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── plan review ──────────────────────────────────────────────────────────────
function PlanReview({ plan, lastMessage, conflicts = [], onAccept, onAcceptAnyway, onDismissConflicts, onRegenerate }) {
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [customReason, setCustomReason] = useState('');
  const maxHours = Math.max(...(plan.topics?.map(t => t.hours) || [1]));

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle size={18} className="text-green-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-800">Here's your personalized study plan!</h2>
          {lastMessage && <p className="text-sm text-gray-400 mt-0.5">{lastMessage}</p>}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Study Summary</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Study Hours', value: `${plan.summary?.totalStudyHours ?? '—'} hrs` },
            { label: 'Daily Average',     value: `${plan.summary?.dailyAverage ?? '—'} hrs/day` },
            { label: 'Topics to Cover',   value: plan.summary?.topicsCount ?? '—' },
            { label: 'Practice Exams',    value: plan.summary?.practiceExams ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-800">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {plan.topics?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Topic Breakdown</p>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {plan.topics.map((topic, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                <div className="w-2.5 h-2.5 rounded-full bg-violet-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 flex-1">{topic.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-400 rounded-full" style={{ width: `${(topic.hours / maxHours) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 w-10 text-right">{topic.hours}h</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {plan.tip && (
        <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 text-sm text-violet-700">
          {plan.tip}
        </div>
      )}

      {plan.schedule?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Schedule Preview{' '}
            <span className="text-gray-300 font-normal normal-case">
              · first {Math.min(plan.schedule.length, 7)} of {plan.schedule.length} sessions
            </span>
          </p>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {plan.schedule.slice(0, 7).map((s, i) => {
              const st = TYPE_STYLE[s.type] || TYPE_STYLE.study;
              const d = new Date(s.date + 'T00:00:00');
              const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              return (
                <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                  <span className="text-xs text-gray-400 w-24 flex-shrink-0">{dayLabel}</span>
                  <div className={`w-2 h-2 rounded-full ${st.dot} flex-shrink-0`} />
                  <span className="text-sm text-gray-700 flex-1 truncate">{s.title}</span>
                  <span className="text-xs text-gray-400">{s.startTime}–{s.endTime}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3 pb-2">
        {/* Conflict warning banner */}
        {conflicts.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-amber-800">
                {conflicts.length} session{conflicts.length > 1 ? 's' : ''} overlap with your existing calendar
              </p>
            </div>
            <ul className="text-xs text-amber-700 space-y-1 pl-6 list-disc">
              {conflicts.slice(0, 3).map((c, i) => (
                <li key={i}>
                  <span className="font-medium">{c.candidate.title}</span> on {c.candidate.date} ({c.candidate.startTime}–{c.candidate.endTime})
                  {' '}clashes with <span className="font-medium">"{c.conflictsWith[0].title}"</span>
                </li>
              ))}
              {conflicts.length > 3 && <li>…and {conflicts.length - 3} more</li>}
            </ul>
            <div className="flex gap-2 pt-1">
              <button
                onClick={onDismissConflicts}
                className="flex-1 px-3 py-2 border border-amber-300 rounded-lg text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={onAcceptAnyway}
                className="flex-1 px-3 py-2 bg-amber-500 rounded-lg text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
              >
                Accept Anyway
              </button>
            </div>
          </div>
        )}

        {!showQuickReplies ? (
          <div className="flex gap-3">
            <button
              onClick={() => setShowQuickReplies(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw size={15} /> Regenerate Plan
            </button>
            <button
              onClick={onAccept}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 rounded-xl text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
            >
              <CheckCircle size={15} /> Accept Plan
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 text-center">What would you like to change?</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_REPLIES_REGENERATE.map(r => (
                <button
                  key={r}
                  onClick={() => onRegenerate(r)}
                  className="px-3 py-1.5 border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-1">
              <input
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && customReason.trim() && onRegenerate(customReason)}
                placeholder="Other (tell me more)..."
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              <button
                onClick={() => customReason.trim() && onRegenerate(customReason)}
                className="px-3 py-2 bg-violet-600 rounded-xl text-white hover:bg-violet-700 transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
            <button onClick={() => setShowQuickReplies(false)} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── accepted screen ──────────────────────────────────────────────────────────
function AcceptedScreen({ plan, onGoToCalendar }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="text-5xl mb-4">🎉</div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Plan accepted!</h2>
      <p className="text-sm text-gray-400 mb-6">Your study schedule has been added to your calendar.</p>
      <div className="bg-gray-50 rounded-xl px-5 py-4 mb-6 w-full max-w-xs space-y-2 text-left">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CheckCircle size={14} className="text-green-500" />
          {plan.schedule?.length ?? 0} sessions added to calendar
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CheckCircle size={14} className="text-green-500" />
          Daily reminders will keep you on track
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CheckCircle size={14} className="text-green-500" />
          You can always adjust your plan
        </div>
      </div>
      <button
        onClick={onGoToCalendar}
        className="flex items-center gap-2 px-5 py-3 bg-violet-600 rounded-xl text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
      >
        <Calendar size={15} /> Go to Calendar
      </button>
    </div>
  );
}

// ── conversation list item ───────────────────────────────────────────────────
function convDateLabel(iso) {
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ConvItem({ conv, isActive, onSelect, onDelete }) {
  return (
    <button
      onClick={() => onSelect(conv)}
      className={`group w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors ${
        isActive ? 'bg-violet-50' : 'hover:bg-gray-50'
      }`}
    >
      <MessageSquare
        size={14}
        className={`mt-0.5 flex-shrink-0 ${isActive ? 'text-violet-500' : 'text-gray-400'}`}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${isActive ? 'text-violet-700 font-medium' : 'text-gray-700'}`}>
          {conv.title}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{convDateLabel(conv.updated_at || conv.created_at)}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
        className="opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5 text-gray-400 hover:text-red-500 transition-all"
        aria-label="Delete conversation"
      >
        <Trash2 size={13} />
      </button>
    </button>
  );
}

// ── main component ───────────────────────────────────────────────────────────
export default function Chats({ onNavigate }) {
  const { addEvents, replaceEventsByConversation, checkConflicts } = useEvents();
  const {
    conversations,
    createConversation,
    loadMessages,
    addMessage,
    updateTitle,
    savePlan,
    deleteConversation,
  } = useConversations();

  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [convLoading, setConvLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [planMessage, setPlanMessage] = useState('');
  const [phase, setPhase] = useState('chat');
  const [planConflicts, setPlanConflicts] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, phase]);

  const selectConversation = async (conv) => {
    if (conv.id === activeConvId) return;
    setConvLoading(true);
    setActiveConvId(conv.id);
    setInput('');
    const msgs = await loadMessages(conv.id);
    setMessages(msgs.length > 0 ? msgs.map(m => ({ role: m.role, content: m.content })) : [WELCOME_MSG]);
    if (conv.plan) {
      setPlan(conv.plan);
      setPlanMessage('');
      setPhase('review');
    } else {
      setPlan(null);
      setPhase('chat');
    }
    setConvLoading(false);
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([WELCOME_MSG]);
    setPlan(null);
    setPlanMessage('');
    setPhase('chat');
    setInput('');
  };

  const handleDeleteConversation = async (id) => {
    await deleteConversation(id);
    if (id === activeConvId) handleNewChat();
  };

  const sendMessage = async (text, existingMessages) => {
    const userText = text.trim();
    if (!userText) return;

    const history = existingMessages ?? messages;
    const newMessages = [...history, { role: 'user', content: userText }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setPhase('chat');

    // Create conversation on first message, or update title if first real message
    let convId = activeConvId;
    if (!convId) {
      const title = userText.length > 60 ? userText.slice(0, 60) + '…' : userText;
      const conv = await createConversation(title);
      if (conv) { convId = conv.id; setActiveConvId(convId); }
    } else if (history.length === 1 && history[0]?.content === WELCOME_MSG.content) {
      const title = userText.length > 60 ? userText.slice(0, 60) + '…' : userText;
      await updateTitle(convId, title);
    }

    if (convId) await addMessage(convId, 'user', userText);

    try {
      const { content: aiContent } = await chatCompletion(newMessages);
      const planMatch = aiContent.match(/<PLAN_START>([\s\S]*?)<\/PLAN_END>/);

      if (planMatch) {
        try {
          const parsed = JSON.parse(planMatch[1].trim());
          const cleanMsg = aiContent.replace(/<PLAN_START>[\s\S]*?<\/PLAN_END>/, '').trim();
          const displayMsg = cleanMsg || "Here's your personalized plan!";
          setMessages([...newMessages, { role: 'assistant', content: displayMsg }]);
          if (convId) {
            await addMessage(convId, 'assistant', displayMsg);
            await savePlan(convId, parsed);
          }
          setPlan(parsed);
          setPlanMessage(cleanMsg);
          setPhase('review');
        } catch {
          setMessages([...newMessages, { role: 'assistant', content: aiContent }]);
          if (convId) await addMessage(convId, 'assistant', aiContent);
        }
      } else {
        setMessages([...newMessages, { role: 'assistant', content: aiContent }]);
        if (convId) await addMessage(convId, 'assistant', aiContent);
      }
    } catch (err) {
      console.error('[Chat] sendMessage error:', err);
      const errMsg = err?.message?.includes('Server error') || err?.message?.includes('AI service')
        ? err.message
        : 'Sorry, something went wrong. Is the backend server running? (`npm run dev:server`)';
      setMessages([...newMessages, { role: 'assistant', content: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const doAccept = () => {
    setPlanConflicts([]);
    if (activeConvId) {
      replaceEventsByConversation(activeConvId, plan.schedule);
    } else {
      addEvents(plan.schedule);
    }
    setPhase('accepted');
  };

  const handleAccept = () => {
    if (!plan?.schedule) return;
    // Exclude this conversation's own events (they'll be replaced, not duplicated)
    const conflicts = checkConflicts(plan.schedule, activeConvId);
    if (conflicts.length > 0) {
      setPlanConflicts(conflicts); // show warning in PlanReview
    } else {
      doAccept();
    }
  };

  const handleRegenerate = (reason) => {
    sendMessage(`I'd like to adjust the plan: ${reason}. Please regenerate it.`);
  };

  return (
    <div className="flex h-screen max-h-screen -m-8 overflow-hidden">

      {/* ── Conversations sidebar ─────────────────────────────────────────── */}
      <div className="w-64 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-3 border-b border-gray-100">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 rounded-xl text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
          >
            <Plus size={15} /> New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <p className="text-xs text-gray-400 text-center mt-8 px-4 leading-relaxed">
              No conversations yet.<br />Start a new chat!
            </p>
          ) : (
            <div className="space-y-0.5">
              {conversations.map(conv => (
                <ConvItem
                  key={conv.id}
                  conv={conv}
                  isActive={conv.id === activeConvId}
                  onSelect={selectConversation}
                  onDelete={handleDeleteConversation}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Main chat area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-gray-100 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
            <Sparkles size={15} className="text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">AI Study Assistant</p>
            <p className="text-xs text-gray-400">Let's create your perfect study plan.</p>
          </div>
        </div>

        {/* Body */}
        {convLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : phase === 'accepted' ? (
          <AcceptedScreen plan={plan} onGoToCalendar={() => onNavigate('calendar')} />
        ) : phase === 'review' ? (
          <PlanReview
            plan={plan}
            lastMessage={planMessage}
            conflicts={planConflicts}
            onAccept={handleAccept}
            onAcceptAnyway={doAccept}
            onDismissConflicts={() => setPlanConflicts([])}
            onRegenerate={handleRegenerate}
          />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {messages.map((m, i) => <Bubble key={i} role={m.role} content={m.content} />)}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            <div className="px-6 py-4 bg-white border-t border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-2.5 border border-gray-200 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                  placeholder="Type your answer..."
                  className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
                  disabled={loading}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-white hover:bg-violet-700 transition-colors disabled:opacity-40 flex-shrink-0"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
