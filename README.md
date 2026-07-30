# Clinical Reasoning Assistant

Private pilot build for early clinician feedback on a documentation-first,
assistive clinical reasoning workflow.

## Pilot Focus

The current prototype is strongest for these note patterns:

- chest pain
- respiratory symptoms
- abdominal pain
- neurologic symptoms
- infection or fever
- urinary presentations
- back pain
- dizziness or syncope

The app is assistive only. It does not diagnose, prescribe, or replace
clinical judgment. Testers should never enter real patient-identifiable
information.

## Local Setup

1. Copy `.env.example` values into `.env.local`.
2. Create a Clerk application and configure Google and email verification.
3. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
4. Set `OPENAI_API_KEY` to a server-side OpenAI project key. Never expose it
   through a `NEXT_PUBLIC_` variable or commit it to the repository.
5. Optionally set `OPENAI_MODEL` (defaults to `gpt-5.6-terra`).
6. Keep `OLLAMA_ENABLED=false` for remote low-spec testers unless you know they
   have a local Ollama setup. Ollama and the built-in rule engine remain
   fallbacks if the OpenAI request fails.
7. Start the app with:

```bash
npm run dev
```

## Pilot Pages

These routes are useful when sharing the app with family-doctor testers:

- `/pilot` for the tester guide and sample case prompts
- `/feedback` for a simple structured feedback form that copies into a message

## Suggested Test Flow

1. Invite each tester to sign in with Google or a verified email address.
2. Ask them to try 2 to 4 anonymized sample cases.
3. Ask whether the output felt useful, what was missing, and whether they
   would use something like this again.
4. Collect feedback through the `/feedback` page or over WhatsApp/email.
