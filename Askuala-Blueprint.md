# 🎓 ASKUALA — Build-Ready Blueprint

> **AI Learning OS for Ethiopian High School Students**
> *A multilingual AI-powered learning platform that transforms ANY textbook, note, or document into interactive lessons, personalized tutoring, and exam prep — accessible via mobile apps and messaging platforms.*

### 🔑 Two Ways to Learn
1. **📚 Curriculum Mode** — Preloaded Ethiopian high school textbooks (Grade 9–12)
2. **📤 Drop Mode** — Student uploads/pastes ANY content (PDF, photo, text, link) → instant AI tutor, summary, flashcards, quiz

---

## 📑 Table of Contents

1. Project Vision & Scope
2. System Architecture
3. Free-Tier Tech Stack
4. Database Schema
5. Feature Modules (Detailed)
6. User Workflows
7. Build Phases (MVP → Full Product)
8. Folder Structure
9. AI Implementation Strategy
10. Multilingual & Voice Layer
11. Offline / Low-Data Mode
12. Telegram + WhatsApp Bot Layer
13. Teacher Mode
14. UI/UX Design Structure
15. Deployment & Hosting
16. Cost Analysis (Free Tier Limits)
17. Risk & Scaling Plan
18. Pitch Deck Outline (Bonus)

---

## 1. PROJECT VISION & SCOPE

### Mission
Make quality education accessible to every Ethiopian high school student — in their language, on any device, with or without internet.

### Target Users
| User | Primary Need |
|------|--------------|
| Grade 9–12 students | Understand textbooks, prepare for exams |
| Teachers | Generate exams, track classes |
| Parents | Monitor child's progress |
| Schools | Deploy modern tools cheaply |

### Core Value Propositions
- **Personalized**: AI tutor adapts to each student
- **Local**: Amharic, Oromo, Tigrinya, English support
- **Inclusive**: Works on any phone, low data, even via Telegram/WhatsApp
- **Curriculum-aligned**: Built around real Ethiopian high school books
- **Affordable**: Free tier for students, paid tier for schools

---

## 2. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                       USER ACCESS LAYER                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │  Web App │  │  Mobile  │  │ Telegram │  │   WhatsApp   │    │
│  │ (Next.js)│  │ (PWA)    │  │   Bot    │  │     Bot      │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘    │
└───────┼─────────────┼─────────────┼────────────────┼───────────┘
        │             │             │                │
        └─────────────┼─────────────┼────────────────┘
                      ▼             ▼
        ┌──────────────────────────────────────────┐
        │          API GATEWAY (Next.js API)       │
        │   Auth │ Rate Limit │ Routing │ Logging  │
        └──────────────────────┬───────────────────┘
                               │
        ┌──────────────────────┼───────────────────┐
        ▼                      ▼                   ▼
┌──────────────┐    ┌──────────────────┐   ┌──────────────┐
│ AI SERVICES  │    │  CORE BACKEND    │   │  STORAGE     │
│              │    │                  │   │              │
│ Gemini API   │    │ - User mgmt      │   │ Supabase DB  │
│ Groq (LLaMA) │    │ - Quiz engine    │   │ (PostgreSQL) │
│ Whisper STT  │    │ - Progress track │   │              │
│ Edge TTS     │    │ - Exam generator │   │ Supabase     │
│              │    │ - Translation    │   │ Storage      │
└──────┬───────┘    └────────┬─────────┘   │ (PDFs)       │
       │                     │             └──────────────┘
       └─────────┬───────────┘                    │
                 ▼                                ▼
        ┌──────────────────────────────────────────┐
        │     VECTOR DB (pgvector in Supabase)     │
        │   Stores embeddings of textbook chunks   │
        │   for RAG (Retrieval Augmented Gen)      │
        └──────────────────────────────────────────┘
