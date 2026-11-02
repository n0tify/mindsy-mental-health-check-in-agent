# Deploying Mindsy

Mindsy runs as a Next.js frontend and a Python API. This repository does not include provider
deployment manifests, and no external deployment or live Azure request has been verified.

## Local development

Use Python 3.11 or newer and Node.js 20.19 or newer.

### Windows PowerShell

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

In another terminal:

```powershell
Set-Location frontend
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The API health endpoint is
`http://127.0.0.1:8010/api/health`; interactive API docs are at `/docs`.

The frontend example uses a direct API URL and matching server-side proxy target. When using a
different port, update both in `frontend/.env.local`. If the browser calls the API directly, also
include the frontend origin in backend `CORS_ORIGINS`.

## Optional Azure OpenAI Companion

The default installation does not need Azure credentials. With
`AZURE_OPENAI_ENABLED=false` (or unset), the Companion runs the existing rule-based response and
does not send messages to Azure.

To opt in, set these environment variables on the **backend service only**:

| Variable | Required to make requests | Notes |
| --- | --- | --- |
| `AZURE_OPENAI_ENABLED` | Yes | Must parse as `true`, `1`, `yes`, or `on`; default is false. |
| `AZURE_OPENAI_ENDPOINT` | Yes | Azure OpenAI resource endpoint. |
| `AZURE_OPENAI_API_KEY` | Yes | Keep only in the backend's secret manager/environment. |
| `AZURE_OPENAI_DEPLOYMENT` | Yes | Name of your Azure deployment serving GPT-4o; its name need not be `gpt-4o`. |
| `AZURE_OPENAI_API_VERSION` | Yes | A chat-completions API version supported by your resource. |

Copy the placeholders from `backend/.env.example` for local work, fill in values privately, and
restart the API. Do not add credentials to frontend variables, source files, screenshots, logs, or
Git. If enabled with incomplete configuration, the service safely refuses to construct a client and
the Companion returns its rule-based response.

For non-crisis requests with Azure enabled, VADER analyzes up to 1000 characters locally only when
the request explicitly sets `allow_external_processing: true`. Only then can the message and
optional VADER context be sent to the configured deployment. The existing frontend sends only
`message`, so it remains rule-based even when Azure is configured. This is external processing of
sensitive reflection text. Check the Azure resource's data-handling configuration and applicable
user-consent requirements before enabling it. Mindsy does not persist the request or log its
content.

The integration uses the official OpenAI Python SDK's `AsyncAzureOpenAI` client, an eight-second
timeout, zero automatic retries, and bounded prompt/output sizes. Authentication errors, rate
limits, timeouts, connection failures, missing deployments, malformed responses, and unexpected
provider errors all fall back to the unchanged rule-based Companion. Crisis phrase routing runs
first; matching messages are not sent to VADER or Azure. The existing request shape
`{"message": "..."}` remains valid and opts out. Only an informed API client may set
`{"allow_external_processing": true}`; the response structure is unchanged.

The client follows the [OpenAI Python SDK 1.59.7 Azure client API](https://github.com/openai/openai-python/tree/v1.59.7)
and Microsoft's [Azure OpenAI chat-completions guidance](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/chatgpt).
Its deployment/API-version URL was checked with a mocked HTTP transport; no live service was called.
The deployment selected in Azure must serve GPT-4o; Mindsy only receives its deployment name and
cannot independently verify the model behind it.

The current Companion page has static copy that describes the rule-based engine and says no paid AI
provider is needed. This task intentionally preserves that UI. It does not send the consent flag,
so Azure remains unused by the current frontend. Do not enable Azure for end users until an
approved UI update discloses the external processing accurately and gives users a consent choice.

## Production environment

Use a persistent PostgreSQL service rather than ephemeral local SQLite storage:

```text
DATABASE_URL=postgresql+psycopg://<user>:<password>@<host>:5432/<database>
APP_ENV=production
JWT_SECRET=<unique random secret of at least 32 characters>
CORS_ORIGINS=https://<your-frontend-host>
```

An unset `APP_ENV` defaults to `production`; all environments except explicit local
`APP_ENV=development` reject the development JWT secret, example placeholder, or a secret shorter
than 32 characters. Keep credentials in the hosting provider's secret manager. Restrict CORS to
exact frontend origins. The frontend's `NEXT_PUBLIC_API_URL` is public and must never contain a
credential. `API_PROXY_TARGET` is server-side configuration.

The backend creates tables at startup and applies an idempotent, additive migration for four
nullable VADER score columns on existing `mood_entries` tables. This targeted migration preserves
existing rows; it is not a general Alembic migration pipeline. Back up production data and verify
the migration against a staging database before deployment.

## Hosting outline

- **Frontend:** Vercel is a natural Next.js host. Use `frontend` as the root directory and the
  project's npm build command. Other providers need a compatible Next.js runtime/adapter.
- **Backend:** deploy `backend` as a Python ASGI service using
  `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (adapt environment syntax for the host).
- **Database:** configure PostgreSQL and the corresponding SQLAlchemy URL on the API service.
- **Routing:** either configure the frontend to call the API origin directly and allow that origin
  in CORS, or leave `NEXT_PUBLIC_API_URL` empty and point `API_PROXY_TARGET` at the API from the
  Next.js server.

Deploy the Next.js frontend and FastAPI backend described above. The archived Streamlit prototype
in `archive/streamlit-prototype/` is not a supported production entrypoint. It has a separate
legacy Azure path that can send journal text externally without the current backend's
disclosure/opt-in safeguards and can surface provider errors. Do not deploy it for real user data.

No Vercel, Render, Railway, or other provider configuration is committed here. Verify each
provider's current Next.js/Python runtime behavior before deployment.

## Regression and post-deploy checklist

Automated tests use mocks for Azure, and do not require a key or make paid requests:

```powershell
Set-Location backend
.\.venv\Scripts\python.exe -m pytest -q
```

Frontend checks:

```powershell
Set-Location frontend
npm run lint
npm run typecheck
npm run build
```

After deployment, verify:

1. `/api/health` returns an API liveness response.
2. Signup/login, check-in creation, garden stability, journal CRUD, and gratitude CRUD work.
3. Two accounts cannot access each other's records.
4. The Companion works with Azure disabled and returns the expected crisis response.
5. If Azure was intentionally configured, a non-crisis request succeeds; provider failures still
   return the rule-based response. Verify with a controlled deployment and do not expose real
   reflections in logs.
6. Browser requests target the configured API, the frontend has no console errors, and mobile
   layouts remain usable.
7. Review database backups, rate limits, privacy/consent, and verified region-specific crisis
   resources before public use.

## Remaining production work

The automated integration does not make Mindsy a clinical product or prove regulatory compliance.
Before real users, review account deletion, email verification/password recovery, rate limiting,
security headers, audit/operational monitoring, database migrations, data-retention policies, and
crisis resources. See [TECH_STACK_AUDIT.md](TECH_STACK_AUDIT.md) for the latest dependency audit.
The current localStorage token approach is convenient for a demo but is not an httpOnly-cookie
design.
