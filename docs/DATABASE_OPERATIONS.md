# Database operations

## Supported configurations

- Local development defaults to SQLite at `backend/mindsy.db`.
- Hosted deployments should use persistent PostgreSQL configured through `DATABASE_URL` and the
  declared `psycopg` driver. Ephemeral SQLite disks are not suitable for durable user data.
- SQLAlchemy creates missing tables at startup. Startup also applies an idempotent additive update
  for four nullable VADER score columns on an existing `mood_entries` table. This is not a general
  migration framework.

## Backups

Before deploying a schema change or upgrading a database, take a provider-native backup and verify
that it can be restored to an isolated staging database.

For local SQLite, stop the API before copying the database, or use SQLite's online backup API.
Example with the SQLite CLI from the repository root:

```powershell
New-Item -ItemType Directory -Force backend\backups
sqlite3 backend\mindsy.db ".backup 'backend\backups\mindsy-before-change.db'"
sqlite3 backend\backups\mindsy-before-change.db "PRAGMA integrity_check;"
```

The integrity check should return `ok`. Keep backups out of Git; `backend/backups/` and local
database files are ignored. Treat backups as sensitive user data and apply access/retention
controls.

For PostgreSQL, use the hosting provider's managed backup when available. `pg_dump --format=custom`
and `pg_restore` are standard alternatives; test restores only against an isolated target and never
use a destructive restore option against a database containing data you need.

## Schema change and recovery

The VADER update adds `sentiment_positive`, `sentiment_negative`, `sentiment_neutral`, and
`sentiment_compound` as nullable floating-point columns. Existing rows remain valid with `NULL`
scores, and the startup update checks for each column before adding it. Do not delete/recreate the
database to apply this update.

For a failed deployment, stop writes, preserve the current database and logs, restore a verified
backup to a separate database, check integrity and row counts, then point the service at the
restored database only after an operator reviews it. The application does not currently provide
automated backup scheduling, point-in-time recovery, or a full migration/rollback command.

## Deployment checks

1. Verify the configured database URL and credentials in the hosting secret store.
2. Verify backups and an isolated restore before the first production migration.
3. Check `/api/health`, then exercise authentication and CRUD with a test account.
4. Confirm user scoping and existing row counts; do not use real reflections as test fixtures.
5. Record the migration outcome without logging connection strings or user content.
