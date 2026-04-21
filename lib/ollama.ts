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

function buildPrompt(input: { notes?: string; summary?: string }) {
  const notes = input.notes?.trim() ?? "";
  const summary = input.summary?.trim() ?? "";

  const system = [
    "You are a conservative clinical reasoning support assistant for clinicians.",
    "You do not diagnose, prescribe, or replace clinical judgment.",
    "Return concise structured reasoning support only.",
    "Do not mention protected health information or ask for identifying details.",
    "Respond with valid JSON matching this exact schema:",
    '{"possibleConsiderations": string[], "suggestedChecks": string[], "redFlags": string[], "lessLikely": string[], "detectedSignals": string[], "safetyNote": string}',
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

  return {
    possibleConsiderations: toStringArray(record.possibleConsiderations, [
      "Broad differential requires clinician correlation",
    ]).slice(0, 5),
    suggestedChecks: toStringArray(record.suggestedChecks, [
      "Clarify onset, severity, associated symptoms, and key negatives",
    ]).slice(0, 6),
    redFlags: toStringArray(record.redFlags, [
      "Escalate if the patient is unstable or deteriorating",
    ]).slice(0, 6),
    lessLikely: toStringArray(record.lessLikely, [
      "Conditions without supporting features in the current notes",
    ]).slice(0, 4),
    detectedSignals: toStringArray(record.detectedSignals, [
      "Structured clinical text reviewed",
    ]).slice(0, 6),
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
