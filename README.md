# 🎓 AI Study Planner

A full-stack AI-powered study planning web application. Chat with an AI assistant to generate a personalised study schedule, manage it on an interactive calendar, and track your progress — all in one place.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38BDF8?logo=tailwindcss&logoColor=white&style=flat-square)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white&style=flat-square)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white&style=flat-square)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai&logoColor=white&style=flat-square)

---

## ✨ Features

### 🤖 AI Chat & Study Plan Generation
- Conversational AI assistant that asks about your subject, exam date, and available study hours
- Generates a fully structured study schedule with sessions spread across your available days
- Returns a rich plan preview with summary stats, topic breakdown, and a scrollable schedule
- Accept or regenerate the plan before committing it to your calendar
- **Conflict detection** — warns you if the proposed plan overlaps with existing events
- **Deduplication** — re-accepting a regenerated plan replaces the old calendar events rather than stacking them

### 📅 Interactive Calendar
- **Week view** — 24-hour time grid with click-to-add slot selection (snaps to :00/:30)
- **Month view** — compact pill-style events with overflow handling
- Colour-coded event types: Study (blue), Review (green), Practice Exam (orange), Break (grey)
- **Mark tasks complete** — tick any session directly on the calendar; visual strikethrough + fade
- Delete events on hover (week view) or via the × button (month view)
- Navigate with Today / Prev / Next; toggle between Week and Month views

### 📋 Plans Page
- One card per upcoming exam, sorted by nearest date first
- Horizontal progress bar showing completed vs total sessions
- Colour-coded days-left badge (violet → amber → red as the exam approaches)
- Collapsible session list grouped by date, with today highlighted
- Mark sessions complete directly from Plans — syncs instantly with Calendar and Dashboard

### 📊 Dashboard
- Real-time greeting based on time of day
- **Upcoming Today** — next unfinished session with time and type
- **Progress circle** — real completion % based on ticked-off tasks in the next exam's plan
- **Next Exam** countdown in days
- **Weekly Overview** — 7-day dot grid showing which days have sessions
- **Day Streak** counter

