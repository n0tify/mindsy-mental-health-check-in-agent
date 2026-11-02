# Mindsy technical stack and CV-claim audit

**Audit date:** 2026-11-03
**Scope:** Current `mindsy` workspace, the documented GitHub target's `main` tip, and checks
listed in [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md).

## Evidence-based CV technology table

| CV technology | Evidence | Status |
| --- | --- | --- |
| Python | `backend/app/main.py` starts the FastAPI app; `backend/app/routes/` contains the API; backend tests are Python. Python 3.11 was used for local validation. | VERIFIED |
| Streamlit | The target GitHub `main` contains the original `app.py` prototype, which imports functions from `utils.py`. These files were retained from the remote when preparing the release tree. | VERIFIED |
| VADER | The target's original `utils.py` creates `SentimentIntensityAnalyzer` and calls it in `detect_mood()`. The redesigned backend has no VADER implementation or dependency. | PARTIALLY IMPLEMENTED |
| GPT-4o | The target's original `utils.py` configures `AzureOpenAI` and calls it in `get_suggestion()` and `generate_journal_entry()`. The current app's companion is rule-based (`backend/app/services/companion.py`). No Azure credentials or live deployment were verified. | PARTIALLY IMPLEMENTED |
| Azure OpenAI | The original prototype reads `AZURE_OPENAI_API_KEY`, `AZURE_ENDPOINT`, and `AZURE_DEPLOYMENT` from the environment and calls the Azure client. The current workspace has no Azure client, server configuration, or credentials. | PARTIALLY IMPLEMENTED |
| Text-to-speech | The original prototype has `speak(message)` in `utils.py`, using `pyttsx3`. It is not in the redesigned app, and the original `requirements.txt` does not list `pyttsx3`. | PARTIALLY IMPLEMENTED |
| Next.js | `frontend/package.json` pins Next.js 15; `frontend/src/app/` contains the App Router pages. The production build completed. | VERIFIED |
| TypeScript | The application source is `.ts`/`.tsx`; `frontend/tsconfig.json` enables `strict`; `npm run typecheck` passed. | VERIFIED |
| Tailwind CSS | `frontend/tailwind.config.ts` and `frontend/src/app/globals.css` configure and use Tailwind. The Next.js production build compiled CSS. | VERIFIED |
| FastAPI | `backend/app/main.py` creates the FastAPI app, registers routers, configures CORS and exposes `/api/health`; route and validation tests pass. | VERIFIED |

`PARTIALLY IMPLEMENTED` means source exists only in the legacy prototype or is not configured and
validated end-to-end. It does not mean a paid service is operational.

## CV narrative claim verification

| Submitted claim | Evidence and limitation | Status |
| --- | --- | --- |
| Reworked the hackathon prototype into a check-in app with mood logging, journaling, and mood trends. | The redesigned workspace implements check-ins, journal CRUD, and insights; backend tests and the production frontend build pass. No external production deployment was verified. | PARTIALLY IMPLEMENTED |
| Integrated VADER and GPT-4o via Azure OpenAI for personalized suggestions. | Source exists in the remote prototype, but is not integrated into the redesigned FastAPI app; Azure credentials and a live deployment were not verified. | PARTIALLY IMPLEMENTED |
| Added journaling prompts, spoken encouragement, and optional calming audio. | The prototype has `generate_journal_entry()`, `speak()`, a speech button, and `st.audio(...)`. `pyttsx3` is absent from its requirements; server-side speech and remote audio playback were not validated. These are absent from the redesigned UI. | PARTIALLY IMPLEMENTED |
| Redesigned the responsive interface with Next.js, TypeScript, Tailwind CSS, and Python/FastAPI. | The framework/source/config evidence is present in the current workspace; TypeScript, lint, production build, API tests, direct routes, and mobile/desktop home viewport checks passed. | VERIFIED |
| Retained the original Streamlit prototype. | `app.py` and `utils.py` are present at the requested GitHub target's `main` tip and are preserved in the release tree. | VERIFIED |

