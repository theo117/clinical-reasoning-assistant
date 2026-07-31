import type { ClinicalAnalysis } from "@/lib/clinicalEngine";

type OllamaChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OllamaChatResponse = {
  message?: {
    content?: string;
  };
};

export type OllamaAnalysisResult = {
  analysis: ClinicalAnalysis;
  model: string;
};

const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_OLLAMA_MODEL = "gemma3";

function getEnvFlag(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];

  if (!value) {
    return defaultValue;
  }

  return value.toLowerCase() === "true";
}

export function isOllamaEnabled(): boolean {
  return getEnvFlag("OLLAMA_ENABLED", true);
}

function getOllamaConfig() {
  const primaryModel = process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL;
  const fallbackModels = (process.env.OLLAMA_MODEL_FALLBACKS ?? "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  return {
    baseUrl: process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE_URL,
    models: [primaryModel, ...fallbackModels],
    timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS ?? "30000"),
  };
}

function buildPrompt(input: { notes?: string; summary?: string; followUp?: string }) {
  const notes = input.notes?.trim() ?? "";
  const summary = input.summary?.trim() ?? "";
  const followUp = input.followUp?.trim() ?? "";

  const system = [
    "You are a conservative clinical reasoning support assistant for clinicians.",
    "You do not diagnose, prescribe, or replace clinical judgment.",
    "Return concise structured reasoning support only.",
    "Do not mention protected health information or ask for identifying details.",
    "Respond with valid JSON matching this exact schema:",
    '{"clinicalSummary": string, "possibleConsiderations": string[], "differential": {"condition": string, "rationale": string, "priority": "high"|"medium"|"low"}[], "suggestedChecks": string[], "redFlags": string[], "lessLikely": string[], "missingInformation": string[], "detectedSignals": string[], "reasoningNarrative": string, "urgency": {"level":"emergency"|"urgent"|"soon"|"routine"|"monitor","timeframe":string,"rationale":string}, "nextBestActions": string[], "guidelineReferences": [], "clinicalNote": string, "soapNote": string, "referralLetter": string, "workNote": string, "medicationSafetyNote": string, "safetyNote": string}',
    "Rules:",
    "- Keep possibleConsiderations to 3-5 items.",
    "- Keep suggestedChecks to 3-6 items.",
    "- Keep redFlags to 3-6 items.",
    "- Keep lessLikely to 2-4 items.",
    "- Keep detectedSignals to 2-6 items.",
    '- safetyNote must say this is assistive and not a diagnosis.',
    "- Use careful, clinician-support wording.",
  ].join("\n");

  const user = [
    "Analyze the following clinician-authored case notes.",
    notes ? `Notes:\n${notes}` : "Notes:\nNone provided.",
    summary ? `Structured summary:\n${summary}` : "Structured summary:\nNone provided.",
    followUp ? `Follow-up results:\n${followUp}` : "Follow-up results:\nNone provided.",
  ].join("\n\n");

  return { system, user };
}

function cleanJsonBlock(content: string): string {
  return content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function toStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const normalized = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return normalized.length > 0 ? [...new Set(normalized)] : fallback;
}

