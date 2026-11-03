# Deploying Mindsy

Mindsy runs as a Next.js frontend and a Python API. The repository includes a Render Blueprint for
the API. Vercel's built-in Next.js support is configured through the Vercel project settings; no
custom Vercel configuration file is required. No external deployment or live Azure request is
verified by this repository configuration.

The Render Blueprint has automatic deployments disabled so syncing it does not itself publish new
commits. This repository does not contain Vercel account settings; do not connect or deploy a Vercel
project until the release diff is reviewed and deployment is explicitly approved.

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
the migration against a staging database before deployment. Production and staging startup reject
SQLite and PostgreSQL URLs that do not explicitly select the installed `psycopg` 3 driver; use
`postgresql+psycopg://...`. Development and test environments can continue to use SQLite.

## Render backend

The root `render.yaml` Blueprint defines a Python web service rooted at `backend`, installs
`backend/requirements.txt`, starts Uvicorn on Render's `$PORT`, pins Python 3.11.11, and uses
`/api/health` as its service health-check path. It generates `JWT_SECRET` in Render and prompts for
`DATABASE_URL` and `CORS_ORIGINS` rather than storing either in Git. Keep `AZURE_OPENAI_ENABLED`
false; no Azure credentials are needed. `autoDeploy: false` requires an operator to explicitly
deploy a reviewed revision.

When creating or syncing the Blueprint, provide these values through Render's secure environment
settings:

- `DATABASE_URL`: the Neon connection URL using SQLAlchemy's psycopg 3 dialect, for example
  `postgresql+psycopg://<user>:<password>@<host>:5432/<database>?sslmode=require`. Start from Neon
  connection details, keep the host/database/SSL parameters, and use the `postgresql+psycopg://`
  scheme because the backend installs `psycopg[binary]`, not psycopg2.
- `CORS_ORIGINS`: the exact production Vercel origin, such as `https://<your-project>.vercel.app`;
  add a custom domain only if one is assigned. Do not include paths or a trailing slash.

The health endpoint confirms the API process responds; it does not check database connectivity.
Verify database connectivity with a non-destructive authenticated signup/login and data persistence
test after both services are configured. The backend applies its existing additive nullable-column
migration on startup; back up the Neon database and verify the migration in staging before
production use.

## Vercel frontend

Import the same GitHub repository as a Vercel project, set **Root Directory** to `frontend`, and
use the existing Next.js framework detection and `npm run build` command. The project already
rewrites `/api/*` server-side using `API_PROXY_TARGET` in `frontend/next.config.ts`.

In Vercel's Production environment variables, set `API_PROXY_TARGET` to the Render API origin
(for example `https://<your-render-service>.onrender.com`) and leave `NEXT_PUBLIC_API_URL` unset.
The browser then makes same-origin `/api/*` requests through Next.js, which forwards them to Render;
the browser does not need the backend hostname and direct cross-origin CORS is avoided. If using a
direct browser-to-API URL instead, set `NEXT_PUBLIC_API_URL` to the Render origin and allow the
exact Vercel origin in Render's `CORS_ORIGINS`. Never put backend secrets in `NEXT_PUBLIC_*`
variables.

Vercel environment changes require a new deployment to take effect. Preview deployments need their
own intended API target and must not accidentally use production user data.
Production builds fail if neither `API_PROXY_TARGET` nor `NEXT_PUBLIC_API_URL` is configured, rather
than silently creating a localhost proxy. The CI build sets a reserved `.invalid` proxy target only
to validate compilation; it is not a usable service URL.

## Deploy sequence

1. Create a Neon PostgreSQL database and keep its connection details private.
2. Create/sync the Render Blueprint from `render.yaml`; select an instance plan in Render and supply
   the Neon URL and eventual Vercel production origin in the secure prompts/settings.
3. Wait for the Render service to deploy and check its `/api/health` endpoint.
4. Import the GitHub repository into Vercel with `frontend` as its root, set
   `API_PROXY_TARGET` to the Render origin, and deploy.
5. Test the hosted frontend, signup/login, authenticated check-in persistence after refresh, journal,
   garden, Companion, crisis routing, and account data isolation. Check mobile and desktop layouts.
6. Confirm no secrets are present in browser bundles or GitHub. Keep Azure disabled; the current UI
   does not disclose external AI processing or send the explicit consent field.

Deploy the Next.js frontend and FastAPI backend described above. The archived Streamlit prototype
in `archive/streamlit-prototype/` is not a supported production entrypoint. It has a separate
legacy Azure path that can send journal text externally without the current backend's
disclosure/opt-in safeguards and can surface provider errors. Do not deploy it for real user data.

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
crisis resources. Provision and test a separate staging PostgreSQL database, backups, restore, and
provider settings before staging or public deployment. The API health endpoint is a liveness check,
not ongoing database readiness monitoring. See [TECH_STACK_AUDIT.md](TECH_STACK_AUDIT.md) for the
latest dependency audit.
The current localStorage token approach is convenient for a demo but is not an httpOnly-cookie
design.
