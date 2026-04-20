"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { detectPhi } from "@/lib/piiGuard";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [phiError, setPhiError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

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
          />

          {phiError && (
            <p className="rounded-lg border border-rose-300/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {phiError}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs uppercase tracking-[0.12em] text-cyan-100/65">
              Do not include patient-identifiable details
            </p>
            <button
              disabled={!notes.trim()}
              onClick={async () => {
                const localMatches = detectPhi(notes);
                if (localMatches.length > 0) {
                  const labels = localMatches.map((m) => m.label).join(", ");
                  setPhiError(`Possible PHI detected (${labels}). Remove identifiers before continuing.`);
                  return;
                }

                const response = await fetch("/api/validate-notes", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ notes }),
                });

                if (!response.ok) {
                  setPhiError("Validation failed. Please retry.");
                  return;
                }

                const data = (await response.json()) as { ok: boolean; matches: Array<{ label: string }> };

                if (!data.ok) {
                  const labels = data.matches.map((m) => m.label).join(", ");
                  setPhiError(`Possible PHI detected (${labels}). Remove identifiers before continuing.`);
                  return;
                }

                localStorage.setItem("consult_notes", notes);
                router.push("/consult");
              }}
              className="btn-primary px-6 py-3 disabled:cursor-not-allowed disabled:opacity-55"
            >
              Continue to Review
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
