# Mindsy architecture

## 1. System shape

```
Browser (Next.js 15 App Router)
   │
   │  fetch `${NEXT_PUBLIC_API_URL}/api/...`
   │  (empty base → same-origin /api proxy in next.config.ts)
   ▼
FastAPI (Python; 3.11 tested locally)
   │  routers → services → SQLAlchemy 2 → SQLite | PostgreSQL
   ▼
users · mood_entries · journal_entries · gratitude_notes
```

Two client modes share one UI:

- **Guest** — check-ins, journal entries and gratitude notes live in `localStorage` and are
  rendered through the same components.
- **Account** — a JWT is stored locally, the API becomes the source of truth, and the garden
  geometry comes from `GET /api/garden`.

`MindsyProvider` is the single seam: every page reads `entries`, `plants`, `journal`,
`gratitude` and the mutation functions from it, so no page knows which storage layer is active.

## 2. Data model

### User
| Column | Type | Notes |
| --- | --- | --- |
| id | UUID string (PK) | |
| name | string(80) | collapsed whitespace |
| email | string(255) unique indexed | stored lower-case |
| password_hash | string(255) | bcrypt |
| created_at | datetime | naive UTC |

### MoodEntry
| Column | Type | Notes |
| --- | --- | --- |
| id | UUID string (PK) | seed for the garden hash |
| user_id | FK users.id, cascade | indexed |
| created_at | datetime | naive UTC, optional client timestamp on create |
| primary_mood | string(32) | validated against the mood catalogue |
| emotions | JSON list | de-duplicated, 1–8 entries |
| energy | string(16) | low / medium / high |
| note | text, nullable | trimmed, ≤4000 chars |
| tags | JSON list | subset of the tag catalogue |

### JournalEntry
`id, user_id, title(120), body(text), mood (nullable), created_at, updated_at`

### GratitudeNote
`id, user_id, text(280), created_at`

**PostgreSQL readiness:** only portable types are used (`String`, `Text`, `DateTime`, generic
`JSON`, `Boolean`-free schema). Switching `DATABASE_URL` to `postgresql+psycopg://…` requires no
model changes; add Alembic for managed migrations before production traffic.

**Timestamps:** SQLite drops offsets, so everything is stored as naive UTC and serialised with an
explicit `Z` by `schemas/common.iso_utc`. Without that a browser would read stored times as local
time and shift every date.

## 3. API surface

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | – | Create account, returns token + user |
| POST | `/api/auth/login` | – | Verify credentials |
| GET | `/api/auth/me` | Bearer | Current profile (session restore) |
| POST | `/api/auth/logout` | Bearer | Explicit sign-out acknowledgement |
| GET | `/api/entries` | Bearer | Check-ins, newest first |
| POST | `/api/entries` | Bearer | Create a check-in |
| GET | `/api/entries/{id}` | Bearer | Single check-in (owner only) |
| DELETE | `/api/entries/{id}` | Bearer | Remove a check-in and its flower |
| GET | `/api/garden` | Bearer | Derived plants + overlay data |
| GET | `/api/journal` | Bearer | List/search (`q`, `mood`) |
| POST | `/api/journal` | Bearer | Create |
| PATCH | `/api/journal/{id}` | Bearer | Update |
| DELETE | `/api/journal/{id}` | Bearer | Delete |
| GET | `/api/gratitude` | Bearer | List notes |
| POST | `/api/gratitude` | Bearer | Add a note |
| DELETE | `/api/gratitude/{id}` | Bearer | Remove a note |
| POST | `/api/companion` | – | Supportive reply (guests included) |
| GET | `/api/health` | – | Liveness |

Errors: `401` unauthenticated, `409` duplicate email, `422` validation, `404` for any row the
caller does not own (deliberately not `403`, which would confirm existence).

## 4. Authentication flow

1. Signup hashes the password with bcrypt (72-byte truncation handled explicitly) and returns a
   JWT (`HS256`, `sub = user.id`, `exp = now + 7 days`).
2. The client stores the token and sends `Authorization: Bearer <token>`.
3. `deps.get_current_user` decodes the token, loads the user and rejects anything invalid with a
   single generic 401.
