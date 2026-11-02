# Mindsy integration and regression checklist

## Scope and preservation

- [x] Added VADER as a local, non-clinical sentiment service.
- [x] Added Azure OpenAI behind an explicit backend-only opt-in, complete-configuration check, and
  per-request consent flag that defaults to false.
- [x] Kept the existing deterministic Companion, crisis routing, authentication, and frontend
  unchanged; check-in score columns are additive and nullable.
- [x] Added no frontend packages, pages, styling, or environment variables.
- [x] Did not add credentials, perform a live Azure request, or deploy externally.

## Baseline before implementation

| Check | Baseline result |
| --- | --- |
| Backend test suite | 49 passed. |
| Frontend lint | Passed with no ESLint warnings/errors; Next.js reports that `next lint` is deprecated. |
| Frontend TypeScript check | Passed. |
| Git worktree | Clean at `af87f65` before changes. |

## Verification after implementation

| Check | Result |
| --- | --- |
| Backend regression suite | **79 passed**, including check-in persistence, consent/configuration gating, fallback, and legacy-database migration tests. |
| Dependency consistency | `pip check` reports no broken requirements in the backend environment. |
| Dependency vulnerability audit | PyJWT and python-dotenv were updated to patched non-major pins. `pip-audit` still reports 16 advisories across Starlette 0.41.3 and pytest 8.3.4; `npm audit` reports 20 total findings (19 moderate, 1 high), including 2 production-tree findings. See deployment blockers below. |
| Frontend lint | Passed; no warnings or errors. The existing Next.js deprecation notice remains. |
| Frontend TypeScript check | Passed. |
| Frontend production build | Passed in a temporary isolated frontend copy so the active local dev server's `.next` directory was not disturbed. The copy was removed after the build. |
| Local API health | `GET http://127.0.0.1:8011/api/health` returned HTTP 200. |
| Local Companion without Azure | `POST /api/companion` returned HTTP 200 with a non-crisis, rule-based response. |
| Local frontend | `http://localhost:3000/` returned HTTP 200. |
| SDK wiring | OpenAI Python SDK 1.59.7 `AsyncAzureOpenAI` was exercised with `httpx.MockTransport`; the response was parsed and the request used the configured deployment and API version. No network request was made. |
| Azure success/failure paths | Automated tests use mocked SDK clients; timeout, connection, authentication, rate-limit, missing-deployment, malformed/empty response, and fallback paths are covered. |
| Azure runtime configuration | In the checked local runtime, Azure is disabled and required settings are incomplete. No credential values were printed or recorded. |
| Azure opt-in gate | Requests without enabled/complete configuration or `allow_external_processing=true` use the rule-based path before VADER/Azure; the current UI remains opted out. |
| API compatibility | Existing check-in fields remain, with four optional sentiment score fields added. The existing Companion request remains valid and opts out; the optional consent field defaults to false. The Companion response structure is unchanged. |
| Check-in migration | Idempotent startup migration adds four nullable `FLOAT` columns without rewriting existing rows; tested on a legacy SQLite table. |
| Active local database migration | Applied to `backend/mindsy.db` only after a timestamped backup passed SQLite integrity and row-count checks. Integrity remains `ok`; users, check-ins, journals, and gratitude counts remained zero; all four new columns are nullable. The backup is ignored and not staged. |
| UI preservation | No frontend source/configuration files are changed. |
| Formatting/diff check | `git diff --check` passed after the final backend and documentation changes. |

No live Azure inference, production PostgreSQL integration, or external deployment was performed.
Automated tests do not require Azure credentials and make no paid requests.

## Repository cleanup and security follow-up

| Check | Result |
| --- | --- |
| Backend regression tests | **81 passed** in the existing environment. A clean isolated environment using the updated FastAPI 0.162.0 and pytest 9.0.3 pins also passed **81 tests** (one Starlette `TestClient` deprecation warning). |
| Backend dependency consistency | `pip check` reports no broken requirements in the existing environment. |
| Declared backend dependency audit | `pip-audit -r backend/requirements.txt` reports **0 known vulnerabilities** after the FastAPI/pytest update. |
| Existing local environment audit | A full audit reports 39 entries across stale Starlette 0.41.3, pytest 8.3.4, pip 22.3, and setuptools 65.5.0. The API was not restarted or its active environment replaced; this is not evidence that the currently running process has received the fixes. |
| Frontend production dependency audit | `npm audit --omit=dev` reports **0 vulnerabilities** after pinning/overriding PostCSS to 8.5.32. |
| Full frontend dependency audit | **18 moderate development/build-tool findings** remain in the ESLint 8 toolchain; no high or critical findings remain. No force/major upgrade was applied. |
| Frontend lint | Passed in a temporary isolated copy; no lint warnings/errors. Existing `next lint` deprecation notice remains. |
| Frontend TypeScript check | Passed in the temporary isolated copy. |
| Frontend production build | Passed with all 16 static pages generated in the temporary isolated copy; the copy was removed. npm reported an engine warning because the machine has Node 20.11.1 while a lint dependency requests Node 20.19 or newer. CI requests the current Node 20 release. |
| Local servers | Existing API health and frontend requests returned HTTP 200. Neither process was restarted. |
| Credential scan | No tracked `.env`/private-key files or recognizable Azure/OpenAI key patterns were found. Environment examples contain placeholders only. |
| Frontend preservation | No frontend source, UI, styling, or configuration behavior files changed. Only `frontend/package.json` and `frontend/package-lock.json` changed for the PostCSS security fix. |
| CI workflow | `.github/workflows/ci.yml` was added. It has not run on GitHub because no commit/push was requested. |
| Git hygiene | No cleanup commit or push was made. Empty tracked files were removed; prototype files were moved byte-for-byte to the archive. |

## Deployment requirements not yet verified

- [ ] Provision and validate an Azure OpenAI resource and a chat-completions-capable model
  deployment, if the optional service is desired.
- [ ] Configure `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`,
  `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_VERSION`, and
  `AZURE_OPENAI_ENABLED=true` only in the backend's secret manager/environment.
- [ ] Review Azure data handling and user-consent requirements before sending reflections
  externally.
- [ ] Before enabling Azure for end users, separately update the static Companion disclosure to
  explain that messages may be processed by the configured external Azure service and obtain
  informed user consent. The frozen frontend currently cannot opt in.
- [ ] Provision persistent PostgreSQL, production secrets, restricted CORS, and backups; test the
  targeted startup migration against a production-like staging database.
- [ ] Deploy the frontend and backend to chosen providers and verify the hosted URL, API routing,
  authentication, data isolation, crisis response, and mobile behavior.
- [ ] Run a controlled live Azure smoke test only after explicit configuration and approval.
- [ ] Restart/rebuild the local API at an approved time to load the updated backend dependency
  pins and fail-closed JWT configuration; the currently running process was deliberately left
  untouched.
- [ ] Review the remaining moderate frontend development/build-tool advisories before changing the
  ESLint stack. The production frontend dependency audit is clear; the full dev-tree audit is not.
- [ ] Run the new GitHub Actions workflow after the changes are reviewed and pushed.

## Known limitations

- The existing phrase-based crisis router is not a complete risk detector or substitute for human
  assessment. The optional model prompt is not a safety guarantee.
- Account tokens remain in browser `localStorage`.
- There is no committed hosting manifest or external deployment record.
- No regulatory-compliance claim has been assessed or made.
