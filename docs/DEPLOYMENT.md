# Deploying Mindsy

Two deployables: the **frontend** (static/Next server) and the **backend** (Python API). They can
share a domain or live on separate hosts.

---

## 0. Local development

Use Python 3.11 or newer and Node.js 20 or newer. From the repository root, create the backend
environment and local configuration:

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Replace the example `JWT_SECRET` in `backend/.env` with a random value, then run:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8010
```

In another terminal:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. If port 8010 is already in use, select an unused backend port and
set both `NEXT_PUBLIC_API_URL` and `API_PROXY_TARGET` in `frontend/.env.local` to that API URL.
The backend loads `backend/.env`; keep this file out of version control.

---

## 1. Production database

SQLite is fine locally but not on ephemeral or serverless filesystems. Use PostgreSQL:

```env
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/mindsy
```

The PostgreSQL driver is included in `backend/requirements.txt`. Tables are created on startup;
for a long-lived project, add Alembic before you have real user data.

---

## 2. Backend (Render / Railway / Fly.io / any Python host)

Build and start:

```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Environment variables:

| Variable | Required | Example |
| --- | --- | --- |
| `APP_ENV` | yes | `production` |
| `DATABASE_URL` | yes | `postgresql+psycopg://…` |
| `JWT_SECRET` | yes | A unique random value of at least 32 characters |
| `ACCESS_TOKEN_DAYS` | no | `7` |
| `CORS_ORIGINS` | yes | `https://mindsy.vercel.app,https://mindsy.app` |

Notes:

- `CORS_ORIGINS` must list the exact frontend origins (scheme + host, no trailing slash). Wildcards
  are intentionally not used.
- The API refuses to start in production if `JWT_SECRET` is the development default, an example
  placeholder, or shorter than 32 characters.
- Health check: `GET /api/health` → `{"status":"ok"}`.
- Interactive docs: `/docs`.

---

## 3. Frontend (Vercel or Netlify)

```bash
cd frontend
npm ci
npm run build
```

Vercel: import the repository, set **Root Directory** to `frontend`, framework preset **Next.js**.
Netlify: base directory `frontend`, build command `npm run build`, publish `.next` via the Next
runtime.

Environment variables:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://your-api-host.example.com` |
| `API_PROXY_TARGET` | optional; only used when `NEXT_PUBLIC_API_URL` is empty |

`NEXT_PUBLIC_*` values are baked in at build time — redeploy after changing them.

Alternative single-origin setup: leave `NEXT_PUBLIC_API_URL` empty and set
`API_PROXY_TARGET=https://your-api-host.example.com`. The browser then calls the frontend origin
and Next proxies `/api/*`; CORS is not involved. Make sure your platform allows the proxy to make
outbound requests.

---

## 4. Post-deploy checks

1. `GET https://your-api/api/health` returns ok.
2. Signup creates an account; the network tab shows `201` and no password in the response.
3. Reload the page — the session persists.
4. Complete a check-in and confirm `POST /api/entries` returns `201`.
5. Open the garden: exactly one plant; refresh: same plant, no duplicate.
6. Sign out, sign in again: check-ins, journal and gratitude are still there.
7. Two accounts cannot see each other's data.
8. `/api/companion` replies, and crisis phrasing returns the safety copy.
9. Browser console has no errors; all API requests use the configured base URL (no `localhost`).
10. Mobile widths: navigation wraps, the garden stays inside its container, flowers are tappable.

---

## 5. Hardening checklist

- [ ] Strong random `JWT_SECRET`, rotated if ever exposed.
- [ ] HTTPS only; HSTS at the edge.
- [ ] `CORS_ORIGINS` restricted to real frontend origins.
- [ ] Rate limit `/api/auth/*` and `/api/companion`.
- [ ] Move the access token to a short-lived httpOnly cookie + CSRF protection.
- [ ] Add security headers (CSP, `X-Content-Type-Options`, `Referrer-Policy`).
- [ ] Automated database backups.
- [ ] Alembic migrations in the deploy pipeline.
- [ ] Region-specific, verified crisis resources on the Support page.
- [ ] Error monitoring (Sentry or similar) on both services.

---

## 6. Not production-ready as-is

Be explicit with reviewers: this repository is a portfolio-quality implementation, not a clinical
product. It has no clinical review, no GDPR/data-deletion workflow, no email verification, no
password reset, and no audit logging. Those are deliberate scope boundaries, not oversights.
