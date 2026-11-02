# Mindsy

Mindsy is a gentle emotional check-in and journaling app. Check-ins grow a stable Living Garden,
while Insights, the Journal, Mood Weather, and small self-care tools offer ways to reflect.

> Mindsy is a wellness journal, not a medical service. It does not diagnose, treat, or replace
> professional care. If you are in immediate danger, contact your local emergency number.

## What is included

| Feature | Description |
| --- | --- |
| Check-in | Name feelings, energy, a reflection, and optional tags in five short steps. |
| Living Garden | Each check-in becomes a deterministic, clickable flower. |
| Insights | Mood and energy summaries, a 14-day check-in timeline, streak, and gentle observations. |
| Journal | Create, search, edit, and delete longer reflections. |
| Joy Deck | Draw from 24 small, optional activities. |
| Breathe | A guided 4-4-6-2 breathing rhythm with reduced-motion support. |
| Mood Weather | A non-diagnostic metaphor based on recent check-ins. |
| Gratitude Wall | Pin and remove brief notes. |
| Companion | Rule-based support by default, with optional VADER context and Azure OpenAI responses. |
| Support | Grounding steps and links to human and emergency support. |
| Guest mode and accounts | Use browser storage as a guest or save account data through the API. |

## Technology

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS, Framer Motion, Lucide React.
- **Backend:** Python 3.11, FastAPI, Pydantic, SQLAlchemy, PyJWT, bcrypt.
- **Data:** SQLite for local development; PostgreSQL is supported through SQLAlchemy and psycopg.
- **Optional Companion services:** VADER runs locally. Azure OpenAI uses the official asynchronous
  OpenAI Python SDK and is disabled unless explicitly enabled, fully configured, and explicitly
  consented to per API request. The current UI remains opted out.

The current frontend lint and TypeScript checks and backend tests are run locally; see
[docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md) for the latest results. No live Azure request
or hosted deployment is implied by the presence of integration code.

## Local development

Requirements: Python 3.11 or newer, Node.js 20 or newer, and npm.

### Windows PowerShell

From the repository root, create and install the backend environment:

```powershell
Set-Location backend
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Set a local `JWT_SECRET` in `backend/.env`, then start the API:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8010
```

In another PowerShell window:

```powershell
Set-Location frontend
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The API is at `http://127.0.0.1:8010`; interactive API
documentation is at `http://127.0.0.1:8010/docs`.

### macOS and Linux

```bash
cd backend
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
cp .env.example .env
# Set a local JWT_SECRET in backend/.env.
.venv/bin/python -m uvicorn app.main:app --reload --port 8010
```

In a second terminal:

```bash
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

Both committed environment examples are templates; do not put real credentials in Git. For a
different API port, update the frontend API URL and proxy target in `frontend/.env.local`, and
update the backend CORS allow-list if the browser calls the API directly.

## Companion sentiment and optional Azure AI

The original response logic remains the default and is the fallback. Crisis phrase routing runs
before sentiment analysis or any network request. When Azure is disabled, the API does not send
the Companion message to Azure and returns the existing rule-based response.

Only when Azure is enabled, fully configured, and the request explicitly opts into external
processing does VADER analyze the current non-crisis message locally using its established compound
thresholds (`>= 0.05` positive, `<= -0.05` negative, otherwise neutral). The score is a
supplementary lexical signal, not a clinical assessment. If local analysis fails, the request
continues without that context. Azure can then generate a brief supportive reflection; the existing
tone, suggestions, disclaimer, and response fields are retained. Configuration errors, timeouts,
connection/authentication errors, rate limits, missing deployments, and other provider failures all
return the rule-based response. The current frontend does not send the opt-in flag and therefore
continues to use the rule-based Companion.

To enable Azure, set these **on the backend only**, then restart the API:

| Variable | Purpose |
| --- | --- |
| `AZURE_OPENAI_ENABLED` | Set to `true` to opt in; the default is `false`. |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI resource endpoint. |
| `AZURE_OPENAI_API_KEY` | Server-side Azure credential. Never expose it to the browser. |
| `AZURE_OPENAI_DEPLOYMENT` | The name of your Azure deployment serving GPT-4o; the deployment name itself need not be `gpt-4o`. |
| `AZURE_OPENAI_API_VERSION` | A chat-completions API version supported by your Azure resource. |

All four Azure settings must be non-empty before the backend attempts a request. Missing or
incorrect settings do not prevent startup; the Companion falls back. The SDK request uses an
8-second timeout, disables automatic retries, and bounds its response. Automated tests use mocks
and make no paid Azure requests.

**Privacy:** local VADER processing does not persist the reflection. Only an explicitly consenting
API request, with Azure enabled and configured, sends the current message and its derived sentiment
summary to the configured Azure deployment. Azure-side handling and retention depend on the
resource and account configuration. Mindsy does not write these request contents to application
logs or add a database record for them. Do not enable the integration until the deployment's
data-handling settings are appropriate for your use. The current Companion page still has its
original static copy describing a rule-based engine and no paid AI provider. Because this change
intentionally leaves the UI untouched, do not enable Azure for end users until a separately
approved UI update accurately discloses the optional external processing and offers consent.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md),
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), and
[docs/TECH_STACK_AUDIT.md](docs/TECH_STACK_AUDIT.md) for implementation and verification details.

Authenticated written check-in reflections are also analyzed locally with VADER. The backend stores
nullable positive, negative, neutral, and compound scores alongside each check-in; long reflections
are analyzed using their first 1000 trimmed characters. These scores are supplementary, non-clinical
signals and are not sent to Azure. Guest check-ins remain local in the browser until the existing
guest-to-account migration. On startup, the backend adds the nullable score columns to existing
databases without rewriting or deleting check-in rows.

## Tests and checks

From the repository root:

```powershell
Set-Location backend
.\.venv\Scripts\python.exe -m pytest -q
```

```powershell
Set-Location frontend
npm run lint
npm run typecheck
npm run build
```

The Azure tests use mocked SDK clients; no credentials are needed. The backend tests also cover
the unchanged Companion response contract, the rule-based fallback, and crisis routing.

## Project layout

```text
mindsy/
|-- backend/
|   |-- app/routes/       # FastAPI endpoints
|   |-- app/schemas/      # Pydantic API contracts
|   |-- app/services/     # Rules, garden, VADER, optional Azure client
|   |-- app/models/       # SQLAlchemy models
|   `-- tests/
|-- frontend/
|   `-- src/
|       |-- app/          # Next.js routes
|       |-- components/   # Shared UI and app state
|       `-- lib/          # API client, garden, insights, local storage
|-- docs/
|-- app.py                # Historical Streamlit prototype
|-- utils.py              # Historical prototype helpers
`-- requirements.txt      # Historical prototype requirements
```

The maintained application is the Next.js frontend and FastAPI backend. Root-level Streamlit files
are retained as historical prototype code and are not part of the current app's runtime or
dependency installation.

## Deployment and limitations

Deployment guidance is in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). No external deployment or live
Azure inference has been verified. Production use still requires a persistent database, production
secrets, a restricted CORS allow-list, appropriate hosting, and review of privacy and safety needs.
The Companion is not a clinical or emergency service; automated crisis phrase matching cannot
replace human assessment.

## License

MIT. See [LICENSE](LICENSE).
