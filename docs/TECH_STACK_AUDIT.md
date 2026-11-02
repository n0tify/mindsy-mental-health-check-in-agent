# Mindsy technology and integration audit

## Scope and evidence

This audit distinguishes the maintained Next.js/FastAPI application from the archived Streamlit
prototype. Integration code, deployment configuration, and successful live service use
are separate claims.

| Status | Meaning |
| --- | --- |
| **IMPLEMENTED** | The corresponding source and dependency/configuration support are present. |
| **CONFIGURED** | Required runtime settings are present and enabled in the environment being checked. |
| **VERIFIED** | The behavior passed a test or a successful end-to-end request; the verification method
  is stated explicitly. |

## VADER and Azure OpenAI status

| Capability | Implementation | Configuration | Verification |
| --- | --- | --- | --- |
| VADER sentiment | **IMPLEMENTED** in `backend/app/services/sentiment.py`; local check-in processing analyzes non-empty notes and persists nullable compound, positive, negative, and neutral scores. Analysis uses the first 1000 trimmed characters for longer notes. | **CONFIGURED** by the pinned `vaderSentiment` dependency; no credentials or remote service required. | **VERIFIED** by positive, negative, mixed, neutral, empty, long-text, persistence, failure-fallback, legacy-migration, and account-isolation tests. |
| Azure OpenAI response | **IMPLEMENTED** in `backend/app/services/azure_openai.py` with official `AsyncAzureOpenAI`, bounded output, 8-second timeout, and zero SDK retries. | **NOT CONFIGURED** in the checked local environment: Azure is disabled and required settings are incomplete. | **VERIFIED** for the mocked SDK success/error paths and Companion fallback. **NOT VERIFIED** against a live Azure deployment. |
| Crisis routing | Existing rule-based phrase check runs before VADER/Azure. | Does not depend on Azure settings. | **VERIFIED** by API tests asserting crisis requests do not invoke either optional service. |
| Check-in API contract | Existing check-in fields remain; four nullable sentiment score fields are additive. Existing rows without scores remain valid. | Guest check-ins remain browser-local; scores are computed after the existing account migration submits a note to the API. | **VERIFIED** by API persistence, empty-note compatibility, legacy-schema migration, and account-isolation tests. |
| Companion API contract | Existing response fields are unchanged. The request accepts an optional `allow_external_processing` boolean that defaults to false. | Existing frontend sends only `message`, so it never opts in. | **VERIFIED** by tests for explicit consent, default opt-out, crisis precedence, and the exact response field set. |

Azure uses the configured `AZURE_OPENAI_DEPLOYMENT` value as the model/deployment identifier. The
operator must point it at a deployment serving GPT-4o; the code does not assume it is named
`gpt-4o` and cannot verify its underlying model. Presence of an endpoint variable or code is not
evidence that credentials, deployment, or live inference are configured.
The checked runtime reported Azure disabled and incomplete; no secret values were printed or
recorded.

## Maintained application stack

| Technology | Evidence | Status |
| --- | --- | --- |
| Next.js App Router / React | `frontend/package.json`, `frontend/src/app/`, and shared components. | **IMPLEMENTED**; lint and TypeScript checks pass locally. |
| TypeScript | Application source is `.ts`/`.tsx`; strict TypeScript configuration and `npm run typecheck`. | **IMPLEMENTED AND VERIFIED** by typecheck. |
| Tailwind CSS | Tailwind config and application utility classes. | **IMPLEMENTED**; frontend files were not changed for this integration. |
| Framer Motion / Lucide | Declared frontend dependencies and imported by UI components. | **IMPLEMENTED**. |
| FastAPI / Uvicorn | Backend app, routers, ASGI entrypoint, and local API tests. | **IMPLEMENTED AND VERIFIED** by backend tests and the local health check. |
| Pydantic v2 | API request/response validation and serialization schemas. | **IMPLEMENTED AND VERIFIED** by backend tests. |
| SQLAlchemy / SQLite | Relational models and default local database configuration. | **IMPLEMENTED AND VERIFIED** by existing API tests. |
| PostgreSQL / psycopg | SQLAlchemy URL support and declared psycopg binary driver. | **IMPLEMENTED**; a production PostgreSQL integration test was not performed. |
| PyJWT / bcrypt | Bearer-token security and password hashing service. | **IMPLEMENTED AND VERIFIED** by existing authentication tests. |
| Browser `localStorage` | Guest data and session token storage in the frontend provider. | **IMPLEMENTED**; data is browser-local and JavaScript-accessible. |

