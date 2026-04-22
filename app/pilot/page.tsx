"use client";

import Link from "next/link";
import { useState } from "react";

const sampleCases = [
  {
    title: "Chest Pain",
    prompt:
      "52 y/o male with exertional central chest pressure for 2 days, relieved by rest, history of hypertension and diabetes, no fever, no trauma.",
  },
  {
    title: "Respiratory",
    prompt:
      "34 y/o female with cough, shortness of breath, wheeze, low-grade fever, worse over 3 days, no chest trauma, smoker.",
  },
  {
    title: "Abdominal",
    prompt:
      "40 y/o with epigastric pain and vomiting since yesterday, pain worsening after meals, no GI bleeding reported, mildly dehydrated.",
  },
  {
    title: "Neurologic",
    prompt:
      "61 y/o with sudden severe headache and new unilateral arm weakness, no seizure reported, symptoms began 45 minutes ago.",
  },
  {
    title: "Urinary",
    prompt:
      "29 y/o with dysuria, urgency, flank pain, fever, and vomiting since this morning, no known kidney disease.",
  },
  {
    title: "Back Pain",
    prompt:
      "47 y/o with acute lower back pain radiating down the leg, new numbness around the groin, difficult to pass urine since this afternoon.",
  },
];

export default function PilotGuidePage() {
  const [copiedTitle, setCopiedTitle] = useState("");

  async function handleCopy(title: string, prompt: string) {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedTitle(title);
      window.setTimeout(() => setCopiedTitle(""), 1800);
    } catch {
      setCopiedTitle("");
    }
  }

  return (
    <main className="min-h-screen py-10">
      <section className="container-frame space-y-6 fade-in">
        <header className="surface-card p-6 md:p-7">
          <span className="pill mb-3">Private Pilot Guide</span>
          <h1 className="display-title text-3xl md:text-4xl">
            Family Doctor Test Pack
          </h1>
          <p className="mt-3 max-w-3xl text-cyan-50/82">
            This build is for early clinician feedback. It is designed to test
            whether the workflow and reasoning support feel useful, not to
            replace clinical judgment or process real patient information.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="surface-card-strong p-6 space-y-4">
            <h2 className="display-title text-2xl">How To Test</h2>
            <ol className="space-y-3 text-sm text-cyan-50/90">
              <li>1. Sign in using the invited pilot account you were given privately.</li>
              <li>2. Enter anonymized clinician-style notes only. Do not include names, dates of birth, contact details, or patient identifiers.</li>
              <li>3. Try two to four cases that fit the current prototype strengths.</li>
              <li>4. Check whether the output feels useful, cautious, and clinically organized.</li>
              <li>5. Send quick feedback through the feedback page or any message channel.</li>
            </ol>

            <div className="rounded-xl border border-amber-300/35 bg-amber-400/10 p-4 text-sm text-amber-100">
              <p className="font-semibold text-amber-50">Current strengths</p>
              <p className="mt-2 text-amber-100/90">
                Chest pain, respiratory, abdominal, neurologic, infection,
                urinary, back pain, and dizziness or syncope note patterns.
              </p>
            </div>
          </article>

          <aside className="surface-card p-6 space-y-4">
            <h2 className="display-title text-2xl">What To Notice</h2>
            <ul className="space-y-3 text-sm text-cyan-100/84">
              <li>Does the app surface sensible considerations for the note pattern?</li>
              <li>Are the suggested checks practical and coherent?</li>
              <li>Are the red flags appropriately cautious without being noisy?</li>
              <li>Does anything important feel missing or misleading?</li>
              <li>Would this save time or support thinking during documentation?</li>
            </ul>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/dashboard" className="btn-primary px-5 py-3">
                Start Testing
              </Link>
              <Link href="/feedback" className="btn-muted px-5 py-3">
                Open Feedback Form
              </Link>
            </div>
          </aside>
        </section>

        <section className="surface-card p-6 md:p-7">
          <h2 className="display-title text-2xl">Suggested Sample Cases</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {sampleCases.map((sample) => (
              <article
                key={sample.title}
                className="rounded-xl border border-cyan-200/15 bg-cyan-950/35 p-4"
              >
                <p className="text-sm font-semibold text-cyan-50">
                  {sample.title}
                </p>
                <p className="mt-3 text-sm leading-6 text-cyan-100/82">
                  {sample.prompt}
                </p>
                <button
                  type="button"
                  onClick={() => handleCopy(sample.title, sample.prompt)}
                  className="btn-muted mt-4 px-4 py-2 text-sm"
                >
                  {copiedTitle === sample.title ? "Copied Sample" : "Copy Sample Case"}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="surface-card-strong p-6 md:p-7">
          <h2 className="display-title text-2xl">Quick Feedback Template</h2>
          <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-cyan-300/20 bg-cyan-950/35 p-4 text-sm text-cyan-50/88">
{`Case type:
Was the output useful? Yes / Partly / No
What felt strong:
What felt missing or off:
Would you use something like this again? Yes / Maybe / No
`}
          </pre>
        </section>
      </section>
    </main>
  );
}
