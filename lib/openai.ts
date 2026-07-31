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
  followUp?: string;
  referralSpecialty?: string;
  safetyIdentifier?: string;
}): Promise<OpenAIAnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const notes = input.notes?.trim() ?? "";
  const summary = input.summary?.trim() ?? "";
  const followUp = input.followUp?.trim() ?? "";
  const referralSpecialty = input.referralSpecialty?.trim() ?? "General specialist";
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Number(process.env.OPENAI_TIMEOUT_MS ?? "90000")
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
        safety_identifier: input.safetyIdentifier,
        tools: [{ type: "web_search", search_context_size: "low" }],
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
                urgency: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    level: {
                      type: "string",
                      enum: ["emergency", "urgent", "soon", "routine", "monitor"],
                    },
                    timeframe: { type: "string" },
                    rationale: { type: "string" },
                  },
                  required: ["level", "timeframe", "rationale"],
                },
                nextBestActions: {
                  type: "array",
                  items: { type: "string" },
                },
                guidelineReferences: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      title: { type: "string" },
                      organization: { type: "string" },
                      year: { type: "string" },
                      url: { type: "string" },
                      relevance: { type: "string" },
                    },
                    required: ["title", "organization", "year", "url", "relevance"],
                  },
                },
                clinicalNote: { type: "string" },
                soapNote: { type: "string" },
                referralLetter: { type: "string" },
                workNote: { type: "string" },
                medicationSafetyNote: { type: "string" },
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
                "urgency",
                "nextBestActions",
                "guidelineReferences",
                "clinicalNote",
                "soapNote",
                "referralLetter",
                "workNote",
                "medicationSafetyNote",
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
          "Calibrate urgency. Do not recommend emergency referral unless supplied features justify it; clearly state what would change the urgency.",
          "Use web search to find up to 5 current, authoritative guideline sources relevant to this case. Prefer South African national/provincial guidance, WHO, NICE, and specialty societies. Include only sources you actually found; use the canonical URL and publication/update year. If no reliable source is found, return an empty list.",
          "Clinical, SOAP, referral, and work-note outputs must be editable drafts. Mark missing facts with [not provided], never fabricate them.",
          "The SOAP note must have explicit S, O, A, and P headings.",
          `Address the referral draft to ${referralSpecialty}.`,
          "The work note must preserve privacy: confirm attendance and functional restrictions only, omitting diagnosis unless explicitly necessary and supplied.",
          "Do not give drug doses or definitive treatment instructions.",
          "The medication safety note must direct clinicians to a verified medicine-specific protocol and independent dose confirmation.",
          "If the patient may be unstable, lead with urgent escalation.",
          "Use clear professional English suitable for a South African primary-care context.",
        ].join("\n"),
        input: [
          "Create clinical reasoning support and documentation drafts from this anonymized clinician-authored case.",
          `Raw notes:\n${notes || "[not provided]"}`,
          `Optional structured summary:\n${summary || "[not provided]"}`,
          `Follow-up results and interval change:\n${followUp || "[no follow-up supplied]"}`,
          `Requested referral destination:\n${referralSpecialty}`,
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
