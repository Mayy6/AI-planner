# AI Study Planner — Handoff Document

## Project Overview

A full-stack React + Express web app that lets users sign up / log in (email/password or Google/GitHub OAuth via Supabase), manage study events on a calendar, and generate AI-powered study plans through a conversational chatbot (OpenAI GPT-4o-mini). The OpenAI key lives server-side only — it is never exposed to the browser.

**Working directory:** `/Users/yuer/Desktop/AI-planner`
**Start dev server:** `npm run dev` → frontend at http://localhost:5173, backend at http://localhost:3001

---

## Tech Stack

| Layer | Library / Service |
|---|---|
| UI framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v3 |
| Auth + OAuth | Supabase (`@supabase/supabase-js` v2) — email/password + Google/GitHub |
| Database | Supabase PostgreSQL (`conversations`, `messages` tables) |
| AI backend | Express.js (Node, ES modules) + OpenAI SDK v6 (`gpt-4o-mini`) |
| Dev runner | `concurrently` — runs Vite + Express together |
| Icons | lucide-react |
| Local event storage | localStorage (per-user, keyed by `user.id`) |

---

## Environment Variables (`.env` at project root — gitignored)

```
# Supabase (frontend + backend)
VITE_SUPABASE_URL=https://xhkogtnznzgihiivofhh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...          # public anon key, safe in browser

# Backend only — never expose to frontend
SUPABASE_URL=https://xhkogtnznzgihiivofhh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # service role key, server-side only
OPENAI_API_KEY=sk-proj-...             # server-side only (was VITE_OPENAI_API_KEY before)
PORT=3001
```

> **Note:** `VITE_OPENAI_API_KEY` has been removed. The key must NOT be prefixed with `VITE_` — that would expose it in the browser bundle.

---

## File Structure

```
AI-planner/
├── package.json                   # Root scripts: dev, dev:client, dev:server
├── vite.config.js                 # Vite proxy: /api/* → localhost:3001
├── .env                           # Secrets (gitignored)
│
├── server/                        # Express backend
│   ├── package.json               # type: module, deps: express/cors/dotenv/openai/@supabase
│   ├── index.js                   # Entry: mounts /api/chat, /api/health; EADDRINUSE handling
│   ├── middleware/
│   │   └── auth.js                # Verifies Supabase JWT; allows unauthenticated (demo) through
│   └── routes/
│       └── chat.js                # POST /api/chat — calls OpenAI, returns { content: string }
│
└── src/
    ├── App.jsx                    # Root — auth routing + demo mode
    ├── context/
    │   └── AuthContext.jsx        # Supabase auth (signInWithEmail, signUpWithEmail, signIn OAuth, signOut)
    ├── lib/
    │   ├── supabase.js            # Supabase client; exports isConfigured flag
    │   └── api.js                 # chatCompletion() — POSTs to /api/chat with auth header
    ├── hooks/
    │   ├── useEvents.js           # CRUD for calendar events in localStorage
    │   ├── useConversations.js    # Chat history: Supabase for real users, localStorage for demo
    │   └── useStreak.js           # Day-streak counter in localStorage
    └── components/
        ├── Login.jsx              # Email/password tabs + Google/GitHub OAuth + demo bypass
        ├── Sidebar.jsx            # Fixed left nav; shows user avatar + sign out
        ├── Dashboard.jsx          # Home: upcoming event, progress, weekly overview, streak
        ├── Calendar.jsx           # Week + Month views; click-to-open AddEventModal
        ├── AddEventModal.jsx      # Form to create event; inline conflict warning, two-click save
        └── Chats.jsx              # AI chatbot: sidebar history + chat + review plan + accept
```

---

## Key Architecture Decisions

### Auth & Demo Mode (`App.jsx`)

- If Supabase is configured and user is logged in → `<AppShell>`
- If not logged in → `<Login>` with email/password tabs + Google/GitHub buttons
- Demo mode: clicking "Continue in demo mode →" injects a fake user into `AuthContext.Provider`:

```jsx
const DEMO_USER = {
  id: 'demo-user',
  email: 'demo@aiplanner.app',
  user_metadata: { name: 'Demo User', full_name: 'Demo User' },
};
```

Demo mode bypasses all Supabase DB calls — `useConversations` and `useEvents` fall back to localStorage automatically.

### Email Auth (`Login.jsx` + `AuthContext.jsx`)