```

### How it flows
1. Student asks: *"Explain photosynthesis from chapter 5"*
2. App queries vector DB → finds relevant textbook chunks
3. Sends chunks + question to Gemini → gets contextual answer
4. Translates to Amharic if needed
5. Returns text + optional voice
6. Logs interaction → updates progress dashboard

---

## 3. FREE-TIER TECH STACK

### Frontend
| Layer | Tool | Why | Free Tier |
|-------|------|-----|-----------|
| Framework | **Next.js 14** | SSR, API routes, fast | Unlimited |
| Styling | **Tailwind CSS** | Fast, mobile-first | Free |
| Components | **shadcn/ui** | Accessible, consistent UI primitives | Free |
| Server state | **TanStack React Query** | Caching, retries, async UX states | Free |
| State | **Zustand** | Simple, lightweight | Free |
| Validation | **Zod** | Type-safe runtime validation for forms/APIs | Free |
| PWA | **next-pwa** | Offline support | Free |
| Mobile | **Capacitor** (later) | Wrap into APK | Free |

### Backend
| Layer | Tool | Why | Free Tier |
|-------|------|-----|-----------|
| API | **Next.js API Routes** | No separate server | Unlimited |
| Database | **Supabase (Postgres)** | Auth + DB + Storage | 500MB DB, 1GB storage |
| Auth | **Supabase Auth** | Email, OAuth, OTP | 50K users free |
| Vector DB | **Supabase pgvector** | Built-in, free | Included |
| File Storage | **Supabase Storage** | PDFs, audio | 1GB free |

### AI / ML
| Service | Use Case | Free Tier |
|---------|----------|-----------|
| **Google Gemini 1.5 Flash** | Main LLM, summaries, Q&A | 15 RPM, 1M tokens/day FREE |
| **Groq (LLaMA 3.3)** | Fast fallback LLM | 30 RPM free, very fast |
| **Hugging Face Inference** | Embeddings, fallback | Free tier |
| **OpenAI Whisper (open-source)** | Speech-to-text (run locally) | Free |
| **Microsoft Edge TTS** | Text-to-speech (free unofficial) | Free |
| **Google Translate (via Gemini)** | Translation | Use Gemini, free |

### Hosting & Deployment
| Service | Use | Free Tier |
|---------|-----|-----------|
| **Vercel** | Host Next.js app | Hobby tier free |
| **Supabase** | Backend & DB | Free tier |
| **Cloudflare R2** | (Optional) PDF CDN | 10GB free |
| **GitHub** | Code repo | Free |

### Bots
| Bot | Tool | Free? |
|-----|------|-------|
| Telegram | `node-telegram-bot-api` + Telegram Bot API | 100% free |
| WhatsApp | Twilio Sandbox (testing) → Meta Business API | Free for dev |

### Total Monthly Cost for MVP: **$0**

---

## 4. DATABASE SCHEMA

```sql
-- USERS
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT CHECK (role IN ('student','teacher','admin')),
  grade INT,           -- 9, 10, 11, 12
  language_pref TEXT,  -- 'en','am','om','ti'
  school_id UUID,
  created_at TIMESTAMP
);

-- SUBJECTS (Math, Biology, etc.)
subjects (
  id UUID PRIMARY KEY,
  name TEXT,
  grade INT,
  cover_image TEXT
);

-- TEXTBOOKS
textbooks (
  id UUID PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id),
  title TEXT,
  pdf_url TEXT,
  total_pages INT,
  uploaded_at TIMESTAMP
);

-- CHAPTERS
chapters (
  id UUID PRIMARY KEY,
  textbook_id UUID REFERENCES textbooks(id),
  chapter_number INT,
  title TEXT,
  start_page INT,
  end_page INT,
  summary TEXT
);

-- TEXTBOOK CHUNKS (for RAG)
textbook_chunks (
  id UUID PRIMARY KEY,
  chapter_id UUID REFERENCES chapters(id),
  content TEXT,
  page_number INT,
  embedding VECTOR(768)  -- pgvector
);

-- FLASHCARDS
flashcards (
  id UUID PRIMARY KEY,
  chapter_id UUID REFERENCES chapters(id),
  question TEXT,
  answer TEXT,
  difficulty TEXT
);