Resolved frontend package versions can differ within the ranges in `frontend/package.json`. The
backend requirements pin FastAPI 0.162.0, Uvicorn 0.34.0, SQLAlchemy 2.0.36, Pydantic 2.10.4,
PyJWT 2.15.0, bcrypt 4.2.1, python-dotenv 1.2.2, OpenAI 1.59.7, and vaderSentiment 3.3.2.

## Companion behavior and privacy

1. The existing deterministic `respond()` runs first. If it marks a request as a crisis, its
   response returns immediately; no sentiment analyzer or Azure request is used.
2. With Azure disabled, incompletely configured, or per-request consent absent, the existing
   rule-based response returns before VADER runs; the message is not sent externally.
3. With Azure enabled, fully configured, and `allow_external_processing=true`, VADER analyzes only
   the current bounded message in process. If VADER
   initialization or scoring fails, a warning logs the exception type only and the AI path may
   continue without sentiment context.
4. The Azure service requires all four non-empty endpoint/key/deployment/API-version settings.
   Missing configuration or SDK/provider failures return the original rule-based reply.
5. The response retains `reply`, `tone`, `suggestions`, `crisis`, and `disclaimer`. The separate
   check-in response adds four optional VADER score fields; no frontend changes were required.

Only when enabled, fully configured, and the request sets `allow_external_processing=true` are the
message and derived score sent to Azure. The app does not persist this request or log its contents,
but external processing is a real privacy boundary. Azure retention/handling depends on the account
and resource configuration. No HIPAA, GDPR, or other compliance claim is made. Phrase-based crisis
detection is not comprehensive clinical assessment. The current frontend sends only `message` and
therefore cannot opt in; its static copy describes a rule-based engine and no paid AI provider. The
UI is unchanged here, so Azure must not be enabled for end users until an approved UI update
discloses external processing and offers a consent choice.

## Legacy Streamlit prototype

`archive/streamlit-prototype/app.py`, `utils.py`, and `requirements.txt` are historical prototype
files, not part of the maintained app:

- `utils.py` contains VADER sentiment and Azure client calls, but its output is not wired into the
  current Next.js/FastAPI Companion.
- The legacy Azure code uses `AZURE_ENDPOINT`, `AZURE_DEPLOYMENT`, and
  `AZURE_OPENAI_API_KEY`; the maintained integration uses the documented `AZURE_OPENAI_*` names.
- The prototype's `show_mood_trend()` references `st.pyplot` although `st` is not imported in
  `utils.py`. The prototype also imports `pyttsx3`, which is absent from its archived
  `requirements.txt`.
- Root-level prototype code has not been used to verify the current API integration.

Do not describe prototype-only Azure/VADER calls as verified in the redesigned application.

## Dependency audit and release blockers

The maintained backend requirement set now passes `pip-audit -r backend/requirements.txt`; the
FastAPI and pytest pins were updated after all 81 backend tests passed in an isolated clean
environment. The declared requirements audit reports no known advisories. A full audit of the
existing local virtual environment still reports 39 entries across its stale Starlette 0.41.3,
pytest 8.3.4, pip 22.3, and setuptools 65.5.0 installations (including duplicate advisory aliases).
The active local API was not restarted or modified; it continues to use its pre-update process and
installed packages until an operator schedules a restart/reinstall.

The frontend production tree now passes `npm audit --omit=dev` with zero findings. A targeted
PostCSS 8.5.32 update and lockfile override fix the vulnerable nested Next.js dependency without
upgrading Next.js or changing frontend source. A full `npm audit` still reports 18 moderate
development/build-tool findings in the ESLint 8 toolchain. They are not in the production
dependency tree, but are still part of the build supply chain and should be reviewed before
changing the lint stack. `npm audit fix --force` was not applied because it proposes major-version
changes.

The root Streamlit prototype is independently excluded as a production entrypoint; its Azure
privacy path is not the supported API integration.

## Deployment and test status

- A GitHub Actions workflow now runs backend tests, dependency consistency and Python audit checks,
  plus frontend production audit, lint, typecheck, and build. No hosted deployment was performed.
- `GET /api/health` is a liveness response; it does not verify Azure or database connectivity.
- Azure integration tests mock `AsyncAzureOpenAI`; no paid or live calls run in automated tests.
- Production PostgreSQL, actual Azure credentials, live Azure inference, and host-level deployment
  behavior remain unverified.
- See [DEPLOYMENT.md](DEPLOYMENT.md) for configuration and post-deploy checks and
  [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) for the run-specific verification record.
