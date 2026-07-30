import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { validateCaseInput } from "@/lib/caseInput";

type ValidateBody = {
  notes?: string;
  summary?: string;
};

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: ValidateBody;

  try {
    body = (await req.json()) as ValidateBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const validation = validateCaseInput(body);

  if (!validation.ok) {
    return NextResponse.json({
      ok: false,
      error: validation.error,
      matches: validation.matches,
    });
  }

  return NextResponse.json({
    ok: true,
    matches: [],
  });
}