-- QUIZZES
quizzes (
  id UUID PRIMARY KEY,
  chapter_id UUID REFERENCES chapters(id),
  title TEXT,
  question_count INT,
  time_limit_seconds INT
);

-- QUESTIONS
questions (
  id UUID PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id),
  question_text TEXT,
  question_type TEXT,  -- 'mcq','short','true_false'
  options JSONB,
  correct_answer TEXT,
  explanation TEXT
);

-- STUDENT ATTEMPTS
quiz_attempts (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES users(id),
  quiz_id UUID REFERENCES quizzes(id),
  score INT,
  total INT,
  time_taken_seconds INT,
  weak_topics JSONB,
  attempted_at TIMESTAMP
);

-- CHAT HISTORY (AI Tutor)
chat_messages (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES users(id),
  chapter_id UUID,
  role TEXT,  -- 'user' or 'ai'
  content TEXT,
  language TEXT,
  created_at TIMESTAMP
);

-- PROGRESS TRACKING
student_progress (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES users(id),
  subject_id UUID REFERENCES subjects(id),
  chapters_completed INT,
  total_chapters INT,
  avg_quiz_score FLOAT,
  weak_areas JSONB,
  last_activity TIMESTAMP
);

-- SCHOOLS (for teacher mode)
schools (
  id UUID PRIMARY KEY,
  name TEXT,
  region TEXT,
  admin_id UUID
);

-- CLASSES
classes (
  id UUID PRIMARY KEY,
  school_id UUID,
  teacher_id UUID,
  grade INT,
  subject_id UUID,
  name TEXT
);
```

---

## 5. FEATURE MODULES (DETAILED)

### Module 1: Smart Textbook Engine
**What it does:** Converts a PDF textbook into structured, AI-ready content.

**Pipeline:**
```
PDF Upload → Extract text (pdf-parse) → Split by chapters →
Generate embeddings (Gemini/HF) → Store in pgvector →
Auto-generate: Summary, Flashcards, Quiz, Key Concepts
```

**Outputs per chapter:**
- 200-word summary
- 10 flashcards
- 5-question quiz
- List of key terms with definitions

**Tech:** `pdf-parse`, Gemini API, pgvector

---

### Module 1.5: Drop Mode (Student-Uploaded Content) ⭐
**What it does:** Student drops ANY content → gets the same full AI experience instantly.

**Input types accepted:**
| Input | How it works |
|-------|--------------|
| 📄 **PDF** | Worksheets, handouts, lecture slides, past papers |
| 📝 **Pasted text** | Copy-paste lecture notes, articles, definitions |
| 📸 **Photo of notes** | Snap textbook page or handwritten notes (OCR) |
| 🔗 **URL/Link** | Paste a Wikipedia link, blog, news article |
| 🎙️ **Voice recording** | Record teacher's lesson → transcribe → study from it |
| 📊 **Word/PPT files** | Convert and process |

**Pipeline:**
```
Student drops content
  ↓
Detect type → extract text:
  - PDF → pdf-parse
  - Image → Tesseract.js OCR (free, runs in browser)
  - URL → fetch + readability extract
  - Audio → Whisper (transcribe)
  - DOCX → mammoth.js
  ↓
Chunk text → embed → store in temp vector DB
  ↓
Auto-generate (1 click each):
  ✓ Summary (short / medium / detailed)
  ✓ Flashcards (10–20)
  ✓ Quiz (MCQ + short answer)
  ✓ Key concepts list
  ✓ AI Tutor chat (grounded in this content)
  ✓ "Explain like I'm 15" simplified version
  ✓ Translate to Amharic / Oromo / Tigrinya
```

**Where it goes in the database:**
```sql
-- New table: STUDENT_UPLOADS
student_uploads (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES users(id),
  title TEXT,
  source_type TEXT,        -- 'pdf','text','image','url','audio'
  original_content TEXT,
  extracted_text TEXT,
  language_detected TEXT,
  created_at TIMESTAMP,
  expires_at TIMESTAMP     -- optional auto-cleanup after 30 days
);

