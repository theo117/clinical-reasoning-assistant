"use client";

import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  formatValidationError,
  MAX_FOLLOW_UP_CHARS,
  MAX_NOTES_CHARS,
  validateCaseInput,
} from "@/lib/caseInput";
import {
  deleteClinicalCase,
  loadSavedCases,
  saveClinicalCase,
  type SavedClinicalCase,
} from "@/lib/caseStorage";

type ValidationResponse = {
  ok: boolean;
  error?: string;
  matches: Array<{ label: string }>;
};

export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [caseId, setCaseId] = useState("");
  const [caseLabel, setCaseLabel] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [referralSpecialty, setReferralSpecialty] = useState("General specialist");
  const [savedCases, setSavedCases] = useState<SavedClinicalCase[]>([]);
  const [phiError, setPhiError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const notesRemaining = MAX_NOTES_CHARS - notes.length;
  const followUpRemaining = MAX_FOLLOW_UP_CHARS - followUp.length;
  const canContinue =
    notes.trim().length > 0 &&
    notes.length <= MAX_NOTES_CHARS &&
    followUp.length <= MAX_FOLLOW_UP_CHARS &&
    !isValidating;

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/login");
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;
    const refreshSavedCases = () => setSavedCases(loadSavedCases(userId));
    queueMicrotask(refreshSavedCases);
    window.addEventListener("storage", refreshSavedCases);
    return () => window.removeEventListener("storage", refreshSavedCases);
  }, [user?.id]);

  function loadCase(clinicalCase: SavedClinicalCase) {
    setCaseId(clinicalCase.id);
    setCaseLabel(clinicalCase.label);
    setNotes(clinicalCase.notes);
    setFollowUp(clinicalCase.followUp);
    setReferralSpecialty(clinicalCase.referralSpecialty);
    setPhiError("");
  }

  function startBlankCase() {
    setCaseId("");
    setCaseLabel("");
    setNotes("");
    setFollowUp("");
    setReferralSpecialty("General specialist");
    setPhiError("");
  }

  async function handleContinue() {
    const localValidation = validateCaseInput({
      notes,
      followUp,
      referralSpecialty,
    });

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

      const now = new Date().toISOString();
      const activeId = caseId || crypto.randomUUID();
      const activeCase: SavedClinicalCase = {
        id: activeId,
        label: caseLabel.trim() || `Anonymized case ${new Date().toLocaleDateString()}`,
        ...localValidation.input,
        createdAt:
          savedCases.find((item) => item.id === activeId)?.createdAt ?? now,
        updatedAt: now,
      };

      if (user?.id) {
        saveClinicalCase(user.id, activeCase);
        setSavedCases(loadSavedCases(user.id));
      }

      localStorage.setItem("consult_notes", localValidation.input.notes);
      localStorage.setItem(
        "consult_payload",
        JSON.stringify({ ...localValidation.input, caseId: activeId, caseLabel: activeCase.label })
      );
      router.push("/results");
    } catch {
      setPhiError("Validation failed. Check your connection and retry.");
    } finally {
      setIsValidating(false);
    }
  }

  if (!isLoaded) {
    return <div className="container-frame py-8 text-cyan-100">Loading...</div>;
  }

  return (
    <main className="min-h-screen py-5 md:py-10">
      <section className="container-frame space-y-6 fade-in">
        <header className="surface-card p-6 md:p-7 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="pill mb-3">Session Active</span>
            <h1 className="display-title text-3xl md:text-4xl">
              Doctor Dashboard
            </h1>
            <p className="mt-3 text-cyan-50/80">
              Welcome back, {user?.primaryEmailAddress?.emailAddress ?? "clinician"}
            </p>
          </div>

          <button
            onClick={async () => {
              await signOut();
              router.push("/login");
            }}
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
            Paste anonymized consultation notes. You will get an explainable
            differential, next steps, and editable documentation drafts.
          </p>

          <div className="rounded-xl border border-amber-300/35 bg-amber-400/10 p-4 text-sm text-amber-100">
            <p className="font-semibold text-amber-50">Keep the patient anonymous</p>
            <p className="mt-2 text-amber-100/90">
              Remove names, contact details, record numbers, addresses, and
              dates of birth. The app screens common identifiers before any AI
              request is made.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/feedback" className="btn-muted px-4 py-2 text-sm">
                Send Feedback
              </Link>
              <Link href="/calculators" className="btn-muted px-4 py-2 text-sm">
                Dose calculator
              </Link>
            </div>
          </div>

          {savedCases.length > 0 && (
            <section className="rounded-xl border border-cyan-200/20 bg-cyan-950/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-cyan-50">Saved anonymized cases</h3>
                  <p className="mt-1 text-xs text-cyan-100/60">
                    Stored only in this browser for follow-up analysis.
                  </p>
                </div>
                <button onClick={startBlankCase} className="btn-muted px-3 py-2 text-sm">
                  New case
                </button>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {savedCases.map((clinicalCase) => (
                  <div key={clinicalCase.id} className="rounded-lg border border-cyan-200/15 bg-cyan-950/40 p-3">
                    <button onClick={() => loadCase(clinicalCase)} className="w-full text-left">
                      <span className="block font-medium text-cyan-50">{clinicalCase.label}</span>
                      <span className="mt-1 block text-xs text-cyan-100/60">
                        Updated {new Date(clinicalCase.updatedAt).toLocaleString()}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        if (!user?.id || !window.confirm("Delete this locally saved case?")) return;
                        deleteClinicalCase(user.id, clinicalCase.id);
                        setSavedCases(loadSavedCases(user.id));
                        if (caseId === clinicalCase.id) startBlankCase();
                      }}
                      className="mt-2 text-xs text-rose-200/80 hover:text-rose-100"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <label className="block space-y-2">
            <span className="text-sm text-cyan-50/90">Anonymous case label</span>
            <input
              value={caseLabel}
              onChange={(event) => setCaseLabel(event.target.value.slice(0, 80))}
              placeholder="Example: Adult chest pain follow-up"
              className="field"
            />
          </label>

          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              if (phiError) {
                setPhiError("");
              }
            }}
            placeholder={"Example:\nPresenting complaint and timeline...\nRelevant positives and negatives...\nVitals and examination...\nHistory, medicines, allergies and risk factors..."}
            className="field-textarea min-h-70"
            aria-describedby="notes-guidance notes-count"
          />

          <label className="block space-y-2">
            <span className="text-sm text-cyan-50/90">Follow-up results or interval change</span>
            <textarea
              value={followUp}
              onChange={(event) => {
                setFollowUp(event.target.value);
                if (phiError) setPhiError("");
              }}
              placeholder="Add new results, response to management, or changes since the previous review..."
              className="field-textarea min-h-40"
            />
            <span className={followUpRemaining < 0 ? "text-xs text-rose-100" : "text-xs text-cyan-100/60"}>
              {followUpRemaining.toLocaleString()} characters remaining
            </span>
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-cyan-50/90">Referral destination</span>
            <select
              value={referralSpecialty}
              onChange={(event) => setReferralSpecialty(event.target.value)}
              className="field"
            >
              <option>General specialist</option>
              <option>Emergency department</option>
              <option>Internal medicine</option>
              <option>General surgery</option>
              <option>Cardiology</option>
              <option>Paediatrics</option>
              <option>Obstetrics and gynaecology</option>
              <option>Neurology</option>
              <option>Psychiatry</option>
              <option>Orthopaedics</option>
            </select>
          </label>

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
              {isValidating ? "Checking Notes..." : "Analyze Case"}
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
