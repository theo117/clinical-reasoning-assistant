"use client";

import { useMemo, useState } from "react";

const usefulnessOptions = ["Yes", "Partly", "No"] as const;

export default function FeedbackPage() {
  const [caseType, setCaseType] = useState("");
  const [useful, setUseful] =
    useState<(typeof usefulnessOptions)[number]>("Partly");
  const [strongPoints, setStrongPoints] = useState("");
  const [missingPoints, setMissingPoints] = useState("");
  const [reuseIntent, setReuseIntent] = useState("Maybe");
  const [copied, setCopied] = useState(false);

  const summary = useMemo(
    () =>
      [
        `Case type: ${caseType || "Not provided"}`,
        `Was the output useful? ${useful}`,
        `What felt strong: ${strongPoints || "Not provided"}`,
        `What felt missing or off: ${missingPoints || "Not provided"}`,
        `Would you use something like this again? ${reuseIntent}`,
      ].join("\n"),
    [caseType, useful, strongPoints, missingPoints, reuseIntent]
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="min-h-screen py-10">
      <section className="container-frame space-y-6 fade-in">
        <header className="surface-card p-6 md:p-7">
          <span className="pill mb-3">Pilot Feedback</span>
          <h1 className="display-title text-3xl md:text-4xl">
            Quick Clinician Feedback
          </h1>
          <p className="mt-3 max-w-3xl text-cyan-50/82">
            Use this page to capture a short structured response after trying a
            case. The summary can be copied into WhatsApp, email, or any other
            message without extra backend setup.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <form className="surface-card-strong p-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm text-cyan-50/90">Case type</span>
              <input
                value={caseType}
                onChange={(e) => setCaseType(e.target.value)}
                placeholder="e.g. chest pain, urinary symptoms, headache"
                className="field"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-cyan-50/90">
                Was the output useful?
              </span>
              <select
                value={useful}
                onChange={(e) =>
                  setUseful(e.target.value as (typeof usefulnessOptions)[number])
                }
                className="field"
              >
                {usefulnessOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-cyan-50/90">What felt strong?</span>
              <textarea
                value={strongPoints}
                onChange={(e) => setStrongPoints(e.target.value)}
                placeholder="What was clinically helpful, clear, or well structured?"
                className="field-textarea min-h-[140px]"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-cyan-50/90">
                What felt missing or off?
              </span>
              <textarea
                value={missingPoints}
                onChange={(e) => setMissingPoints(e.target.value)}
                placeholder="What was missing, misleading, repetitive, or too generic?"
                className="field-textarea min-h-[140px]"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-cyan-50/90">
                Would you use something like this again?
              </span>
              <select
                value={reuseIntent}
                onChange={(e) => setReuseIntent(e.target.value)}
                className="field"
              >
                <option>Yes</option>
                <option>Maybe</option>
                <option>No</option>
              </select>
            </label>
          </form>

          <aside className="surface-card p-6 space-y-4">
            <h2 className="display-title text-2xl">Copy And Send</h2>
            <p className="text-sm text-cyan-100/84">
              This gives testers a simple note they can send back to you in any
              channel.
            </p>

            <pre className="whitespace-pre-wrap rounded-xl border border-cyan-200/20 bg-cyan-950/35 p-4 text-sm text-cyan-50/88">
              {summary}
            </pre>

            <button
              type="button"
              onClick={handleCopy}
              className="btn-primary px-5 py-3"
            >
              {copied ? "Copied" : "Copy Feedback Summary"}
            </button>

            <div className="rounded-xl border border-amber-300/35 bg-amber-400/10 p-4 text-sm text-amber-100">
              Keep feedback anonymized. Do not paste real patient details into
              this form or the message you send.
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