### 🔐 Authentication
- Email / password sign-up and sign-in
- Google and GitHub OAuth (via Supabase)
- Demo mode — try the full app without an account
- Per-user data isolation (each user's events stored under their own key)

### 💬 Chat History
- Conversation sidebar with all past chats
- Resuming a past conversation restores the full message history, plan, and phase
- Auto-generated conversation titles based on the first AI reply
- Delete individual conversations

### ⚙️ Settings
- **Dark / Light mode** — instant full-app theme switch
- **Language** — English / 中文 (Chinese Simplified)
- **Time format** — 12-hour / 24-hour
- **Week starts on** — Monday / Sunday
- Notification preference toggles (push delivery coming soon)
- Account info and sign-out

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                      Browser                         │
│       React 19 + Vite + Tailwind CSS                │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  Supabase   │  │  /api/* →    │  │localStorage│ │
│  │  JS client  │  │  Vite proxy  │  │ (events,   │ │
│  │  (auth +    │  │              │  │  settings) │ │
│  │   chat DB)  │  └──────┬───────┘  └────────────┘ │
│  └──────┬──────┘         │                          │
└─────────┼────────────────┼──────────────────────────┘
          │                │ Vite proxy (:5173 → :3001)
          │                ▼
          │     ┌────────────────────────┐
          │     │   Express.js Server    │  Node.js · port 3001
          │     │                        │
          │     │  POST /api/chat        │──► JWT verify
          │     │  GET  /api/health      │──► OpenAI GPT-4o-mini
          │     └────────────────────────┘
          │
          ▼
┌────────────────────────┐
│       Supabase         │
│       PostgreSQL       │
│  ├── conversations     │
│  ├── messages          │
│  └── auth.users        │
└────────────────────────┘
```

**Key security decision:** The OpenAI API key lives exclusively on the Express server and is never shipped to the browser. Requests from the frontend include a Supabase JWT which the server verifies before calling OpenAI.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v3 (dark mode via `class` strategy) |
| Icons | lucide-react |
| Authentication | Supabase Auth (email/password + Google/GitHub OAuth) |
| Database | Supabase PostgreSQL (`conversations` + `messages` tables) |
| Local storage | `localStorage` (calendar events, user settings) |
| Backend | Express.js 4 (Node.js, ES modules) |
| AI | OpenAI SDK v6 — `gpt-4o-mini` |
| Dev runner | `concurrently` (Vite + Express in one terminal) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is enough)
- An [OpenAI API key](https://platform.openai.com/api-keys)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ai-planner.git
cd ai-planner
```

### 2. Install dependencies

```bash
# Frontend dependencies (root)
npm install

# Backend dependencies
cd server && npm install && cd ..
```

### 3. Configure environment variables

Create a `.env` file in the **project root**:

```env
# ── Supabase (frontend — safe to prefix with VITE_) ──────
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...          # Settings → API → anon public key

# ── Supabase (backend — server-side only) ────────────────
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # Settings → API → service_role key

# ── OpenAI (NEVER prefix with VITE_ — would expose in bundle) ──
OPENAI_API_KEY=sk-proj-...

# ── Server ───────────────────────────────────────────────
PORT=3001
```

> ⚠️ **Never** prefix `OPENAI_API_KEY` with `VITE_`. Doing so would expose your secret key in the browser JavaScript bundle.

### 4. Create the Supabase database tables

Open your Supabase project → **SQL Editor** → paste and run:

```sql
-- Conversations
CREATE TABLE conversations (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text        NOT NULL DEFAULT 'New conversation',
  plan       jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Messages
CREATE TABLE messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        REFERENCES conversations(id) ON DELETE CASCADE,
  role            text        NOT NULL,  -- 'user' | 'assistant'
  content         text        NOT NULL,
  created_at      timestamptz DEFAULT now()
);

-- Row Level Security — users can only access their own data
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own conversations" ON conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own messages" ON messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );
```

### 5. Configure Supabase Auth

In your Supabase dashboard:

1. **Authentication → Settings**
   - Set **Site URL** to `http://localhost:5173`
   - For local development, consider disabling **Confirm email** (free-tier email delivery can be unreliable)

2. **Authentication → Providers** — enable Google and/or GitHub if you want OAuth (both are optional)

### 6. Start the app

```bash
npm run dev
```

This single command starts both servers concurrently:

| Service | URL |
|---|---|
| React frontend | `http://localhost:5173` |
| Express backend | `http://localhost:3001` |
| Health check | `http://localhost:3001/api/health` |

> **Port conflict?** If you see `EADDRINUSE 3001`, run `lsof -ti:3001 | xargs kill -9` then retry.

---

## 📁 Project Structure

```
ai-planner/
│
├── .env                          # Environment secrets (gitignored)
├── package.json                  # Root scripts + frontend dependencies
├── vite.config.js                # Vite config — /api/* proxy to :3001
├── tailwind.config.js            # Tailwind — darkMode: 'class'
│
├── server/                       # Express.js backend
│   ├── package.json              # Server dependencies
│   ├── index.js                  # Server entry point (port 3001)
│   ├── middleware/
│   │   └── auth.js               # Supabase JWT verification middleware
│   └── routes/
│       └── chat.js               # POST /api/chat → OpenAI
│
└── src/                          # React frontend
    ├── main.jsx                  # React entry point
    ├── App.jsx                   # Root router + demo mode + providers
    ├── index.css                 # Global styles + dark mode overrides
    │
    ├── context/
    │   ├── AuthContext.jsx       # Supabase auth state (user, signIn, signOut)
    │   └── SettingsContext.jsx   # Theme, language, time format, preferences
    │
    ├── lib/
    │   ├── supabase.js           # Supabase client + isConfigured flag
    │   ├── api.js                # chatCompletion() — authenticated fetch to /api/chat
    │   └── i18n.js               # English / Chinese translation strings
    │
    ├── hooks/
    │   ├── useEvents.js          # Calendar event CRUD (localStorage)
    │   ├── useConversations.js   # Chat history (Supabase or localStorage fallback)
    │   └── useStreak.js          # Day streak counter (localStorage)
    │
    └── components/
        ├── Login.jsx             # Email/password + OAuth + demo mode
        ├── Sidebar.jsx           # Fixed left nav (translated labels)
        ├── Dashboard.jsx         # Home: upcoming, progress, next exam, streak
        ├── Calendar.jsx          # Week + Month views, complete/delete events
        ├── AddEventModal.jsx     # Add event form with time conflict detection
        ├── Plans.jsx             # Exam plan cards with session checklists
        ├── Chats.jsx             # AI chat + conversation history sidebar
        └── Settings.jsx          # Theme, language, preferences, account
```

---

## 🔌 API Reference

### `POST /api/chat`

Sends a conversation to GPT-4o-mini and returns the assistant's reply.

**Headers**

| Header | Required | Value |
|---|---|---|
| `Content-Type` | Yes | `application/json` |
| `Authorization` | No | `Bearer <supabase_access_token>` |

The `Authorization` header is optional — unauthenticated requests (demo mode) are allowed through. Authenticated requests are verified against Supabase's `auth.users`.

**Request body**

```json
{
  "messages": [
    { "role": "user",      "content": "I need to study for the Azure AZ-900 exam" },
    { "role": "assistant", "content": "Great! When is your exam date?" },
    { "role": "user",      "content": "June 30th" }
  ],
  "today": "2026-06-01"
}
```

**Success response `200`**

```json
{
  "content": "How many hours can you study on weekdays and weekends? ..."
}
```

**Plan response**

When the AI has collected enough information, `content` contains a plan wrapped in special tags:

```
<PLAN_START>
{
  "summary": {
    "totalStudyHours": 84,
    "dailyAverage": 2.1,
    "topicsCount": 7,
    "practiceExams": 6
  },
  "topics": [
    { "name": "Azure Core Concepts", "hours": 12 },
    { "name": "Cloud Services",      "hours": 10 }
  ],
  "schedule": [
    {
      "date":      "2026-06-02",
      "title":     "Azure Core Concepts",
      "startTime": "09:00",
      "endTime":   "11:00",
      "type":      "study"
    }
  ],
  "tip": "Study 2.1 hours/day to finish comfortably before your exam."
}
<PLAN_END>
```

The frontend strips the tags, parses the JSON, and renders the plan review UI.

**Error responses**

| Status | Meaning |
|---|---|
| `400` | Missing or invalid `messages` array |
| `401` | Provided token is invalid or expired |
| `500` | OpenAI call failed |

---

## 🗃️ Data Models

### Calendar Event (stored in `localStorage` as `events_{userId}`)

```typescript
{
  id:              string;   // crypto.randomUUID()
  title:           string;
  date:            string;   // "YYYY-MM-DD" in local time — never toISOString()
  startTime:       string;   // "HH:MM" 24-hour format
  endTime:         string;   // "HH:MM" 24-hour format
  type:            "study" | "review" | "exam" | "break";
  completed?:      boolean;  // toggled by user; drives progress %
  conversationId?: string;   // present when saved from an AI plan
}
```

The `conversationId` field is the key to deduplication: when a user re-accepts a regenerated plan, all events sharing the same `conversationId` are replaced atomically via `replaceEventsByConversation()`.

### App Settings (stored in `localStorage` as `app_settings`)

```typescript
{
  theme:          "light" | "dark";
  language:       "en" | "zh";
  timeFormat:     "12h" | "24h";
  weekStart:      "monday" | "sunday";
  notifications:  boolean;
  studyReminders: boolean;
  examAlerts:     boolean;
}
```

### Supabase: `conversations`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → `auth.users` |
| `title` | text | Auto-generated from first AI reply |
| `plan` | jsonb | The last accepted plan JSON |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | Updated on each new message |

### Supabase: `messages`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `conversation_id` | uuid | FK → `conversations` |
| `role` | text | `"user"` or `"assistant"` |
| `content` | text | Raw message text (may include `<PLAN_START>...<PLAN_END>`) |
| `created_at` | timestamptz | |

---

## 🌙 Dark Mode

Dark mode uses Tailwind's `class` strategy. When the user switches to dark in Settings, the app adds `dark` to `document.documentElement`. Rather than sprinkling `dark:` variants across every component, a global CSS block in `src/index.css` remaps all neutral Tailwind utilities under the `html.dark` selector (which has higher specificity than Tailwind's single-class utilities):

```css
html.dark .bg-white   { background-color: #1e293b; } /* slate-800 */
html.dark .bg-gray-50 { background-color: #0f172a; } /* slate-900 */
html.dark .text-gray-800 { color: #f1f5f9; }
/* ... borders, inputs, shadows ... */
```

Violet, blue, green, orange, and amber accent colours are intentionally untouched — they look great in both themes.

---

## 🌍 Internationalisation

Translations live in `src/lib/i18n.js` as a plain object keyed by language code. The active language is served through `SettingsContext` and switching is instant with no page reload.

**Currently translated:**
- Sidebar navigation labels
- Full Settings page
- Dashboard section headers and status messages

Adding a new language is as simple as adding a new key to `src/lib/i18n.js` and adding it as an option in `Settings.jsx`.

---

## ⚠️ Known Gotchas

| Issue | Solution |
|---|---|
| `EADDRINUSE 3001` on startup | Run `lsof -ti:3001 \| xargs kill -9` then `npm run dev` |
| Chat history doesn't save (real user) | Run the SQL schema above in Supabase SQL Editor — the `conversations` table is missing |
| Events appear on wrong day (timezone) | Always use the `toDateStr()` helper — never `date.toISOString().split('T')[0]` |
| Stale events after bulk add | Use `addEvents(list)` not `addEvent` in a loop — the single-event version captures a stale React closure |
| Supabase email not arriving | Disable **Confirm email** in Supabase Authentication settings for local development |

---

## 🗺️ Roadmap

- [ ] Push notifications / study reminders
- [ ] Progress page — study hours chart, streak history
- [ ] Editable events (click to edit, not just delete)
- [ ] Drag-and-drop rescheduling
- [ ] Time format wired into Calendar and Plans views
- [ ] Export plan to PDF or Google Calendar
- [ ] Mobile-responsive layout

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