export function normalizeClinicalAnalysis(payload: unknown): ClinicalAnalysis {
  const record =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};
  const urgencyRecord =
    record.urgency && typeof record.urgency === "object"
      ? (record.urgency as Record<string, unknown>)
      : {};
  const urgencyLevel =
    urgencyRecord.level === "emergency" ||
    urgencyRecord.level === "urgent" ||
    urgencyRecord.level === "soon" ||
    urgencyRecord.level === "routine" ||
    urgencyRecord.level === "monitor"
      ? urgencyRecord.level
      : "urgent";

  return {
    clinicalSummary:
      typeof record.clinicalSummary === "string" && record.clinicalSummary.trim()
        ? record.clinicalSummary.trim()
        : "Clinical summary was not generated.",
    possibleConsiderations: toStringArray(record.possibleConsiderations, [
      "Broad differential requires clinician correlation",
    ]).slice(0, 5),
    differential: Array.isArray(record.differential)
      ? record.differential
          .filter(
            (entry): entry is Record<string, unknown> =>
              Boolean(entry) && typeof entry === "object"
          )
          .map((entry) => ({
            condition:
              typeof entry.condition === "string"
                ? entry.condition.trim()
                : "Unspecified consideration",
            rationale:
              typeof entry.rationale === "string"
                ? entry.rationale.trim()
                : "Requires clinician correlation.",
            priority: (
              entry.priority === "high" ||
              entry.priority === "medium" ||
              entry.priority === "low"
                ? entry.priority
                : "medium"
            ) as "high" | "medium" | "low",
          }))
          .slice(0, 8)
      : [],
    suggestedChecks: toStringArray(record.suggestedChecks, [
      "Clarify onset, severity, associated symptoms, and key negatives",
    ]).slice(0, 6),
    redFlags: toStringArray(record.redFlags, [
      "Escalate if the patient is unstable or deteriorating",
    ]).slice(0, 6),
    lessLikely: toStringArray(record.lessLikely, [
      "Conditions without supporting features in the current notes",
    ]).slice(0, 4),
    missingInformation: toStringArray(record.missingInformation, [
      "Clarify relevant history, examination findings, vital signs, and key negatives",
    ]).slice(0, 8),
    detectedSignals: toStringArray(record.detectedSignals, [
      "Structured clinical text reviewed",
    ]).slice(0, 6),
    reasoningNarrative:
      typeof record.reasoningNarrative === "string" &&
      record.reasoningNarrative.trim()
        ? record.reasoningNarrative.trim()
        : "Review the documented features against the differential and resolve missing information before deciding next steps.",
    urgency: {
      level: urgencyLevel,
      timeframe:
        typeof urgencyRecord.timeframe === "string" && urgencyRecord.timeframe.trim()
          ? urgencyRecord.timeframe.trim()
          : "Urgency requires clinician confirmation.",
      rationale:
        typeof urgencyRecord.rationale === "string" && urgencyRecord.rationale.trim()
          ? urgencyRecord.rationale.trim()
          : "Classify urgency using current physiology, examination, and red flags.",
    },
    nextBestActions: toStringArray(record.nextBestActions, [
      "Resolve time-critical red flags before routine investigation",
    ]).slice(0, 6),
    guidelineReferences: Array.isArray(record.guidelineReferences)
      ? record.guidelineReferences
          .filter(
            (entry): entry is Record<string, unknown> =>
              Boolean(entry) && typeof entry === "object"
          )
          .map((entry) => ({
            title: typeof entry.title === "string" ? entry.title.trim() : "",
            organization:
              typeof entry.organization === "string" ? entry.organization.trim() : "",
            year: typeof entry.year === "string" ? entry.year.trim() : "",
            url: typeof entry.url === "string" ? entry.url.trim() : "",
            relevance:
              typeof entry.relevance === "string" ? entry.relevance.trim() : "",
          }))
          .filter((entry) => entry.title && entry.organization)
          .slice(0, 5)
      : [],
    clinicalNote:
      typeof record.clinicalNote === "string" && record.clinicalNote.trim()
        ? record.clinicalNote.trim()
        : "Clinical note draft was not generated.",
    soapNote:
      typeof record.soapNote === "string" && record.soapNote.trim()
        ? record.soapNote.trim()
        : "SOAP note draft was not generated.",
    referralLetter:
      typeof record.referralLetter === "string" && record.referralLetter.trim()
        ? record.referralLetter.trim()
        : "Referral letter draft was not generated.",
    workNote:
      typeof record.workNote === "string" && record.workNote.trim()
        ? record.workNote.trim()
        : "Work note draft was not generated.",
    medicationSafetyNote:
      typeof record.medicationSafetyNote === "string" &&
      record.medicationSafetyNote.trim()
        ? record.medicationSafetyNote.trim()
        : "Use only a verified medicine-specific protocol and independently confirm every dose.",
    safetyNote:
      typeof record.safetyNote === "string" && record.safetyNote.trim()
        ? record.safetyNote.trim()
        : "Assistive clinical reasoning support only. This is not a diagnosis, treatment plan, or substitute for clinician judgment.",
  };
}

async function analyzeWithModel(params: {
  baseUrl: string;
  model: string;
  timeoutMs: number;
  system: string;
  user: string;
}): Promise<ClinicalAnalysis> {
  const { baseUrl, model, timeoutMs, system, user } = params;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: false,
        format: "json",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ] satisfies OllamaChatMessage[],
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed with status ${response.status}.`);
    }

    const data = (await response.json()) as OllamaChatResponse;
    const content = data.message?.content;

    if (!content) {
      throw new Error("Ollama response was empty.");
    }

    return normalizeClinicalAnalysis(JSON.parse(cleanJsonBlock(content)));
  } finally {
    clearTimeout(timeout);
  }
}

export async function analyzeWithOllama(input: {
  notes?: string;
  summary?: string;
  followUp?: string;
}): Promise<OllamaAnalysisResult> {
  const { baseUrl, models, timeoutMs } = getOllamaConfig();
  const { system, user } = buildPrompt(input);
  let lastError: unknown;

  for (const model of models) {
    try {
      const analysis = await analyzeWithModel({
        baseUrl,
        model,
        timeoutMs,
        system,
        user,
      });

      return { analysis, model };
    } catch (error) {
      lastError = error;
      console.warn(`Ollama model ${model} failed. Trying next configured model.`, error);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All configured Ollama models failed.");
}