## Reference and scope notes

- At audit start the working copy was not a Git checkout and lacked the old prototype. The GitHub
  target was reachable and its `main` tip was
  [`0ae297cc3ae7dc3b828cbcc27e4a94a1ed367108`](https://github.com/n0tify/mindsy-mental-health-check-in-agent/commit/0ae297cc3ae7dc3b828cbcc27e4a94a1ed367108).
  The root `app.py`, `utils.py`, and `requirements.txt` there represent the earlier Streamlit
  prototype and are retained in the release tree.
- Original prototype source: [`app.py`](https://github.com/n0tify/mindsy-mental-health-check-in-agent/blob/main/app.py),
  [`utils.py`](https://github.com/n0tify/mindsy-mental-health-check-in-agent/blob/main/utils.py),
  and [`requirements.txt`](https://github.com/n0tify/mindsy-mental-health-check-in-agent/blob/main/requirements.txt).
- The redesigned application in this workspace is Next.js + TypeScript + Tailwind CSS with a
  FastAPI/SQLAlchemy backend. Its documented companion is deterministic and rule-based; it does
  not pretend to use an LLM.
- The prototype's Azure calls catch broad exceptions and return exception text to the caller.
  Credentials, a live Azure deployment, timeout behavior, and provider error handling were not
  verified; the prototype is not a production substitute for the current API.
- The prototype's `show_mood_trend()` calls `st.pyplot()` from `utils.py`, but `st` is not imported
  into that module; the calling app's `streamlit` import is not in the utility module's namespace.
  The redesigned app has its own Insights page and backend-tested data paths.
- The prototype's `pyttsx3` voice runs locally on the Python host, not in the browser. The redesigned
  app has no corresponding voice control or optional audio integration.
- The original Streamlit files were restored from the existing remote branch without replacing its
  history. They remain a legacy prototype, not the maintained production frontend.

## Current application architecture

- **Frontend:** Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, Lucide React.
- **Backend:** Python 3.11 tested locally, FastAPI, Pydantic v2, SQLAlchemy 2, PyJWT, bcrypt.
- **Persistence:** SQLite locally; SQLAlchemy is configured for PostgreSQL, and the psycopg binary
  driver is included for production. Local guest/account tokens and guest journal/check-in data use
  browser `localStorage`; account data is stored server-side.
- **Authentication:** bearer JWTs, with tokens stored in browser `localStorage`; password hashing
  uses bcrypt. This is a documented portfolio tradeoff, not an httpOnly-cookie deployment.
- **Routes:** `/api/auth/*`, `/api/entries`, `/api/garden`, `/api/journal`, `/api/gratitude`,
  `/api/companion`, and `/api/health`.
- **Configuration:** `backend/.env` is loaded by the backend; frontend build-time
  `NEXT_PUBLIC_API_URL` and server-only `API_PROXY_TARGET` configure API routing.
- **Deployment:** separate frontend and backend services are documented. PostgreSQL is recommended
  where host filesystems are ephemeral. No deployment to an external host was performed.

## Security and deployment caveats

- A pre-existing fixed development JWT secret was being used because backend `.env` was not loaded.
  The backend now loads `.env` and rejects the default, example placeholder, or a secret shorter
  than 32 characters when `APP_ENV=production`.
- Local secret files and the local SQLite database are ignored by `.gitignore`. No credential-shaped
  API key was found in the current source scan. This was not a full scan of all remote Git history.
- The original prototype's environment variable names are configuration hooks, not evidence that
  Azure credentials or a GPT-4o deployment are available.
- The dependency audit found 19 moderate and 1 high frontend advisories. The high advisory is in
  PostCSS nested under the pinned Next.js 15.5.28; the audit tool offered only a breaking Next.js
  16 upgrade. It was not force-upgraded.
- External production credentials, a persistent PostgreSQL service, real frontend/API origins,
  TLS, backup policy, and hosting are still required.