4. On load the provider calls `/api/auth/me`; an invalid token clears local state and falls back to
   guest mode rather than leaving a half-authenticated UI.

**Guest → account migration:** on the first successful signup/login, the provider posts any local
check-ins, journal entries and gratitude notes to the API and then clears local storage. Check-in
`created_at` is accepted (bounded to the last 400 days, never in the future) so a guest's history
keeps its real dates and the garden keeps its growth timeline.

## 5. The Living Garden

Geometry is a pure function of the check-in id plus its age:

```python
digest = fnv1a(entry.id)          # 32-bit, identical in Python and TypeScript
x      = 8 + (digest % 85)        # 8–92 % of the container width
row    = (digest >> 8) % 3        # 0 = back, 1 = middle, 2 = front
y      = (62, 72, 82)[row] + (digest >> 12) % 5
variant = (digest >> 4) % 4
scale  = row_scale * growth_scale * (1 + jitter)
```

- **Species** — `principal_mood → MOOD_PLANTS`, or `blossom` when three or more feelings were
  named.
- **Growth** — under 24 h is a seedling, under 7 days is growing, older is full bloom.
- **Containment** — the scene is `relative overflow-hidden`; plants are anchored with
  `left: x%` and `bottom: 100 - y%`, translated `-50%` horizontally, and drawn bottom-up. Nothing
  can escape the container.
- **No duplicates** — there is no “plant row” to insert. Reading the garden twice is idempotent;
  the same id always yields the same plant.
- **Rendering** — `Flower.tsx` draws original SVG botanicals (11 species, growth-dependent petal
  layers), not emoji.

`GET /api/garden` exists so the garden is also a first-class API resource and is covered by tests.
The frontend mirrors the algorithm for guest gardens, so both modes look identical.

## 6. Insights and Mood Weather

Computed client-side from the visible check-ins, so guests get them too and no extra round trip is
needed. Insights produce counts, percentages, a 14-day series, a streak and bounded narrative
observations. Language is deliberately probabilistic (“you may have noticed…”), never diagnostic.

## 7. Companion safety

`services/companion.py` is rule-based:

1. Crisis phrases are checked first and short-circuit to safety copy that names local emergency
   services and the Befrienders Worldwide directory — no invented phone numbers.
2. Otherwise a tone is detected from keyword groups and a deterministic reflection plus up to
   three suggestions is returned.
3. Every reply carries a disclaimer that this is not a therapist, doctor or emergency service.

Wiring a language model later should keep steps 1 and 3 outside the model call.

## 8. Accessibility and motion

- Semantic landmarks, one `h1` per page, labelled inputs, `aria-pressed` on toggles.
- Flower buttons are real buttons with descriptive labels; the overlay is a labelled modal with
  Escape-to-close, focus on open, and body scroll lock.
- Decorative layers are `aria-hidden` and `pointer-events-none` — they can never block a click.
- `prefers-reduced-motion` is honoured globally, and the breathing circle additionally stops
  scaling while keeping its textual countdown.

## 9. Deliberate trade-offs

| Decision | Why | Cost |
| --- | --- | --- |
| Derived garden instead of a `garden_plants` table | Cannot duplicate or drift; no migration needed | Geometry algorithm duplicated in Python and TS |
| JWT in `localStorage` | Simple cross-origin deployment, no cookie/CSRF plumbing | Readable by XSS; see DEPLOYMENT hardening |
| `create_all` instead of Alembic | One-command start for reviewers | No managed migrations; add Alembic before production |
| SQLite default | Zero setup | Not safe for ephemeral serverless filesystems |
| Insights computed client-side | Works for guests, instant | Not available to third-party API consumers |

## 10. Risks and next steps

- Add rate limiting to `/api/companion` and `/api/auth/*` before public exposure.
- Move tokens to httpOnly cookies when auth hardening matters.
- Add Alembic migrations and a PostgreSQL instance for production.
- Region-specific, verified crisis resources per deployment locale.
- Optional: image export of the garden, and reminders.
