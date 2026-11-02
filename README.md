# 🌸 Mindsy

**A pastel, uplifting space for emotional check-ins — where every feeling plants something.**

Mindsy is a full-stack mental wellness and emotional check-in application. You can use it
immediately as a guest, or create an account to keep your history. Every check-in grows one
stable, clickable plant in a contained **Living Garden**.

Mindsy is a wellness journal, **not** a medical service. It does not diagnose, treat or replace
professional care.

---

## What's inside

| Area | What it does |
| --- | --- |
| **Home** | Emotional welcome, sample garden, feature overview |
| **Check-in** | Five steps: feelings (multi-select), energy, reflection, tags, plant |
| **Living Garden** | Deterministic SVG botanical garden, clickable flowers, detail overlay |
| **Insights** | Mood distribution, energy split, 14-day timeline, streak, gentle observations |
| **Journal** | Create, search, edit and delete longer reflections |
| **Joy Deck** | 24 animated, doable micro-prompts |
| **Breathe** | Guided 4-4-6-2 breathing with reduced-motion support |
| **Mood Weather** | Metaphorical read on the last seven days |
| **Gratitude Wall** | Pastel notes you can pin and remove |
| **Companion** | Rule-based supportive listener with crisis routing and honest limits |
| **Support** | Grounding exercise, crisis guidance, links to real help |
| **Accounts** | Signup, login, logout, persistent sessions, per-user data isolation |
| **Guest mode** | Full experience with browser storage, migrated into an account on sign-in |

---

## Stack

**Frontend** — Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, Lucide React
**Backend** — Python (3.11 tested), FastAPI, SQLAlchemy 2, Pydantic v2, PyJWT, bcrypt
**Database** — SQLite in development, PostgreSQL-ready in production

---

## Quick start

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                # then set JWT_SECRET
uvicorn app.main:app --reload --port 8010
```

The API is now at `http://127.0.0.1:8010`, with interactive docs at
`http://127.0.0.1:8010/docs`. Tables are created automatically on startup.

### 2. Frontend

```bash
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Both `.env.example` files are committed; real `.env` files are not.

### Environment variables

| File | Variable | Purpose |
| --- | --- | --- |
| `backend/.env` | `APP_ENV` | `development` locally; set to `production` on the API host |
| | `DATABASE_URL` | `sqlite:///./mindsy.db` locally, PostgreSQL in production |
| | `JWT_SECRET` | Long random signing key — **required** outside development |
| | `ACCESS_TOKEN_DAYS` | Token lifetime (default 7) |
| | `CORS_ORIGINS` | Comma separated browser origins allowed to call the API |
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL` | API base URL. Empty = same origin via the Next proxy |
| | `API_PROXY_TARGET` | Where that proxy forwards `/api/*` (server-side only) |

> The frontend never hardcodes `localhost`. All requests go through `NEXT_PUBLIC_API_URL`.
> Leave it empty when frontend and API share an origin; Next.js then proxies `/api/*` to
> `API_PROXY_TARGET`, which also avoids CORS entirely.

---

## The Living Garden

The signature feature. It is **derived, never randomly generated**:

1. Each check-in has a UUID.
2. That UUID is hashed with 32-bit FNV-1a.
3. The hash decides the species, variant, x position, depth row and scale.
4. Growth stage comes from the check-in's age: seedling → growing → bloom.

Species mapping: happy → sunflower, calm → lavender, loved → rose, hopeful → sprout,
sad → bluebell, anxious → lotus, angry → hibiscus, exhausted → moonflower, confused → iris,
overwhelmed → peony, three or more feelings at once → mixed blossom.

Because geometry is derived from persistent data, refreshing can never duplicate or reshuffle a
plant. The same algorithm exists in `backend/app/services/garden.py` (used by `GET /api/garden`
for signed-in users) and `frontend/src/lib/garden.ts` (used for guest gardens). Keep them in sync.

---

## Golden path (verify in two minutes)

1. Start the backend and frontend.
2. Create an account (or continue as a guest).
3. Go to **Check-in**, select at least one feeling, pick energy, add a note and tags.
4. Press **Plant this feeling** → you should see “Your feelings have been planted in your
   garden.”
5. Open **Garden** → exactly one plant appears.
6. Refresh the page → the same plant, same place, no duplicate.
7. Add a second check-in → a second plant appears.
8. Click a flower → its date, mood, emotions, energy, tags and note appear.

Guest data is moved into your account on first sign-in, keeping the original check-in dates.

---

## Legacy Streamlit prototype

The original hackathon prototype is retained at the repository root in `app.py` and `utils.py`,
with its original root `requirements.txt`. It is historical source; the maintained, redesigned
application is the Next.js frontend and FastAPI backend documented above. The prototype's Azure
credentials and local speech dependencies are not configured by this project, so do not treat it
as the production application.

---

## Tests

```bash
cd backend
.venv/bin/python -m pytest -q   # Windows: .venv\Scripts\python.exe -m pytest -q
```

**49 backend tests** cover signup/login validation, bcrypt storage, token auth, cross-user
isolation (a user cannot read or delete another user's rows), check-in persistence, garden
stability and containment, journal CRUD and search, gratitude, and companion safety routing.

Frontend verification:

```bash
cd frontend
npm run lint
npm run typecheck   # strict TypeScript, no errors
npm run build       # production build, all routes prerender/compile
```

---

## Repository layout

```
mindsy/
├── frontend/
│   ├── src/app/            # routes (App Router)
│   ├── src/components/     # navigation, provider, garden, flowers, shared UI
│   ├── src/lib/            # API client, garden engine, insights, weather, storage
│   ├── public/
│   ├── package.json
│   └── .env.example
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models/         # users, check-ins, journal, gratitude
│   │   ├── schemas/        # Pydantic v2 contracts
│   │   ├── routes/         # auth, entries, garden, journal, gratitude, companion
│   │   └── services/       # security, garden derivation, companion responses
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
├── docs/
│   ├── ARCHITECTURE.md
│   └── DEPLOYMENT.md
├── CHANGELOG.md
├── LICENSE
└── README.md
```

---

## Security notes

- Passwords hashed with **bcrypt** (never stored or returned in plain text).
- JWT bearer tokens, verified on every protected request.
- Every query is scoped to the authenticated user; foreign ids return `404`, never `403`, so
  existence is not leaked.
- Input validation on the server (moods, energy, tags, lengths, timestamps).
- CORS is an explicit allow-list, not `*`.
- No secrets in the repository; `.env.example` documents what is needed.
- Access tokens live in `localStorage`, which is convenient for a single-page demo but readable by
  any injected script. For a hardened deployment, move to short-lived httpOnly refresh cookies and
  add CSRF protection.

---

## Deployment

Frontend → Vercel or Netlify. Backend → any Python host (Render, Railway, Fly.io).
Use PostgreSQL in production. Full steps and a checklist live in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Verified
technology evidence and release checks are recorded in [docs/TECH_STACK_AUDIT.md](docs/TECH_STACK_AUDIT.md)
and [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md).

---

## License

MIT — see [LICENSE](LICENSE).
