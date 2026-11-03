# Production readiness baseline

Updated: 2026-11-03

This is a deployment-preparation snapshot, not a security certification or approval to deploy.
No hosting provider, public deployment, production database, or Azure endpoint was accessed or
changed for this work.

## Repository and release state

- Authoritative checkout: `C:\Users\Anushka Srivastava\Desktop\mindsy`.
- Branch: `main`.
- Local HEAD and GitHub `origin/main`: `f0df89763405d20c7d414733c92880847e4b9585`.
- At inspection, the local branch and remote-tracking ref were equal. The remote branch was read
  directly and also returned this commit.
- The worktree is dirty. It includes prior uncommitted authentication/session revocation and
  explicit guest-migration changes, plus the deployment guard changes in this work.
- Nothing has been staged, committed, pushed, or deployed.
- Ignored local `.env` files exist at the repository root and under `backend`; they are not
  tracked. Their values were not printed. The tracked environment examples are templates, not
  deployment credentials.
- `.gitignore` excludes environment files, local databases, build output, and Vercel project
  metadata (`.vercel/`); the safe `.env.example` templates remain trackable.
- No dedicated `gitleaks`, `trufflehog`, or `detect-secrets` command was installed. A redacted
  high-confidence credential-format pattern scan found no matches in tracked/untracked release
  files or in 22 locally available commits. This is not a comprehensive secret scan and does not
  certify the complete Git history as secret-free.

## Deployment configuration prepared

- Render Blueprint: `render.yaml`, Python 3.11.11, `backend` root, Uvicorn on `$PORT`, health path
  `/api/health`, generated JWT secret, and secure dashboard values for the database and CORS.
- Render `autoDeploy` is disabled to require an explicit operator deployment.
- Vercel: use repository root directory `frontend`, Next.js detection, and `npm run build`.
- Vercel server-side API proxy: set `API_PROXY_TARGET` to the backend origin and leave
  `NEXT_PUBLIC_API_URL` unset to use same-origin `/api/*` requests.
- The backend now rejects SQLite and non-psycopg PostgreSQL URLs in `production` and `staging`.
  The required production URL form is `postgresql+psycopg://...`. Production/staging also reject
  missing, wildcard, localhost, non-HTTPS, or non-origin CORS allow-list entries.
- Production Next.js builds now require either `API_PROXY_TARGET` or a direct
  `NEXT_PUBLIC_API_URL`; configured API URLs must use public HTTPS without embedded credentials.
  They no longer silently bake in a localhost or HTTP proxy.
- CI uses `https://api.example.invalid` solely as a non-routable build-time proxy placeholder.
- Azure remains disabled in the Render Blueprint and is not enabled by these changes.

## Verification

| Check | Result | Evidence |
| --- | --- | --- |
| GitHub branch comparison | PASS | `git ls-remote origin refs/heads/main` returned the current local HEAD. |
| Backend regression tests | PASS | Backend virtual environment: `python -m pytest -q` — 96 passed. |
| Backend dependency consistency | PASS | Backend virtual environment: `python -m pip check` — no broken requirements. |
| Declared backend dependency audit | PASS | `pip-audit -r backend/requirements.txt` — no known vulnerabilities. |
| Frontend production dependency audit | PASS | `npm audit --omit=dev` — 0 vulnerabilities. |
| Frontend lint | PASS | `npm run lint` — no ESLint warnings or errors; Next.js prints its `next lint` deprecation notice. |
| Frontend TypeScript | PASS | `npm run typecheck` — passed. |
| Patch whitespace | PASS | `git diff --check` — passed. |
| Credential-pattern scan | PASS, limited | No high-confidence token/private-key patterns in the working release files or 22 available commits; no dedicated scanner was installed, so a full history guarantee is not made. |
| Isolated account/guest browser checks | PASS, scoped | Synthetic guest migration and account checks were previously run on a temporary frontend/backend with a separate SQLite database; see `docs/SECURITY_REMEDIATION.md`. |
| Production proxy guard | PASS | Isolated builds rejected missing API configuration and a localhost HTTP target; a configured HTTPS target built successfully. |
| Production Next.js build | PASS | All 16 routes generated in a temporary frontend copy; the active local app's `.next` output was not touched. |
| PostgreSQL/Neon integration | BLOCKED | No isolated PostgreSQL service or credentials were available. SQLite tests do not establish PostgreSQL readiness. |
| Hosting account configuration and live deployment | NOT TESTED | Requires provider access and explicit user approval. |

## Required provider configuration

Set values in provider secret/environment settings, never in committed files:

| Variable | Service | Requirement |
| --- | --- | --- |
| `APP_ENV` | Render backend | `production`. |
| `JWT_SECRET` | Render backend | Unique random value with at least 32 characters; Render Blueprint generates it. |
| `DATABASE_URL` | Render backend | Persistent PostgreSQL using `postgresql+psycopg://...`; use Neon SSL parameters from its dashboard. |
| `CORS_ORIGINS` | Render backend | Exact HTTPS frontend origin, no path or trailing slash. |
| `AZURE_OPENAI_ENABLED` | Render backend | Keep `false`; no Azure credentials are needed. |
| `API_PROXY_TARGET` | Vercel frontend | HTTPS Render API origin, server-side only. |
| `NEXT_PUBLIC_API_URL` | Vercel frontend | Leave unset for the same-origin proxy setup. If deliberately using direct browser API calls, it is public and the backend CORS origin must match. |

## Blocking items before staging

1. Review the complete release diff and exact file inventory; these changes are not staged.
2. Configure an isolated staging PostgreSQL database and test startup, migration, signup/login,
   persistence, restart behavior, account isolation, and restore procedure.
3. Configure Render/Vercel only after approval. No account is configured by repository files.
4. Run a complete secret scan over current files and Git history with an approved dedicated
   scanner. The local pattern scan is not a substitute.

## Blocking items before public launch

- Complete the privacy, security, accessibility, responsive, performance, dependency, and crisis
  safety audits described in the release directive; current checks cover only a subset.
- Review production data retention, account deletion, backup/restore, monitoring, rate limits,
  security headers, and recovery procedures.
- The production Next.js build was validated with a reserved `.invalid` target, not a live API
  service; deploy-time connectivity remains unverified.
- Complete staging smoke tests on hosted HTTPS URLs, including backend proxy, persistence, logout
  token replay, account isolation, guest transfer, and desktop/mobile behavior.
- Keep Azure disabled unless a separate product/privacy review adds clear user disclosure and
  informed opt-in.
- Review and approve the release diff before staging, committing, pushing, or deploying.

## Current verdict

**Not ready for private staging or public deployment yet.** The repository has usable hosting
configuration and stricter production configuration guards, but PostgreSQL integration, provider
configuration, full security/quality gates, and explicit release approval remain outstanding.
