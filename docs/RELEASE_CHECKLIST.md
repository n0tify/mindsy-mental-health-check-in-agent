# Mindsy release checklist

**Run date:** 2026-11-03
**Result:** local checks are substantially verified; GitHub release and external deployment are
not complete.

## Workspace and preservation

- [x] Created a source-only recovery archive before audit edits (`mindsy-preaudit-checkpoint.zip`
  in the local temporary directory).
- [x] Kept the existing route/component design; no visual or layout changes were made.
- [x] The original workspace had no `.git`; the release tree was based on a fresh clone of the
  target's existing `main` at `0ae297cc3ae7dc3b828cbcc27e4a94a1ed367108`.
- [x] Preserved the original Streamlit prototype and remote history while adding the redesigned
  frontend, backend, and audit/deployment documentation.
- [x] Reviewed 90 staged paths. No `.env`, `.env.local`, database, dependency directory, build
  output, cache, or credential-shaped key was staged.

## Checks run

| Check | Result |
| --- | --- |
| Frontend lockfile install (`npm ci`) | Passed against the final lockfile. npm reports an engine warning for `eslint-visitor-keys` on the installed Node 20.11.1 and 20 audit advisories. |
| TypeScript (`npm run typecheck`) | Passed. |
| ESLint (`npm run lint`) | Passed with no warnings/errors. `next lint` reports deprecation in Next.js 15. |
| Frontend production build (`npm run build`) | Passed; all 14 app routes were built and static pages generated. |
| Backend tests (`pytest -q`) | 49 passed, including production-secret validation. |
| Python compilation and package consistency | `compileall` and `pip check` passed after the config changes and PostgreSQL driver install. |
| Local `.env` loading / production secret guard | Confirmed the backend loads the generated local secret; unit and runtime checks reject unsafe production secrets. |
| API health / proxy | Backend `/api/health` and frontend `/api/health` proxy both returned HTTP 200 after final restart. |
| Database | SQLite development path exercised by the tests. A production PostgreSQL server was not available for an integration test. |
| Secret scan | No credential-shaped API keys were found in current checked source. The known development JWT default is explicitly guarded in production. Remote Git history was not scanned. |
| npm audit | 19 moderate and 1 high advisories. The high issue is nested PostCSS under Next.js 15.5.28; automatic remediation required a breaking Next.js 16 upgrade and was not applied. |

## Remaining release blockers / external setup

- [x] Rechecked backend health, frontend API proxy, and all 13 direct frontend routes after the
  final service restart; every response was HTTP 200.
- [x] Checked the home page at 390px and 1440px viewport widths; neither had horizontal overflow.
- [ ] Decide on a compatible remediation for the frontend dependency advisories; do not use
  `npm audit fix --force` without a tested Next.js major-version migration.
- [ ] The current redesigned workspace does not implement VADER, Azure GPT-4o, text-to-speech, or
  optional calming audio. The remote Streamlit prototype contains partial implementations, but
  credentials/live operation and some dependencies are unverified. Porting these into the current
  UI would change behavior and visible controls, so it was not done under the preservation rules.
- [ ] Provide production Azure credentials only if the integrations are intentionally ported; never
  put them in the frontend or commit them.
- [ ] Configure `APP_ENV=production`, a unique JWT secret of at least 32 characters,
  `DATABASE_URL`, `CORS_ORIGINS`, and frontend production API URL on hosting.
- [ ] Provision a persistent PostgreSQL database and test its connection/backup policy.
- [ ] A real hosted deployment still requires a provider account/authorization and production
  settings. No Vercel, Render, Railway, or GitHub CLI credentials were available in this session.
- [ ] Verify hosted routes, desktop/mobile behavior, user data isolation, crisis response, and
  production logs after deployment.
