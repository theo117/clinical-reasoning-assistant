import type { ClinicalAnalysis } from "@/lib/clinicalEngine";
import { normalizeClinicalAnalysis } from "@/lib/ollama";

const DEFAULT_MODEL = "gpt-5.6-terra";
const OPENAI_URL = "https://api.openai.com/v1/responses";

type ResponseContent = {
  type?: string;
  text?: string;
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: ResponseContent[];
  }>;
  error?: { message?: string };
};

export type OpenAIAnalysisResult = {
  analysis: ClinicalAnalysis;
  model: string;
};

export function isOpenAIEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

function readOutputText(payload: OpenAIResponse): string {
  if (payload.output_text) {
    return payload.output_text;
  }

  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) {
        return content.text;
      }
    }
  }

  throw new Error(payload.error?.message ?? "OpenAI returned no text output.");
}

export async function analyzeWithOpenAI(input: {
  notes?: string;
  summary?: string;
}): Promise<OpenAIAnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const notes = input.notes?.trim() ?? "";
  const summary = input.summary?.trim() ?? "";
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Number(process.env.OPENAI_TIMEOUT_MS ?? "60000")
  );

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        store: false,
        reasoning: { effort: "medium" },
        text: {
          verbosity: "medium",
          format: {
            type: "json_schema",
            name: "clinical_reasoning_support",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                clinicalSummary: { type: "string" },
                possibleConsiderations: {
                  type: "array",
                  items: { type: "string" },
                },
                differential: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      condition: { type: "string" },
                      rationale: { type: "string" },
                      priority: {
                        type: "string",
                        enum: ["high", "medium", "low"],
                      },
                    },
                    required: ["condition", "rationale", "priority"],
                  },
                },
                suggestedChecks: {
                  type: "array",
                  items: { type: "string" },
                },
                redFlags: { type: "array", items: { type: "string" } },
                lessLikely: { type: "array", items: { type: "string" } },
                missingInformation: {
                  type: "array",
                  items: { type: "string" },
                },
                detectedSignals: {
                  type: "array",
                  items: { type: "string" },
                },
                reasoningNarrative: { type: "string" },
                clinicalNote: { type: "string" },
                referralLetter: { type: "string" },
                safetyNote: { type: "string" },
              },
              required: [
                "clinicalSummary",
                "possibleConsiderations",
                "differential",
                "suggestedChecks",
                "redFlags",
                "lessLikely",
                "missingInformation",
                "detectedSignals",
                "reasoningNarrative",
                "clinicalNote",
                "referralLetter",
                "safetyNote",
              ],
            },
          },
        },
        instructions: [
          "You are a conservative clinical reasoning support assistant for qualified clinicians.",
          "This is decision support, not a diagnosis, prescription, or replacement for clinical judgment.",
          "Use only the supplied anonymized case. Never invent findings, observations, test results, demographics, or patient identifiers.",
          "Expose useful reasoning as a concise clinical rationale, not hidden chain-of-thought.",
          "Rank a broad but relevant differential, explicitly connecting each item to supporting or missing features.",
          "Separate time-critical red flags from routine next steps.",
          "Clinical notes and referral letters must be editable drafts. Mark missing facts with [not provided], never fabricate them.",
          "Do not give drug doses or definitive treatment instructions.",
          "If the patient may be unstable, lead with urgent escalation.",
          "Use clear professional English suitable for a South African primary-care context.",
        ].join("\n"),
        input: [
          "Create clinical reasoning support and documentation drafts from this anonymized clinician-authored case.",
          `Raw notes:\n${notes || "[not provided]"}`,
          `Optional structured summary:\n${summary || "[not provided]"}`,
        ].join("\n\n"),
      }),
    });

    const data = (await response.json()) as OpenAIResponse;
    if (!response.ok) {
      throw new Error(data.error?.message ?? `OpenAI request failed (${response.status}).`);
    }

    return {
      analysis: normalizeClinicalAnalysis(JSON.parse(readOutputText(data))),
      model,
    };
  } finally {
    clearTimeout(timeout);
  }
}
