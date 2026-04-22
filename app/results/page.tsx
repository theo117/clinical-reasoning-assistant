"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type ConsultPayload = {
  notes: string;
  summary: string;
};

type ClinicalAnalysis = {
  possibleConsiderations: string[];
  suggestedChecks: string[];
  redFlags: string[];
  lessLikely: string[];
  detectedSignals: string[];
  safetyNote: string;
};

type AnalysisProvider = "ollama" | "rules";

function OutputCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "teal" | "green" | "red" | "amber";
}) {
  const toneMap = {
    teal: "border-cyan-300/30 bg-cyan-500/8 text-cyan-50",
    green: "border-emerald-300/30 bg-emerald-500/8 text-emerald-50",
    red: "border-rose-300/30 bg-rose-500/8 text-rose-50",
    amber: "border-amber-300/30 bg-amber-500/8 text-amber-50",
  };

  return (
    <div className={`rounded-xl border p-5 ${toneMap[tone]}`}>
      <h3 className="display-title text-xl">{title}</h3>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function ResultsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<ClinicalAnalysis | null>(null);
  const [provider, setProvider] = useState<AnalysisProvider | null>(null);
  const [modelName, setModelName] = useState("");
  const [error, setError] = useState("");

  const payload = useMemo<ConsultPayload | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const raw = localStorage.getItem("consult_payload");
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as ConsultPayload;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!payload) {
      return;
    }

    let isCancelled = false;

    async function runAnalysis() {
      setError("");

      const response = await fetch("/api/analyze-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as
        | { ok: true; analysis: ClinicalAnalysis; provider?: AnalysisProvider; model?: string }
        | { ok: false; error?: string };

      if (isCancelled) {
        return;
      }

      if (!response.ok || !data.ok) {
        setError(
          data.ok === false ? data.error ?? "Analysis failed." : "Analysis failed."
        );
        return;
      }

      setAnalysis(data.analysis);
      setProvider(data.provider ?? null);
      setModelName(data.model ?? "");
    }

    void runAnalysis();

    return () => {
      isCancelled = true;
    };
  }, [payload]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (!payload) {
      router.push("/dashboard");
    }
  }, [status, router, payload]);

  if (status === "loading" || !payload || (!analysis && !error)) {
    return <div className="container-frame py-8 text-cyan-100">Analyzing...</div>;
  }

  return (
    <main className="min-h-screen py-10">
      <section className="container-frame space-y-6 fade-in">
        <header className="surface-card p-6 md:p-7">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="pill">Step 3 of 3</span>
            {provider && (
              <span
                className={`pill ${
                  provider === "ollama"
                    ? "border-emerald-300/35 bg-emerald-500/12 text-emerald-100"
                    : "border-amber-300/35 bg-amber-400/12 text-amber-100"
                }`}
              >
                Source: {provider === "ollama" ? "Ollama Local LLM" : "Rule Engine Fallback"}
              </span>
            )}
          </div>
          <h1 className="display-title text-3xl md:text-4xl">
            Clinical Reasoning Support
          </h1>
          <p className="mt-3 text-cyan-50/80">
            Assistive output based on clinician-provided notes.
          </p>
          {provider && (
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-cyan-100/60">
              {provider === "ollama"
                ? "Generated through your local Ollama model."
                : "Local LLM unavailable, so the built-in rules engine handled this case."}
            </p>
          )}
          {modelName && (
            <p className="mt-1 text-sm text-cyan-100/70">
              Active model: <span className="font-medium text-cyan-50">{modelName}</span>
            </p>
          )}
        </header>

        <section className="surface-card p-6 space-y-3">
          <h2 className="display-title text-xl">Input Recap</h2>
          <pre className="whitespace-pre-wrap rounded-lg border border-cyan-200/20 bg-cyan-950/40 p-4 text-sm text-cyan-50/90">
            {payload.summary || payload.notes}
          </pre>
        </section>

        {provider === "rules" && (
          <section className="rounded-xl border border-amber-300/35 bg-amber-400/10 p-4 text-sm text-amber-100">
            <p className="font-semibold text-amber-50">Fallback mode active</p>
            <p className="mt-2 text-amber-100/90">
              This result was generated by the app&apos;s built-in clinical
              rules because a reachable Ollama model was not available for this
              request.
            </p>
            <p className="mt-2 text-amber-100/90">
              The prototype is most dependable for chest pain, respiratory,
              abdominal, neurologic, infection, urinary, back pain, and
              dizziness or syncope note patterns.
            </p>
          </section>
        )}

        {error ? (
          <section className="rounded-xl border border-rose-300/35 bg-rose-500/10 p-4 text-sm text-rose-100">
            {error}
          </section>
        ) : (
          <section className="surface-card-strong p-6 space-y-4">
            <div className="rounded-xl border border-cyan-300/25 bg-cyan-500/8 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/70">
                Detected Signals
              </p>
              <p className="mt-2 text-sm text-cyan-50/90">
                {analysis?.detectedSignals.join(" | ")}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <OutputCard
                title="Possible Considerations"
                tone="teal"
                items={analysis?.possibleConsiderations ?? []}
              />

              <OutputCard
                title="Suggested Checks"
                tone="green"
                items={analysis?.suggestedChecks ?? []}
              />

              <OutputCard
                title="Red Flags"
                tone="red"
                items={analysis?.redFlags ?? []}
              />

              <OutputCard
                title="Less Likely From Current Notes"
                tone="amber"
                items={analysis?.lessLikely ?? []}
              />
            </div>
          </section>
        )}

        <section className="rounded-xl border border-amber-300/35 bg-amber-400/10 p-4 text-sm text-amber-100">
          {analysis?.safetyNote ??
            "This tool supports clinical reasoning only. It does not diagnose, prescribe, or replace clinical judgment."}
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button onClick={() => router.push("/consult")} className="btn-muted px-5 py-2">
            Back
          </button>

          <button onClick={() => router.push("/dashboard")} className="btn-primary px-6 py-3">
            Start New Consultation
          </button>
        </div>
      </section>
    </main>
  );
}
