# Clinical Reasoning Assistant

A clinician-facing, documentation-first clinical reasoning support workflow.

The application accepts anonymized clinical notes and produces:

- a ranked differential with concise rationale
- red flags and suggested next checks
- missing information to clarify
- an editable clinical note
- an editable referral letter

The application is assistive only. It does not diagnose, prescribe, or replace
clinical judgment. Do not enter patient-identifiable information.

## Local Setup

1. Copy `.env.example` values into `.env.local`.
2. Create a Clerk application and configure Google and email verification.
3. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
4. Set `OPENAI_API_KEY` to a server-side OpenAI project key. Never expose it
   through a `NEXT_PUBLIC_` variable or commit it to the repository.
5. Optionally set `OPENAI_MODEL` (defaults to `gpt-5.6-terra`).
6. Keep `OLLAMA_ENABLED=false` when using OpenAI.
7. Start the app:

```bash
npm run dev
```

## Safety

- Authentication is handled through Clerk.
- Clinical API routes require an authenticated Clerk session.
- Common patient identifiers are screened before AI analysis.
- OpenAI requests use `store: false`.
- Consultation content is temporarily held in browser storage for the active
  workflow and should not be used on shared devices.

## Verification

```bash
npm run lint
npm run build
npm audit --omit=dev
```