- Tab toggle: "Sign in" / "Create account"
- `signInWithEmail(email, password)` → `supabase.auth.signInWithPassword()`
- `signUpWithEmail(email, password)` → `supabase.auth.signUp()`
- If signup returns no session: shows "Check your email to confirm your account"
- Error handling: invalid credentials, unconfirmed email, already registered
- **Supabase setup note:** Disable "Confirm email" in Supabase → Authentication → Settings if email delivery is unreliable. Set Site URL to `http://localhost:5173`.

### API Security (`server/` + `src/lib/api.js`)

The OpenAI key never reaches the browser:

1. `src/lib/api.js` gets the Supabase session JWT and POSTs to `/api/chat`
2. Vite proxy forwards `/api/*` to `localhost:3001`
3. `server/middleware/auth.js` verifies the JWT via Supabase admin client
4. `server/routes/chat.js` calls OpenAI and returns `{ content: string }`

Demo users (no JWT) are allowed through with `req.user = null` — the system prompt is still served.

### Chat History (`useConversations.js`)

```
isDemo = !supabase || user?.id === 'demo-user'
```

| Mode | Conversations | Messages |
|---|---|---|
| Demo | `localStorage: demo_conversations` | `localStorage: demo_msgs_{id}` |
| Real user | Supabase `conversations` table | Supabase `messages` table |

**Supabase tables required** (run this SQL in Supabase SQL Editor if not already done):

```sql
create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  plan jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz default now()
);

alter table conversations enable row level security;
alter table messages enable row level security;

create policy "Users own conversations" on conversations
  for all using (auth.uid() = user_id);

create policy "Users own messages" on messages
  for all using (
    conversation_id in (
      select id from conversations where user_id = auth.uid()
    )
  );
```

### Event Storage (`useEvents.js`)

Events stored as `events_{userId}` in localStorage. Shape of each event:
```js
{
  id: crypto.randomUUID(),      // auto-assigned
  title: "Azure Core Services",
  date: "2026-05-26",           // YYYY-MM-DD local time (NOT toISOString!)
  startTime: "09:00",
  endTime: "11:00",
  type: "study",                // "study" | "review" | "exam" | "break"
  conversationId: "uuid"        // set when saved from a chat plan; undefined for manual events
}
```

Key functions:
- `addEvent(event)` — adds one event (use only for manual adds)
- `addEvents(list)` — adds many atomically (avoids stale-closure bug)
- `replaceEventsByConversation(conversationId, newList)` — atomically removes all events tagged with `conversationId` then adds the new list; used when re-accepting a regenerated plan to prevent calendar duplication
- `checkConflicts(candidates, excludeConvId?)` — returns array of `{ candidate, conflictsWith[] }` for any time overlaps; pass `excludeConvId` to ignore events from the current conversation (which will be replaced anyway)
- `removeEvent(id)` — removes one event by id

**Critical**: Use `addEvents(list)` not `addEvent` in a loop to avoid React stale-closure bug.

### Date Formatting — CRITICAL Timezone Fix

**Never use `toISOString()`** for local dates — it converts local midnight to the previous UTC day in UTC+8 and other UTC+ timezones. Always use:
```js
function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
```
This pattern appears in `Calendar.jsx`, `Dashboard.jsx`, `AddEventModal.jsx`, and `Chats.jsx`.

### Calendar (`Calendar.jsx`)

- `START_HOUR = 0`, `END_HOUR = 24`, `HOUR_HEIGHT = 60` (full 24-hour day)
- Clicking a time slot calculates hour from `(e.clientY - rect.top) / HOUR_HEIGHT`, snaps to :00 or :30
- Passes `defaultDate`, `defaultStartTime`, `defaultEndTime` to `AddEventModal`
- Passes `existingEvents={events}` to `AddEventModal` for conflict detection
- Week and Month views, Today/Prev/Next navigation
- Clicking an event in Month view deletes it; hover → trash icon in Week view

### Time Conflict Detection

**AddEventModal** (manual event adds):
- Receives `existingEvents` prop
- `findConflict(form)` — checks for time overlap on same date
- Two-click save: first click shows amber warning identifying the conflicting event; second click ("Save Anyway") saves regardless

**Chats.jsx** (AI plan accept):
- `handleAccept` calls `checkConflicts(plan.schedule, activeConvId)` before saving
- If conflicts found: sets `planConflicts` state → `PlanReview` renders amber conflict banner listing up to 3 conflicts
- "Go Back" dismisses and lets user regenerate; "Accept Anyway" calls `doAccept()` directly
- `doAccept()` calls `replaceEventsByConversation` (tagged with `conversationId`) if there's an active conversation, otherwise `addEvents`

