"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { detectPhi } from "@/lib/piiGuard";

export default function ConsultPage() {
  const { status } = useSession();
  const router = useRouter();

  const [summary, setSummary] = useState("");
  const [phiError, setPhiError] = useState("");

  const notes = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return localStorage.getItem("consult_notes") ?? "";
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (!notes) {
      router.push("/dashboard");
    }
  }, [notes, router]);

  if (status === "loading") {
    return <div className="container-frame py-8 text-cyan-100">Loading...</div>;
  }

  return (
    <main className="min-h-screen py-10">
      <section className="container-frame space-y-6 fade-in">
        <header className="surface-card p-6 md:p-7">
          <span className="pill mb-3">Step 2 of 3</span>
          <h1 className="display-title text-3xl md:text-4xl">
            Clinical Reasoning Review
          </h1>
          <p className="mt-3 text-cyan-50/80">
            Refine your notes into a compact summary for better model prompting.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="surface-card p-6 space-y-3">
            <h2 className="display-title text-xl">Original Notes</h2>
            <pre className="whitespace-pre-wrap rounded-lg border border-cyan-200/20 bg-cyan-950/40 p-4 text-sm text-cyan-50/90">
              {notes}
            </pre>
          </section>

          <section className="surface-card-strong p-6 space-y-3">
            <h2 className="display-title text-xl">Structured Summary</h2>
            <p className="text-sm text-cyan-100/80">
              Optional: list key symptoms, red flags, exclusions, and risks.
            </p>
            <textarea
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                if (phiError) {
                  setPhiError("");
                }
              }}
              placeholder="Key points for analysis: severity, onset, negatives, risk profile..."
              className="field-textarea min-h-[220px]"
            />
          </section>
        </div>

        {phiError && (
          <p className="rounded-lg border border-rose-300/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {phiError}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button onClick={() => router.push("/dashboard")} className="btn-muted px-5 py-2">
            Back
          </button>

          <button
            onClick={async () => {
              const localMatches = detectPhi(`${notes}\n${summary}`);
              if (localMatches.length > 0) {
                const labels = localMatches.map((m) => m.label).join(", ");
                setPhiError(`Possible PHI detected (${labels}). Remove identifiers before analysis.`);
                return;
              }

              const response = await fetch("/api/validate-notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes, summary }),
              });

              if (!response.ok) {
                setPhiError("Validation failed. Please retry.");
                return;
              }

              const data = (await response.json()) as { ok: boolean; matches: Array<{ label: string }> };

              if (!data.ok) {
                const labels = data.matches.map((m) => m.label).join(", ");
                setPhiError(`Possible PHI detected (${labels}). Remove identifiers before analysis.`);
                return;
              }

              localStorage.setItem("consult_payload", JSON.stringify({ notes, summary }));
              router.push("/results");
            }}
            className="btn-primary px-6 py-3"
          >
            Analyze Reasoning
          </button>
        </div>
      </section>
    </main>
  );
}
