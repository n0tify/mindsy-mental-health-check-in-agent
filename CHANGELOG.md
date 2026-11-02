# Changelog

## Unreleased

- Archived the unsupported Streamlit prototype separately from the maintained app and clarified
  setup, architecture, safety, privacy, and database operations.
- Changed an unset API `APP_ENV` to fail closed as production and require a unique JWT secret
  outside explicit local development.
- Updated FastAPI/Starlette and pytest pins after isolated regression tests; added CI checks and a
  targeted patched PostCSS lockfile override.

## 1.0.0 — initial complete build

Built as one coherent system rather than a patched-up prototype. Every phase was verified before
the next began.

### Foundation
- Repository layout: `frontend/`, `backend/`, `docs/`, `.gitignore`, MIT licence.
- Pastel design system in Tailwind: lavender, blush, sky, mint, peach, butter.
- Times New Roman enforced globally, including form controls.
- Non-interactive atmosphere layer (`pointer-events-none`, `aria-hidden`).

### Backend
- FastAPI app with lifespan table creation, CORS allow-list and `/api/health`.
- SQLAlchemy 2 models: users, mood entries, journal entries, gratitude notes.
- Pydantic v2 contracts with server-side validation (moods, energy, tags, lengths, bounded
  timestamps).
- bcrypt password hashing and HS256 JWT auth with a bearer dependency.
- Ownership-scoped queries returning `404` for foreign ids.
- Endpoints for auth, check-ins, garden, journal (with search), gratitude and companion.
- Deterministic garden service plus a crisis-aware, rule-based companion.

### Frontend
- `MindsyProvider`: one seam for guest and account modes, session restore and guest migration.
- Floating pastel navigation with active states, hover lift and mobile “More” disclosure.
- Home, Check-in, Garden, Insights, Journal, Joy Deck, Breathe, Mood Weather, Gratitude,
  Companion, Support, Login and Signup.
- Original SVG botanical illustrations for 11 species with growth-dependent petal layers.
- Contained, clickable garden with an accessible detail overlay.
- Guest storage, search, editing, deletion and empty states throughout.
- Reduced-motion support, labelled controls and keyboard-dismissible overlays.

### Verification
- 43 backend tests passing (auth, isolation, check-ins, garden stability, journal, gratitude,
  companion).
- Strict TypeScript check clean; production `next build` succeeds for every route.
- Golden path verified end to end: check-in → API → garden → refresh → no duplicate.

### Fixes made during the build
- Removed a circular model import by switching relationships to `TYPE_CHECKING` imports.
- Corrected the security module's relative import.
- Added `response_model=None` to `204` delete routes (FastAPI rejects a body on 204).
- Typed the breathing phases so literals could not narrow the union.
- Upgraded Next.js to a patched release after npm flagged a vulnerability.
