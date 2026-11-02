# Repository cleanup report

## Changes

- Moved the historical Streamlit prototype and its separate requirements into
  `archive/streamlit-prototype/`, retaining all three files byte-for-byte.
- Added an archive notice that identifies the supported application and warns against deploying
  the legacy prototype with real reflection data.
- Removed the redundant `.gitignore.txt` and two empty tracked root files (`git` and `main`).
- Updated the project README to describe the actual maintained app, archive location, product
  purpose, privacy/safety boundaries, setup, and operating documentation.
- Added focused repository, security, database, and optional-Azure privacy/safety documentation.
- Changed an unset `APP_ENV` default to production and added tests that reject the public default
  JWT secret outside explicit local development.
- Added a targeted patched PostCSS override to address the frontend production dependency advisory;
  its lockfile/build/audit verification is tracked in the release checklist.

## Data safety

The local `.env.txt` and `_mood_logs.json` files were moved outside the repository without changing
their bytes. They were not added to Git. Database files and backups remain ignored. No user
reflection values or credential values are copied into this report.

## Verification and release status

The backend tests passed after the JWT configuration change. A clean candidate environment with
the updated FastAPI and pytest pins passed all 81 tests, and the declared requirements audit is
clean. The isolated frontend install, lint, typecheck, build, and production dependency audit also
passed. The currently running local API was not restarted; its virtual environment still contains
the superseded Starlette and pytest versions. Repository cleanup remains uncommitted and unpushed.
No external deployment or live Azure request is claimed.

See [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) for run-specific results and
[TECH_STACK_AUDIT.md](TECH_STACK_AUDIT.md) for dependency and service status.
