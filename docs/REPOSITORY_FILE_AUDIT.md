# Repository file audit

## Maintained application

| Area | Role | Disposition |
| --- | --- | --- |
| `frontend/` | Maintained Next.js/React client, static assets, lockfile, and app-local configuration. | Keep; preserve the existing UI. |
| `backend/app/` | FastAPI routes, schemas, models, configuration, database access, and services. | Keep. |
| `backend/tests/` | API, service, migration, authentication, and regression tests. | Keep. |
| `backend/requirements.txt` | Pinned dependencies for the maintained API and its tests. | Keep and update only for reviewed fixes. |
| `docs/` | Architecture, deployment, technology, security, database, privacy, release, and cleanup records. | Keep current. |
| `archive/streamlit-prototype/` | Separate pre-rewrite Streamlit app, helpers, and requirements. | Keep as clearly unsupported history; do not deploy. |

## Cleanup decisions

- The old root Streamlit `app.py`, `utils.py`, and `requirements.txt` were moved intact into
  `archive/streamlit-prototype/` so they cannot be mistaken for the maintained application.
- The redundant `.gitignore.txt` and empty tracked root files named `git` and `main` were removed.
- The root `.gitignore` already excludes virtual environments, caches, build output, databases,
  backups, environment files, and local mood logs; committed `.env.example` templates remain
  allowed.
- Local-only `.env.txt` and `_mood_logs.json` were preserved outside the repository checkpoint;
  neither is part of the maintained app or included in Git.
- No empty application source file or unreferenced tracked asset was identified as part of this
  cleanup. Generated `.next`, `node_modules`, `.venv`, `__pycache__`, and test caches are local
  build/runtime artifacts, not source deliverables.

## Audit boundaries

This inventory describes repository structure and the cleanup in this change set; it is not proof
that every source file is bug-free. The maintained runtime is `frontend/` plus `backend/`. The
archive retains legacy risk and should not receive real user data. Refer to
[REPOSITORY_CLEANUP_REPORT.md](REPOSITORY_CLEANUP_REPORT.md) for validation and remaining work.