-- Reuse textbook_chunks but tag source
ALTER TABLE textbook_chunks ADD COLUMN source_id UUID;
ALTER TABLE textbook_chunks ADD COLUMN source_type TEXT; -- 'curriculum' or 'upload'
```

**UI Pattern — single "Drop Zone" on home screen:**
```
┌─────────────────────────────────────────┐
│   Drop anything to learn from it       │
│   ┌───────────────────────────────┐    │
│   │  📤 Drag & drop files here    │    │
│   │   or paste text / link        │    │
│   │   📷 Take photo  🎙️ Record    │    │
│   └───────────────────────────────┘    │
│                                         │
│   Recent uploads:                       │
│   • Biology Ch.5 worksheet  [open →]   │
│   • Math past paper 2023    [open →]   │
└─────────────────────────────────────────┘
```

**Smart features on top:**
- 🎯 **"Make me an exam from this"** — turns 5 worksheets into a custom mock exam
- 🌍 **Auto-translate** if content is in English but student prefers Amharic
- 💾 **Save to library** — drop becomes a permanent personal "subject"
- 🤝 **Share with classmates** — generate share link
- 🔒 **Privacy** — uploads are private by default, auto-delete after 30 days unless saved

**Why this is a killer feature:**
- Students don't need to wait for textbooks to be loaded
- Works for **any teacher's handout**, not just official curriculum
- Useful for **university students, private school students** too → bigger market
- Becomes the daily-use feature (curriculum is reference, drop is daily)
- Makes the product launchable **even before** all textbooks are digitized

**Free tech for each input type:**
| Input | Library | Free? |
|-------|---------|-------|
| PDF text | `pdf-parse`, `pdfjs-dist` | ✅ |
| OCR (image → text) | `tesseract.js` (browser-side) | ✅ |
| URL extraction | `@mozilla/readability` | ✅ |
| DOCX | `mammoth.js` | ✅ |
| Voice | `whisper.cpp` (WASM) or Groq Whisper API (free tier) | ✅ |
| Handwriting OCR | Gemini Vision (free tier handles images) | ✅ |

**Special trick — Gemini Vision for handwritten notes:**
Instead of running OCR, send the photo directly to Gemini Vision with an instruction like:
- Extract all text from this image
- Preserve page structure and headings
- Keep equations and labels as-is

This handles **handwritten Amharic, math equations, diagrams** way better than traditional OCR.

---

### Module 2: AI Tutor (RAG-based)
**What it does:** Student asks anything → gets accurate answer grounded in their textbook.

**Why RAG?** Pure LLMs hallucinate. RAG ensures answers come from the actual book.

**Flow:**
1. Embed the student question.
2. Retrieve top relevant textbook chunks from vector search.
3. Build a prompt with:
   - tutor persona (friendly Ethiopian high-school tutor)
   - target response language
   - retrieved textbook context
   - student question
4. Send prompt to Gemini and generate answer.
5. Optionally convert answer to voice output.
6. Return text answer (and voice, if enabled).

---

### Module 3: Exam Mode
**What it does:** Generates timed practice exams that mimic real Ethiopian national exams.

**Features:**
- Timed mode (e.g., 60 mins)
- Past-exam-style question generation
- Auto-grading
- Detailed feedback per wrong answer
- Weak area identification
- Personalized improvement plan

**Question Generator Prompt:**
```
Generate 20 questions in the style of the Ethiopian National Examination 
for Grade 12 {subject}. Mix: 60% MCQ, 30% short answer, 10% problem-solving. 
Difficulty: progressively harder. Include answer key and explanations.
```

---

### Module 4: Performance Dashboard
**Visualizes:**
- Subjects progress (% completed per subject)
- Quiz scores over time (line chart)
- Strong vs weak topics (radar chart)
- Streak counter (gamification)
- Daily study minutes
- Predicted exam readiness score

**Library:** Recharts (free, clean)

---

### Module 5: Offline Mode
**Strategy:** Progressive Web App (PWA) + IndexedDB

**What's downloadable:**
- Textbook PDFs (cached)
- Pre-generated summaries, flashcards, quizzes
- Last 50 AI chat answers (cached)
- Voice TTS files (small mp3s)

**What needs internet:**
- New AI tutor questions
- Live exams
- Syncing progress

**Tech:**
- `next-pwa` for service workers
- IndexedDB via `Dexie.js`
- Background sync API

---

### Module 6: Teacher Mode
**Teacher Dashboard:**
- Add/manage students in classes
- Upload custom materials
- Generate custom exams in seconds
- View class performance heatmap
- Export reports as PDF
- Send announcements

---

## 6. USER WORKFLOWS

### Student Workflow
```
1. SIGN UP
   ↓ (Phone/Email + Grade + Language)
   
