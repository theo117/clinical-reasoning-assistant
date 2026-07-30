"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type ConsultPayload = {
  notes: string;
  summary: string;
};

type DifferentialItem = {
  condition: string;
  rationale: string;
  priority: "high" | "medium" | "low";
};

type ClinicalAnalysis = {
  clinicalSummary: string;
  possibleConsiderations: string[];
  differential: DifferentialItem[];
  suggestedChecks: string[];
  redFlags: string[];
  lessLikely: string[];
  missingInformation: string[];
  detectedSignals: string[];
  reasoningNarrative: string;
  clinicalNote: string;
  referralLetter: string;
  safetyNote: string;
};

type AnalysisProvider = "openai" | "ollama" | "rules";

type AnalysisResponse =
  | { ok: true; analysis: ClinicalAnalysis; provider?: AnalysisProvider; model?: string }
  | { ok: false; error?: string };

async function readAnalysisResponse(response: Response): Promise<AnalysisResponse> {
  try {
    return (await response.json()) as AnalysisResponse;
  } catch {
    return { ok: false, error: "Analysis returned an unreadable response." };
  }
}

function ListCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "green" | "red" | "amber";
}) {
  const toneMap = {
    green: "border-emerald-300/30 bg-emerald-500/8 text-emerald-50",
    red: "border-rose-300/30 bg-rose-500/8 text-rose-50",
    amber: "border-amber-300/30 bg-amber-500/8 text-amber-50",
  };

  return (
    <section className={`rounded-xl border p-4 md:p-5 ${toneMap[tone]}`}>
      <h2 className="display-title text-lg md:text-xl">{title}</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

function DraftEditor({
  title,
  value,
  onChange,
}: {
  title: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyDraft() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="surface-card p-4 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="display-title text-xl">{title}</h2>
          <p className="mt-1 text-xs text-cyan-100/60">Review and edit before use.</p>
        </div>
        <button onClick={copyDraft} className="btn-muted shrink-0 px-4 py-2 text-sm">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field-textarea mt-4 min-h-80 font-mono text-sm leading-6"
        aria-label={`${title} editable draft`}
      />
    </section>
  );
}

export default function ResultsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<ClinicalAnalysis | null>(null);
  const [provider, setProvider] = useState<AnalysisProvider | null>(null);
  const [modelName, setModelName] = useState("");
  const [error, setError] = useState("");
  const [clinicalNote, setClinicalNote] = useState("");
  const [referralLetter, setReferralLetter] = useState("");

  const payload = useMemo<ConsultPayload | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("consult_payload");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ConsultPayload;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!payload) return;
    let isCancelled = false;
    const controller = new AbortController();

    async function runAnalysis() {
      setError("");
      try {
        const response = await fetch("/api/analyze-case", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify(payload),
        });
        const data = await readAnalysisResponse(response);
        if (isCancelled) return;
        if (!response.ok || !data.ok) {
          setError(data.ok === false ? data.error ?? "Analysis failed." : "Analysis failed.");
          return;
        }
        setAnalysis(data.analysis);
        setClinicalNote(data.analysis.clinicalNote);
        setReferralLetter(data.analysis.referralLetter);
        setProvider(data.provider ?? null);
        setModelName(data.model ?? "");
      } catch {
        if (!isCancelled) setError("Analysis failed. Check your connection and retry.");
      }
    }

    void runAnalysis();
    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [payload]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (!payload) {
      router.push("/dashboard");
    }
  }, [status, router, payload]);

  function handleStartNew() {
    localStorage.removeItem("consult_notes");
    localStorage.removeItem("consult_payload");
    router.push("/dashboard");
  }

  if (status === "loading" || !payload || (!analysis && !error)) {
    return (
      <main className="container-frame flex min-h-[70vh] items-center justify-center py-8">
        <div className="surface-card w-full max-w-lg p-8 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-200/25 border-t-cyan-300" />
          <h1 className="display-title mt-5 text-2xl">Building the clinical picture</h1>
          <p className="mt-2 text-sm text-cyan-100/70">
            Reviewing the differential, red flags, next steps, and documentation.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-5 md:py-10">
      <section className="container-frame space-y-5 fade-in">
        <header className="surface-card p-5 md:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill">Clinical reasoning support</span>
            {provider && (
              <span className="pill">
                {provider === "openai" ? "OpenAI" : provider === "ollama" ? "Local AI" : "Rules fallback"}
              </span>
            )}
          </div>
          <h1 className="display-title mt-4 text-3xl md:text-4xl">Case analysis</h1>
          {modelName && <p className="mt-2 text-sm text-cyan-100/65">Model: {modelName}</p>}
        </header>

        {error ? (
          <section className="rounded-xl border border-rose-300/35 bg-rose-500/10 p-5 text-rose-100">
            <p>{error}</p>
            <button onClick={() => router.push("/dashboard")} className="btn-muted mt-4 px-4 py-2">
              Return to case
            </button>
          </section>
        ) : analysis && (
          <>
            <section className="surface-card-strong p-5 md:p-6">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/65">Clinical summary</p>
              <p className="mt-3 leading-7 text-cyan-50">{analysis.clinicalSummary}</p>
              <p className="mt-4 border-t border-cyan-200/15 pt-4 text-sm leading-6 text-cyan-100/80">
                {analysis.reasoningNarrative}
              </p>
            </section>

            <section className="surface-card p-4 md:p-6">
              <h2 className="display-title text-xl md:text-2xl">Ranked differential</h2>
              <div className="mt-4 space-y-3">
                {analysis.differential.map((item) => (
                  <article key={`${item.condition}-${item.priority}`} className="rounded-xl border border-cyan-200/20 bg-cyan-950/35 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold text-cyan-50">{item.condition}</h3>
                      <span className={`priority-badge priority-${item.priority}`}>{item.priority}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-cyan-100/75">{item.rationale}</p>
                  </article>
                ))}
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              <ListCard title="Red flags & escalation" tone="red" items={analysis.redFlags} />
              <ListCard title="Suggested next checks" tone="green" items={analysis.suggestedChecks} />
              <ListCard title="Information still needed" tone="amber" items={analysis.missingInformation} />
              <ListCard title="Less likely from current notes" tone="amber" items={analysis.lessLikely} />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <DraftEditor title="Clinical note" value={clinicalNote} onChange={setClinicalNote} />
              <DraftEditor title="Referral letter" value={referralLetter} onChange={setReferralLetter} />
            </div>

            <section className="rounded-xl border border-amber-300/35 bg-amber-400/10 p-4 text-sm text-amber-100">
              {analysis.safetyNote}
            </section>
          </>
        )}

        <div className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-xl border border-cyan-200/20 bg-[rgba(4,18,24,0.94)] p-3 shadow-2xl backdrop-blur sm:flex-row sm:justify-between">
          <button onClick={() => router.push("/dashboard")} className="btn-muted px-5 py-3">Edit case</button>
          <button onClick={handleStartNew} className="btn-primary px-6 py-3">Start new consultation</button>
        </div>
      </section>
    </main>
  );
}
