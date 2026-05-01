# Askuala — AI Learning OS

AI Learning OS for Ethiopian high school students.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create Supabase project + schema

1. Create project at <https://app.supabase.com>
2. Run SQL in order:
   - `supabase/schema.sql`
   - `supabase/patch-auth-role-signup.sql` (enables teacher/student role from signup metadata)
   - `supabase/patch-phase4.sql` (required for premium + institution analytics)

### 3. Configure env

```bash
cp .env.example .env
```

Fill all required keys in `.env`.

### 4. Seed curriculum data (Grades 9–12)

```bash
npm run seed:subjects
npm run seed:textbooks
```

`seed:textbooks` now seeds textbooks for all subject/grade rows using free/open learning source URLs in `pdf_url`.

### 5. Run app

```bash
npm run dev
```

Open <http://localhost:3000>

### Auth flows (Student + Teacher)

- Student registration: `/signup?role=student`
- Teacher registration: `/signup?role=teacher`
- Login (both roles): `/login`

## Phase 3 setup (complete)

### Telegram bot

1. Create Telegram bot token via BotFather
2. Add to `.env`:
```bash
TELEGRAM_BOT_TOKEN=...
```
3. Run:
```bash
npm run bot:telegram
```

### Run with Docker (recommended for always-on bot)

Use Docker Compose so web + Telegram bot auto-restart:

```bash
docker compose up -d --build
```

Check status/logs:

```bash
docker compose ps
docker compose logs -f telegram-bot
```

Stop:

```bash
docker compose down
```

### Docker Dev Mode (auto-reload on code changes)

Use this for local development so edits are reflected automatically:

```bash
docker compose -f docker-compose.dev.yml up -d
```

View logs:

```bash
docker compose -f docker-compose.dev.yml logs -f web
docker compose -f docker-compose.dev.yml logs -f telegram-bot
```

Stop dev containers:

```bash
docker compose -f docker-compose.dev.yml down
```

### WhatsApp bot (Twilio sandbox)

1. Configure Twilio sandbox webhook to:
   - `POST /api/whatsapp/webhook`
2. If local, expose with tunnel (for example `ngrok`)
3. Add to `.env`:
```bash
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
```

### Voice-to-text bot flow

Uses Groq Whisper via `GROQ_API_KEY` (already required by app).

### Low-bandwidth mode

Use:
- `/lite`

### Android APK via Capacitor

```bash
npm run cap:sync
npm run cap:open
npm run cap:apk:debug
```

Debug APK path:
`android/app/build/outputs/apk/debug/app-debug.apk`

## Phase 4 setup (complete)

### Teacher mode + dashboard

1. Enable local role switch (optional for testing):
```bash
ENABLE_ROLE_SWITCH=true
```
2. Go to `/settings` and switch to teacher.
3. Open `/teacher/dashboard`.

### Custom exam builder

- `/teacher/exams/new`

### Analytics for ministries / NGOs

- `/teacher/analytics`
- CSV export: `/api/teacher/analytics/export`

### Premium tier

- `/teacher/premium`
- Upgrade API: `/api/premium/upgrade`

If premium upgrade fails, ensure `supabase/patch-phase4.sql` was executed.

## Smoke test (Phase 3 + 4)

With `npm run dev` running:

```bash
npm run smoke:phase34
```

## Phase status

### Phase 2

- [x] Curriculum mode (preloaded textbooks)
- [x] Grade 11 subjects loaded
- [x] Exam mode with timer
- [x] Performance dashboard
- [x] Amharic + Oromo support
- [x] Voice replies (Edge TTS)
- [x] Voice input (Whisper)
- [x] Streak system + gamification
- [x] PWA + offline mode

### Phase 3

- [x] Telegram bot
- [x] WhatsApp bot (Twilio sandbox)
- [x] Voice-to-text for questions
- [x] Low-bandwidth text-only mode
- [x] Mobile APK via Capacitor

### Phase 4

- [x] Teacher mode + school dashboard
- [x] All grades 9–12 curriculum seeding
- [x] Tigrinya support
- [x] Custom exam builder
- [x] Analytics for ministries / NGOs
- [x] Premium tier (advanced AI/deeper analytics scaffolding)

## Notes

- Free/open-source learning links are stored in textbook `pdf_url` metadata for each seeded subject.
- To ingest real PDFs for richer chapter-grounded RAG, place files in `data/textbooks` and run `npm run ingest -- ...`.

### Default Admin Bootstrap

To guarantee one admin account exists in Supabase, set these in `.env`:

```bash
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=ChangeMe123!
DEFAULT_ADMIN_NAME=Askuala Admin
```

Then run:

```bash
npm run seed:admin
```

This command is idempotent: it creates the admin user if missing and always enforces `role=admin`.
# Askuala
