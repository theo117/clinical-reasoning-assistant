import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { analyzeClinicalNotes } from "@/lib/clinicalEngine";
import { analyzeWithOllama, isOllamaEnabled } from "@/lib/ollama";
import { validateCaseInput } from "@/lib/caseInput";

type AnalyzeBody = {
  notes?: string;
  summary?: string;
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
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

  const { notes, summary } = validation.input;

  if (isOllamaEnabled()) {
    try {
      const ollamaResult = await analyzeWithOllama({ notes, summary });

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
    analysis: analyzeClinicalNotes({ notes, summary }),
    provider: "rules",
    model: "built-in-rules",
  });
}