2. ONBOARDING
   ↓ (Pick subjects, set goals, take placement quiz)
   
3. HOME DASHBOARD — TWO PATHS
   │
   ├── PATH A: Curriculum Learning
   │   ├─ Pick subject → chapter
   │   ├─ Read summary, flashcards, quiz
   │   └─ Ask AI tutor
   │
   └── PATH B: Drop & Learn ⭐
       ├─ Drop PDF / paste text / snap photo
       ├─ AI processes in 5–10 seconds
       ├─ Get summary, flashcards, quiz, tutor chat
       └─ Save to "My Library" if useful
   
4. STUDY SESSION (works same way for both paths)
   ├─ Read summary
   ├─ Review flashcards
   ├─ Ask AI tutor questions
   └─ Take quiz
   
5. EXAM PREP
   ├─ Use curriculum OR uploaded materials OR both
   ├─ Take timed mock exam
   └─ Get personalized study plan
   
6. PROGRESS REVIEW
   └─ See improvement across all content
```

### Teacher Workflow
```
1. CREATE SCHOOL + CLASS
2. INVITE STUDENTS (link or code)
3. UPLOAD MATERIALS (PDFs)
4. GENERATE QUIZ/EXAM (1 click)
5. ASSIGN TO CLASS
6. VIEW RESULTS DASHBOARD
7. EXPORT REPORTS
```

### Telegram Bot Workflow
```
/start → Welcome + language pick
/subjects → Choose subject (curriculum mode)
/ask <question> → AI answers with textbook context
/quiz <subject> → 5-question quick quiz
/progress → See your stats
/voice → Toggle voice replies

