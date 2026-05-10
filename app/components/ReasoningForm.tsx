"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatValidationError,
  MAX_NOTES_CHARS,
  validateCaseInput,
} from "@/lib/caseInput";

export default function ReasoningForm() {
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const remaining = MAX_NOTES_CHARS - notes.length;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validation = validateCaseInput({ notes });

    if (!validation.ok) {
      setError(formatValidationError(validation));
      return;
    }

    localStorage.setItem("consult_notes", validation.input.notes);
    localStorage.removeItem("consult_payload");
    router.push("/consult");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          if (error) {
            setError("");
          }
        }}
        placeholder="Enter anonymized clinical reasoning notes: symptoms, risks, negatives, timeline..."
        className="field-textarea h-48"
        required
      />

      <div className="space-y-1 text-sm text-cyan-100/75">
        <p>Doctor-only input</p>
        <p>No patient audio recorded</p>
        <p>Assistive tool - not diagnostic</p>
        <p className={remaining < 0 ? "text-rose-100" : "text-cyan-100/60"}>
          {remaining.toLocaleString()} characters remaining
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-rose-300/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!notes.trim() || remaining < 0}
        className="btn-primary px-6 py-3 disabled:cursor-not-allowed disabled:opacity-55"
      >
        Generate Reasoning Support
      </button>
    </form>
  );
}
