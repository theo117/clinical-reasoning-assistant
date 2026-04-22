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
2. Set a strong `NEXTAUTH_SECRET`.
3. Add one or more invited pilot accounts to `PILOT_DOCTOR_ACCOUNTS`.
4. Keep `OLLAMA_ENABLED=false` for remote low-spec testers unless you know they
   have a local Ollama setup.
5. Start the app with:

```bash
npm run dev
```

## Pilot Pages

These routes are useful when sharing the app with family-doctor testers:

- `/pilot` for the tester guide and sample case prompts
- `/feedback` for a simple structured feedback form that copies into a message

## Suggested Test Flow

1. Give each tester private login credentials.
2. Ask them to try 2 to 4 anonymized sample cases.
3. Ask whether the output felt useful, what was missing, and whether they
   would use something like this again.
4. Collect feedback through the `/feedback` page or over WhatsApp/email.
