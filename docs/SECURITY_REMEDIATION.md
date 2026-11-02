# Security review and remediation

## Review finding

The API previously defaulted `APP_ENV` to `development`. The publicly known development JWT secret
was rejected only when the environment name was exactly `production`. An exposed deployment with
an unset or misspelled environment could therefore start with the example secret and accept forged
HS256 bearer tokens.

## Remediation

- An unset `APP_ENV` now defaults to `production`.
- The default/example JWT secret is accepted only when `APP_ENV=development` is explicitly set.
- Every other environment requires a non-placeholder secret of at least 32 characters; otherwise
  application startup fails with a configuration error.
- The committed `backend/.env.example` explicitly selects `development` for local setup and
  contains no production credential.
- Tests cover the fail-closed unset case, staging, valid production configuration, and the explicit
  development case.

Generate and configure a unique production secret in the hosting provider's secret manager. Do not
deploy with `APP_ENV=development`, and do not commit a real `.env` file.

The already-running local API was intentionally not restarted. Its process and installed virtual
environment still use the pre-update code/dependencies until the operator chooses to restart it;
the repository change does not retroactively change a running process.

## Remaining risks and scope

This is a targeted configuration fix, not a complete security certification. The current frontend
stores account JWTs in `localStorage`; a successful script injection could read them. The
rule-based crisis phrase router is incomplete and is not an emergency service. Rate limiting,
account deletion/recovery, operational monitoring, production PostgreSQL hardening, and a
deployment-specific security review remain release work. See
[DEPLOYMENT.md](DEPLOYMENT.md) and [AZURE_PRIVACY_SAFETY.md](AZURE_PRIVACY_SAFETY.md).

Dependency advisory status is recorded in [TECH_STACK_AUDIT.md](TECH_STACK_AUDIT.md); do not infer
that a package update is safe until the relevant test suite and build pass.