⭐ DROP MODE in Telegram:
• Send any PDF → bot processes → returns summary + quiz
• Send a photo of notes → OCR → study material
• Send voice message → transcribed → studyable
• Forward a long article → bot summarizes
```

---

## 7. BUILD PHASES (MVP → FULL)

### 🟢 PHASE 1: MVP (Weeks 1–4)
**Goal:** Working web app with **Drop Mode** + AI Tutor working end-to-end.

> 💡 **Strategic note:** Build Drop Mode FIRST, not curriculum mode. Why? You don't need to license textbooks or wait for content. A student can use the app on Day 1 with their own homework. Curriculum mode comes in Phase 2 once you have users.

**Build:**
- [ ] Next.js + Supabase setup
- [ ] User auth (email + password)
- [ ] **Drop Mode UI** — drag/drop, paste text, photo upload
- [ ] PDF text extraction (`pdf-parse`)
- [ ] Image OCR via Gemini Vision (handles handwriting)
- [ ] Text chunking + embedding pipeline
- [ ] RAG-based AI Tutor chat UI
- [ ] Auto-generate: summary, 10 flashcards, 5-question quiz
- [ ] "My Library" — save/revisit uploads
- [ ] Basic progress tracking

**Output:** Any student can drop their homework PDF and study it with AI in 30 seconds.

---

### 🟡 PHASE 2: Curriculum + Core Features (Weeks 5–8)
- [ ] Add curriculum mode (preloaded textbooks)
- [ ] All Grade 11 subjects loaded
- [ ] Exam mode with timer
- [ ] Performance dashboard
- [ ] Amharic + Oromo support (via Gemini)
- [ ] Voice replies (Edge TTS)
- [ ] Voice input (Whisper)
- [ ] Streak system + gamification
- [ ] PWA + offline mode

---

### 🟠 PHASE 3: Inclusivity (Weeks 9–12)
- [ ] Telegram bot
- [ ] WhatsApp bot (Twilio sandbox)
- [ ] Voice-to-text for asking questions
- [ ] Low-bandwidth mode (text-only fallback)
- [ ] Mobile APK via Capacitor

---

### 🔴 PHASE 4: Scale (Weeks 13+)
- [ ] Teacher mode + school dashboards
- [ ] All grades 9–12
- [ ] Tigrinya support
- [ ] Custom exam builder
- [ ] Analytics for ministries / NGOs
- [ ] Premium tier (advanced AI, deeper analytics)

---

## 8. FOLDER STRUCTURE

```
askuala/
├── apps/
│   ├── web/                    # Next.js student/teacher app
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── (student)/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── subjects/[id]/
│   │   │   │   ├── chapter/[id]/
│   │   │   │   ├── tutor/
│   │   │   │   ├── quiz/[id]/
│   │   │   │   └── exam/
│   │   │   ├── (teacher)/
│   │   │   │   ├── classes/
│   │   │   │   ├── exams/
│   │   │   │   └── analytics/
│   │   │   └── api/
│   │   │       ├── chat/
│   │   │       ├── quiz/
│   │   │       ├── exam/
│   │   │       └── upload/
│   │   ├── components/
│   │   │   ├── ui/             # buttons, inputs (shadcn-style)
│   │   │   ├── tutor/
│   │   │   ├── quiz/
│   │   │   └── dashboard/
│   │   ├── lib/
│   │   │   ├── supabase.ts
│   │   │   ├── gemini.ts
│   │   │   ├── tts.ts
│   │   │   ├── pdf-parser.ts
│   │   │   └── rag.ts
│   │   └── public/
│   │
│   └── bot/                    # Telegram + WhatsApp bots
│       ├── telegram/
│       │   └── index.ts
│       └── whatsapp/
│           └── index.ts
│
├── packages/
│   ├── ai/                     # Shared AI logic
│   ├── db/                     # Supabase types
│   └── utils/                  # Translation, embedding helpers
│
├── scripts/
│   ├── ingest-pdf.ts           # One-time textbook upload
│   └── generate-content.ts     # Bulk-generate summaries/quizzes
│
├── .env.example
├── package.json
└── README.md
```

---

## 9. AI IMPLEMENTATION STRATEGY

### Why Gemini 1.5 Flash as primary?
- 1M token context (fits whole textbooks)
- Free tier: 1500 requests/day
- Multilingual native (Amharic, Oromo decent)
- Fast (sub-second responses)

### Why Groq as fallback?
- 30 requests/min free
- 10x faster than Gemini
- Use for short tasks (generate flashcards, simple Q&A)

### When to use what
| Task | Model | Reason |
|------|-------|--------|
| Long textbook analysis | Gemini | Big context |
| Quick chat replies | Groq | Speed |
| Embeddings | Gemini text-embedding-004 | Free, good |
| Exam generation | Gemini | Quality |
| Translation | Gemini | One model fits all |

### Prompt Template Library
Keep prompts in `lib/prompts.ts`:
- `TUTOR`: grounded answer prompt (language + context + question)
- `QUIZ_GEN`: quiz generation prompt (topic + question count + difficulty)
- `EXAM_GEN`: exam-style prompt (subject + grade + format mix)
- `SUMMARY`: short/medium/detailed summary prompt
- `FLASHCARDS`: question/answer card generation prompt

---

## 10. MULTILINGUAL & VOICE LAYER

### Languages Supported
| Lang | Code | Strategy |
|------|------|----------|
| English | en | Native |
| Amharic | am | Gemini handles well |
| Afaan Oromo | om | Gemini + post-translation check |
| Tigrinya | ti | Gemini (newer support) |

### Translation flow
```
User picks language at signup → Stored in profile
↓
Every AI prompt includes: "Respond in {user.language}"
↓
UI strings use i18n (next-intl library, free)
```

### Voice Layer
- **Speech-to-Text:** Whisper.cpp (runs in browser via WASM, free, offline-capable)
- **Text-to-Speech:** Edge TTS (Microsoft, free, supports Amharic)

---

## 11. OFFLINE / LOW-DATA MODE

### Three tiers
**Tier 1: Full Offline**
- Pre-downloaded subjects
- Cached summaries, flashcards, quizzes
- No AI tutor (queued for sync)

**Tier 2: Low-Data**
- Text-only mode (no images)
- Compressed responses
- Cache aggressively

**Tier 3: Online**
- Full features
- Voice + video

### Implementation
- App shell: Cache-first
- Textbook PDFs: Cache-first, manual download
- AI responses: Network-first, cache fallback
- User data: Background sync

---

## 12. TELEGRAM + WHATSAPP BOT LAYER

### Telegram Bot (Easiest, Start Here)
- `/ask <question>`:
  - read user question
  - detect/get user language preference
  - call tutor service with RAG context
  - return answer as message
- `/quiz <subject>`:
  - generate quick quiz item
  - send as Telegram poll
  - include correct option and explanation

### WhatsApp (via Twilio Sandbox for free testing)
- Same logic, different SDK
- Production needs Meta Business verification (free but requires docs)

---

## 13. TEACHER MODE

### Key Features
1. **Class Management** — add students via QR or invite link
2. **Material Upload** — drag-drop PDFs
3. **Exam Builder**
   - Select subject + chapters
   - Pick difficulty + question count
   - 1-click generate
   - Edit questions
   - Assign to class
4. **Live Class Analytics**
   - Heatmap: who's struggling on what
   - Auto-flag students at risk
5. **Reports**
   - Weekly PDF report per class
   - Auto-email to parents

---

## 14. UI/UX DESIGN STRUCTURE

### Design Principles
- **Bold, friendly, motivating** — students should feel excited
- **Mobile-first** — most students use phones
- **Low cognitive load** — clear hierarchy, large tap targets
- **Localized fonts** — Noto Sans Ethiopic for Amharic
- **Meaningful copy only** — placeholders, labels, helper text, and empty states must be specific (no lorem ipsum/generic filler)

### UI Quality Checklist (Required)
1. Use **shadcn/ui** for form controls, dialogs, tabs, toasts, and buttons.
2. Use **TanStack React Query** for all server reads/mutations and display loading/error/empty states.
3. Use **Zustand** for local UI state only (do not mirror server state already managed by React Query).
4. Use **Zod** to validate form input and API payloads before mutation.
5. Use contextual placeholders and actionable errors (example: `Enter your Grade 11 biology question`).
6. Every empty state must include next action text (example: `No flashcards yet. Generate cards from this chapter.`).

### Key Screens
1. **Splash/Welcome** — language picker, big logo
2. **Home Dashboard**
   - Today's plan card (top)
   - Subject grid (3 columns mobile, 4 desktop)
   - Streak banner
   - Weak topics carousel
3. **Subject View**
   - Chapter list with progress bars
   - "Start Studying" CTA
4. **Chapter View**
   - Tabs: Summary | Flashcards | Quiz | Ask AI
5. **AI Tutor**
   - Chat bubble interface
   - Voice button
   - Suggested questions
6. **Exam Mode**
   - Fullscreen, timer, anti-distraction
7. **Profile/Stats**
   - Charts, achievements

### Color Palette (suggestion)
- **Primary:** Deep green (#0F7B40) — Ethiopian flag inspiration
- **Accent:** Gold (#FFB800) — energy, achievement
- **Neutral:** Off-white (#FAF7F2), charcoal (#1F2937)
- **Avoid:** Generic AI purple gradients

### Typography
- **Display:** Cabinet Grotesk or Clash Display (free)
- **Body:** Inter (English), Noto Sans Ethiopic (Amharic)

---

## 15. DEPLOYMENT & HOSTING

### One-time setup
1. **GitHub repo** → push code
2. **Vercel** → connect repo, auto-deploy
3. **Supabase** → create project, run migrations
4. **Gemini API key** → Google AI Studio (free)
5. **Telegram Bot token** → BotFather

### CI/CD
- Push to `main` → Vercel auto-deploys
- Push to `dev` → Preview URL
- Use Vercel env vars for secrets

### Custom Domain
- Buy `.et` domain (~$30/yr) or use free `.vercel.app`

---

## 16. COST ANALYSIS (Free Tier Limits)

| Service | Free Limit | When You'll Hit It | Upgrade Cost |
|---------|-----------|--------------------|--------------| 
| Vercel | 100GB bandwidth/mo | ~10K MAU | $20/mo |
| Supabase | 500MB DB, 50K users | ~5K active students | $25/mo |
| Gemini API | 1500 req/day free | ~300 active students | Pay per use ($0.075/1M tokens) |
| Groq | 30 req/min | Burst usage | Stays free |
| Telegram Bot | Unlimited | Never | Free forever |

### Realistic MVP Cost: **$0/month**
### 1000 active students: **~$0–25/month**
### 10K students: **~$50–100/month**

---

## 17. RISK & SCALING PLAN

| Risk | Mitigation |
|------|-----------|
| Gemini hits rate limit | Auto-fallback to Groq |
| Supabase DB fills up | Archive old chats to cold storage |
| AI hallucinates wrong answers | RAG ensures textbook-grounded answers + add "Was this helpful?" feedback |
| Students with no internet | Telegram bot works on 2G; offline mode |
| Amharic AI quality | Use few-shot examples in prompts; collect feedback |
| Copyright on textbooks | Partner with Ministry of Education or use openly licensed materials |

---

## 18. PITCH DECK OUTLINE (Bonus)

For hackathons/funding:

1. **Hook** — "70% of Ethiopian students fail national exams. We can change that."
2. **Problem** — Statistics on education gap
3. **Solution** — Askuala demo (30 sec)
4. **How It Works** — Architecture diagram
5. **Market** — 5M+ Ethiopian high schoolers
6. **Why Now** — AI is finally cheap + multilingual
7. **Traction Plan** — Pilot with 3 schools → 100 schools
8. **Business Model** — Free for students, $X/student/yr for schools
9. **Team**
10. **Ask** — What you need (funding, mentorship, partnerships)

---

## 🎯 QUICK START CHECKLIST (Day 1)

```bash
# 1. Clone starter
npx create-next-app@latest askuala --typescript --tailwind --app

# 2. Install dependencies
npm install @supabase/supabase-js @google/generative-ai \
            zustand recharts pdf-parse next-pwa dexie

# 3. Set up Supabase
# - Create project at supabase.com
# - Enable pgvector extension
# - Run schema SQL

# 4. Get Gemini key
# - Go to aistudio.google.com
# - Create API key
# - Add to .env.local

# 5. Build first feature (AI Tutor MVP)
# - Upload one PDF
# - Build /api/chat route
# - Build chat UI
# - Test

# 6. Deploy
git init && git push
# Connect Vercel → done
```

---

## 📝 FINAL NOTES
y
**What makes Askuala win:**
- Real curriculum, not generic AI
- Local languages built-in
- Works on any device
- Free for students forever
- Schools pay → sustainable

**Build mantra:**
> Ship the AI Tutor for ONE subject in ONE language first.
> Polish it. Get 10 real students using it.
> Then scale.

**Next step after this doc:**
1. Set up Supabase + Vercel (1 day)
2. Build PDF ingestion pipeline (2 days)
3. Build AI Tutor MVP (3 days)
4. Show to 5 students, iterate (1 week)

---

*Built with care for Ethiopian education. 🇪🇹*
