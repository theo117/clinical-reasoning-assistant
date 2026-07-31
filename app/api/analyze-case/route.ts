import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { analyzeClinicalNotes } from "@/lib/clinicalEngine";
import { analyzeWithOllama, isOllamaEnabled } from "@/lib/ollama";
import { analyzeWithOpenAI, isOpenAIEnabled } from "@/lib/openai";
import { validateCaseInput } from "@/lib/caseInput";

type AnalyzeBody = {
  notes?: string;
  summary?: string;
  followUp?: string;
  referralSpecialty?: string;
};

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: AnalyzeBody;

  try {
    body = (await req.json()) as AnalyzeBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const validation = validateCaseInput(body);

  if (!validation.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: validation.error,
        matches: validation.matches,
      },
      { status: 400 }
    );
  }

  const { notes, summary, followUp, referralSpecialty } = validation.input;

  if (isOpenAIEnabled()) {
    try {
      const openAIResult = await analyzeWithOpenAI({
        notes,
        summary,
        followUp,
        referralSpecialty,
        safetyIdentifier: userId,
      });

      return NextResponse.json({
        ok: true,
        analysis: openAIResult.analysis,
        provider: "openai",
        model: openAIResult.model,
      });
    } catch (error) {
      console.error("OpenAI analysis failed, trying configured fallbacks.", error);
    }
  }

  if (isOllamaEnabled()) {
    try {
      const ollamaResult = await analyzeWithOllama({ notes, summary, followUp });

      return NextResponse.json({
        ok: true,
        analysis: ollamaResult.analysis,
        provider: "ollama",
        model: ollamaResult.model,
      });
    } catch (error) {
      console.error("Ollama analysis failed, falling back to rule engine.", error);
    }
  }

  return NextResponse.json({
    ok: true,
    analysis: analyzeClinicalNotes({ notes, summary, followUp }),
    provider: "rules",
    model: "built-in-rules",
  });
}
