import { detectPhi, type PhiMatch } from "@/lib/piiGuard";

export const MAX_NOTES_CHARS = 6000;
export const MAX_SUMMARY_CHARS = 3000;
export const MAX_FOLLOW_UP_CHARS = 4000;

export type CaseInput = {
  notes: string;
  summary: string;
  followUp: string;
  referralSpecialty: string;
};

export type CaseInputValidation =
  | {
      ok: true;
      input: CaseInput;
      matches: [];
    }
  | {
      ok: false;
      error: string;
      matches: PhiMatch[];
    };

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeCaseInput(input: {
  notes?: unknown;
  summary?: unknown;
  followUp?: unknown;
  referralSpecialty?: unknown;
}): CaseInput {
  return {
    notes: normalizeText(input.notes),
    summary: normalizeText(input.summary),
    followUp: normalizeText(input.followUp),
    referralSpecialty: normalizeText(input.referralSpecialty).slice(0, 80),
  };
}

export function validateCaseInput(input: {
  notes?: unknown;
  summary?: unknown;
  followUp?: unknown;
  referralSpecialty?: unknown;
}): CaseInputValidation {
  const normalized = normalizeCaseInput(input);

  if (!normalized.notes && !normalized.summary && !normalized.followUp) {
    return {
      ok: false,
      error: "Add anonymized clinical notes before requesting analysis.",
      matches: [],
    };
  }

  if (normalized.notes.length > MAX_NOTES_CHARS) {
    return {
      ok: false,
      error: `Notes are too long. Keep them under ${MAX_NOTES_CHARS.toLocaleString()} characters.`,
      matches: [],
    };
  }

  if (normalized.summary.length > MAX_SUMMARY_CHARS) {
    return {
      ok: false,
      error: `Structured summary is too long. Keep it under ${MAX_SUMMARY_CHARS.toLocaleString()} characters.`,
      matches: [],
    };
  }

  if (normalized.followUp.length > MAX_FOLLOW_UP_CHARS) {
    return {
      ok: false,
      error: `Follow-up results are too long. Keep them under ${MAX_FOLLOW_UP_CHARS.toLocaleString()} characters.`,
      matches: [],
    };
  }

  const matches = detectPhi(
    `${normalized.notes}\n${normalized.summary}\n${normalized.followUp}`
  );

  if (matches.length > 0) {
    return {
      ok: false,
      error: "Possible PHI detected. Remove identifiers before analysis.",
      matches,
    };
  }

  return {
    ok: true,
    input: normalized,
    matches: [],
  };
}

export function formatValidationError(validation: CaseInputValidation): string {
  if (validation.ok || validation.matches.length === 0) {
    return validation.ok ? "" : validation.error;
  }

  const labels = validation.matches.map((match) => match.label).join(", ");
  return `${validation.error} (${labels}).`;
}
