import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { detectPhi } from "@/lib/piiGuard";

type ValidateBody = {
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

  let body: ValidateBody;

  try {
    body = (await req.json()) as ValidateBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const notes = body.notes ?? "";
  const summary = body.summary ?? "";
  const matches = detectPhi(`${notes}\n${summary}`);

  return NextResponse.json({
    ok: matches.length === 0,
    matches,
  });
}
