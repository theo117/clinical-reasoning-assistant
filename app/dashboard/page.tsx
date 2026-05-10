"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  formatValidationError,
  MAX_NOTES_CHARS,
  validateCaseInput,
} from "@/lib/caseInput";

type ValidationResponse = {
  ok: boolean;
  error?: string;
  matches: Array<{ label: string }>;
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [phiError, setPhiError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const notesRemaining = MAX_NOTES_CHARS - notes.length;
  const canContinue =
    notes.trim().length > 0 && notes.length <= MAX_NOTES_CHARS && !isValidating;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  async function handleContinue() {
    const localValidation = validateCaseInput({ notes });

    if (!localValidation.ok) {
      setPhiError(formatValidationError(localValidation));
      return;
    }

    setIsValidating(true);
    setPhiError("");

    try {
      const response = await fetch("/api/validate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localValidation.input),
      });

      const data = (await response.json()) as ValidationResponse;

      if (!response.ok || !data.ok) {
        const labels = data.matches?.map((match) => match.label).join(", ");
        setPhiError(
          labels
            ? `${data.error ?? "Possible PHI detected."} (${labels}).`
            : data.error ?? "Validation failed. Please retry."
        );
        return;
      }

      localStorage.setItem("consult_notes", localValidation.input.notes);
      localStorage.removeItem("consult_payload");
      router.push("/consult");
    } catch {
      setPhiError("Validation failed. Check your connection and retry.");
    } finally {
      setIsValidating(false);
    }
  }

  if (status === "loading") {
    return <div className="container-frame py-8 text-cyan-100">Loading...</div>;
  }

  return (
    <main className="min-h-screen py-10">
      <section className="container-frame space-y-6 fade-in">
        <header className="surface-card p-6 md:p-7 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="pill mb-3">Session Active</span>
            <h1 className="display-title text-3xl md:text-4xl">
              Doctor Dashboard
            </h1>
            <p className="mt-3 text-cyan-50/80">
              Welcome back, {session?.user?.email}
            </p>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="btn-muted px-4 py-2 text-sm"
          >
            Logout
          </button>
        </header>

        <section className="surface-card-strong p-6 md:p-7 space-y-4">
          <h2 className="display-title text-2xl">
            Consultation Reasoning Notes
          </h2>
          <p className="text-sm text-cyan-100/80">
            Capture relevant symptoms, risk factors, exclusions, and timeline.
            This content remains clinician-authored and assistive.
          </p>

          <div className="rounded-xl border border-amber-300/35 bg-amber-400/10 p-4 text-sm text-amber-100">
            <p className="font-semibold text-amber-50">Pilot coverage guidance</p>
            <p className="mt-2 text-amber-100/90">
              This prototype is currently strongest on chest pain, respiratory,
              abdominal, neurologic, infection, urinary, back pain, and
              dizziness or syncope presentations.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/pilot" className="btn-muted px-4 py-2 text-sm">
                View Tester Guide
              </Link>
              <Link href="/feedback" className="btn-muted px-4 py-2 text-sm">
                Open Feedback Form
              </Link>
            </div>
          </div>

          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              if (phiError) {
                setPhiError("");
              }
            }}
            placeholder="Example: 45 y/o male with exertional chest pain, diabetes, no fever, pain relieved at rest..."
            className="field-textarea min-h-55"
            aria-describedby="notes-guidance notes-count"
          />

          {phiError && (
            <p className="rounded-lg border border-rose-300/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {phiError}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p
                id="notes-guidance"
                className="text-xs uppercase tracking-[0.12em] text-cyan-100/65"
              >
                Do not include patient-identifiable details
              </p>
              <p
                id="notes-count"
                className={`text-xs ${
                  notesRemaining < 0 ? "text-rose-100" : "text-cyan-100/60"
                }`}
              >
                {notesRemaining.toLocaleString()} characters remaining
              </p>
            </div>
            <button
              disabled={!canContinue}
              onClick={handleContinue}
              className="btn-primary px-6 py-3 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isValidating ? "Checking Notes..." : "Continue to Review"}
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