### AI Chatbot (`Chats.jsx`)

**Layout:** Two-panel — conversations sidebar (w-64, with new chat button + history list) + main chat area.

**Three phases:** `'chat'` → `'review'` → `'accepted'`

1. **Chat phase**: Conversational Q&A (subject, exam date, weekday hours, weekend hours). First message creates a conversation; title auto-updates after the AI's first reply. All messages persisted via `addMessage`.
2. **Review phase**: AI returns JSON wrapped in `<PLAN_START>...<PLAN_END>`. Parsed and shown as a rich plan card with summary stats, topic breakdown, schedule preview, Accept/Regenerate/conflict warning.
3. **Accepted phase**: Events saved to calendar atomically, shows confirmation, button navigates to Calendar.

Plan JSON structure:
```json
{
  "summary": { "totalStudyHours": 84, "dailyAverage": 2.1, "topicsCount": 7, "practiceExams": 6 },
  "topics": [{ "name": "Topic Name", "hours": 10 }],
  "schedule": [{ "date": "2026-05-26", "title": "Session", "startTime": "09:00", "endTime": "11:00", "type": "study" }],
  "tip": "Study 2.1 hrs/day to finish comfortably."
}
```

Selecting a past conversation in the sidebar restores its messages, plan, and phase.

---

## Sidebar Navigation

| Label | ID | Status |
|---|---|---|
| Dashboard | `dashboard` | ✅ Built |
| Calendar | `calendar` | ✅ Built |
| Plans | `plans` | ❌ Coming soon |
| Progress | `progress` | ❌ Coming soon |
| Chats | `chats` | ✅ Built |
| Settings | `settings` | ❌ Coming soon |

---

## What's Been Built

- [x] Login page — email/password (sign in + sign up) + Google/GitHub OAuth + demo mode
- [x] Dashboard — real-time greeting, upcoming event, next exam countdown, weekly overview dots, circular progress, day streak
- [x] Calendar — Week view (24h, click-to-add, hover-to-delete) + Month view
- [x] Add Event modal — dynamic start/end times from click position + inline conflict warning
- [x] AI Chatbot — conversational plan generation, plan review UI, conflict detection, bulk-save to calendar
- [x] Chat history sidebar — persisted in Supabase (real users) or localStorage (demo)
- [x] Plan deduplication — re-accepting a regenerated plan replaces old calendar events, no duplicates
- [x] Time conflict detection — both manual event adds and AI plan accepts
- [x] Full-stack backend — OpenAI key secured server-side, JWT-verified API route
- [x] Multi-user support — each user's data isolated by `user.id`

## What's NOT Built Yet

- [ ] Plans page (view/manage saved study plans)
- [ ] Progress page (study hours tracked, streaks, charts)
- [ ] Settings page (preferences, notifications)
- [ ] Event edit on calendar (clicking opens detail/edit; currently delete-only)
- [ ] Push notifications / reminders

---

## Known Bugs / Gotchas

1. **Stale closure** — Always use `addEvents(list)` not `addEvent` in a loop. The `addEvent` hook captures a stale `events` snapshot per render.
2. **UTC timezone** — Never use `date.toISOString().split('T')[0]`. Use the `toDateStr()` helper.
3. **Port conflict** — If `npm run dev` fails with `EADDRINUSE 3001`, run `lsof -ti:3001 | xargs kill -9` then retry.
4. **Missing Supabase tables** — If chat history doesn't save for real users, run the SQL schema above. `useConversations.js` logs `[DB] createConversation failed` + a hint to the console when this happens.
5. **Demo mode sign-out** — "Sign out" in demo mode calls `setDemoMode(false)` in `App.jsx`, not Supabase. There is no sign-out button shown when Supabase is not configured.
6. **Supabase email confirm** — Free tier email delivery is unreliable. Disable "Confirm email" in Supabase → Authentication → Settings for local dev.

---

## How to Continue in a New Chat

Paste this into the new chat to get up to speed instantly:

> "I'm continuing work on an AI Study Planner app at `/Users/yuer/Desktop/AI-planner`. It's a full-stack app: React + Vite + Tailwind frontend, Express.js backend (port 3001), Supabase auth + PostgreSQL, OpenAI GPT-4o-mini (server-side only). Run with `npm run dev`. The Dashboard, Calendar, and Chats pages are fully built — including email/password auth, chat history sidebar (Supabase), AI plan deduplication, and time conflict detection. Plans, Progress, and Settings show 'Coming soon'. Full architecture details are in HANDOFF.md at the project root."
