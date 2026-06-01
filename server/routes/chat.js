import { Router } from 'express';
import OpenAI from 'openai';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

let openai = null;
function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

function buildSystemPrompt(today) {
  const d = new Date(today + 'T00:00:00');
  const tomorrow = new Date(d);
  tomorrow.setDate(d.getDate() + 1);
  const pad = (n) => String(n).padStart(2, '0');
  const tomorrowStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;

  return `You are a friendly AI study planning assistant. Help users create personalized study schedules through natural conversation.

Today's date is ${today}.

STEP 1 — GATHER INFO (one question at a time, be brief):
Ask the user for:
1. What certification, exam, or subject they want to study
2. Their exam date or deadline
3. How many hours they can study per weekday
4. How many hours they can study per weekend day

STEP 2 — GENERATE PLAN:
Once you have all 4 pieces of info, generate the study plan. Include the plan JSON using EXACTLY this wrapper (no markdown fences inside):

<PLAN_START>
{
  "summary": {
    "totalStudyHours": 84,
    "dailyAverage": 2.1,
    "topicsCount": 7,
    "practiceExams": 6
  },
  "topics": [
    { "name": "Topic Name", "hours": 10 }
  ],
  "schedule": [
    { "date": "${tomorrowStr}", "title": "Session Title", "startTime": "09:00", "endTime": "11:00", "type": "study" }
  ],
  "tip": "You need to study about 2.1 hours/day to complete everything comfortably."
}
</PLAN_END>

SCHEDULE RULES:
- Start from ${tomorrowStr} or later
- Fill days according to the user's available hours (split into max 2-hour sessions)
- Distribute topics progressively (foundational → advanced)
- Insert review sessions every 3–4 study days
- Add 2–3 practice exams in the final week before the deadline
- Use realistic start times: morning 09:00, afternoon 14:00, evening 19:00
- "type" must be one of: study, review, exam, break

After the JSON, write a brief friendly message confirming the plan is ready and asking if they'd like to accept it or make adjustments.

Keep all non-plan messages SHORT (1–2 sentences max). Ask only ONE question at a time. Be warm and encouraging.`;
}

router.post('/', requireAuth, async (req, res) => {
  const { messages, today } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required.' });
  }

  const ai = getOpenAI();
  if (!ai) {
    return res.status(503).json({ error: 'OpenAI API key not configured on the server.' });
  }

  const todayStr = today || new Date().toISOString().split('T')[0];

  try {
    const response = await ai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildSystemPrompt(todayStr) },
        ...messages,
      ],
      temperature: 0.7,
    });

    res.json({ content: response.choices[0].message.content });
  } catch (err) {
    console.error('OpenAI error:', err.message);
    res.status(500).json({ error: 'AI service error. Please try again.' });
  }
});

export default router;
