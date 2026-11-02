# Optional Azure Companion: privacy and safety boundary

## Default behavior

Azure OpenAI is an optional backend-only provider. `AZURE_OPENAI_ENABLED` defaults to `false`; all
endpoint, key, deployment, and API-version settings must be present before a client can be created.
The existing rule-based Companion remains available without credentials. A request must also
explicitly set `allow_external_processing=true` before an eligible non-crisis message can leave the
backend.

The current frontend sends only `message` and does not provide external-processing disclosure or
consent. Consequently, the current user interface remains on the rule-based path even if a backend
operator configures Azure. Do not enable external processing for end users without a separately
approved UI change that clearly explains the transmission and obtains informed consent.

## Data flow and limits

- VADER processes bounded text locally and does not persist the Companion message.
- A crisis-matched request returns through the existing crisis response before VADER or Azure is
  called.
- On the explicitly consented Azure path, the current bounded message and optional derived VADER
  summary are sent to the configured deployment. The API does not add conversation persistence or
  log the message, API key, or provider error body.
- Requests have an eight-second timeout, bounded prompts/output, and provider failures return the
  existing rule-based response.
- Azure-side retention and handling are determined by the Azure resource/account configuration;
  Mindsy cannot guarantee provider retention behavior.

Do not place Azure credentials in frontend variables, source files, screenshots, test fixtures, or
Git. Use a backend secret manager. Do not run live requests with real reflections as routine tests.
Automated tests mock the SDK and make no paid Azure calls.

## Safety limitations

Generated responses are intended to be brief, supportive, and non-clinical. Prompt instructions and
phrase-based crisis matching cannot guarantee safe output or identify every crisis. The Companion
does not diagnose, prescribe, or replace a qualified professional or emergency support. Review
localized human support resources and model behavior before any public use. No HIPAA, GDPR, or
other regulatory-compliance claim has been assessed or is made.
