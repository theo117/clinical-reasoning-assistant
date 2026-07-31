"use client";

import { useMemo, useState } from "react";

function positiveNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default function CalculatorsPage() {
  const [weight, setWeight] = useState("");
  const [protocolDose, setProtocolDose] = useState("");
  const [maximumDose, setMaximumDose] = useState("");
  const [concentration, setConcentration] = useState("");
  const [protocolConfirmed, setProtocolConfirmed] = useState(false);

  const result = useMemo(() => {
    const weightKg = positiveNumber(weight);
    const doseMgKg = positiveNumber(protocolDose);
    const maxMg = maximumDose ? positiveNumber(maximumDose) : null;
    const concentrationMgMl = concentration ? positiveNumber(concentration) : null;

    if (!weightKg || !doseMgKg) return null;
    const calculatedMg = weightKg * doseMgKg;
    const doseMg = maxMg ? Math.min(calculatedMg, maxMg) : calculatedMg;
    return {
      calculatedMg,
      doseMg,
      capped: Boolean(maxMg && calculatedMg > maxMg),
      volumeMl: concentrationMgMl ? doseMg / concentrationMgMl : null,
    };
  }, [concentration, maximumDose, protocolDose, weight]);

  return (
    <main className="min-h-screen py-5 md:py-10">
      <section className="container-frame space-y-5 fade-in">
        <header className="surface-card p-5 md:p-7">
          <span className="pill">Deterministic calculation</span>
          <h1 className="display-title mt-4 text-3xl md:text-4xl">Guarded dose calculator</h1>
          <p className="mt-3 max-w-3xl text-cyan-50/80">
            This calculator performs arithmetic only. It does not select a medicine,
            recommend a dose, determine frequency, or check contraindications.
          </p>
        </header>

        <section className="rounded-xl border border-rose-300/35 bg-rose-500/10 p-4 text-sm text-rose-100">
          Enter dose parameters only from a current, medicine-specific protocol that
          you have independently verified. Confirm indication, age limits, renal and
          hepatic function, allergies, interactions, formulation, frequency, and
          maximum daily dose separately.
        </section>

        <section className="surface-card-strong grid gap-4 p-5 md:grid-cols-2 md:p-7">
          <label className="space-y-2">
            <span className="text-sm text-cyan-50">Weight (kg)</span>
            <input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} className="field" placeholder="e.g. 18.5" />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-cyan-50">Verified protocol dose (mg/kg per dose)</span>
            <input inputMode="decimal" value={protocolDose} onChange={(e) => setProtocolDose(e.target.value)} className="field" placeholder="Enter from verified protocol" />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-cyan-50">Maximum single dose (mg, optional)</span>
            <input inputMode="decimal" value={maximumDose} onChange={(e) => setMaximumDose(e.target.value)} className="field" />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-cyan-50">Formulation concentration (mg/mL, optional)</span>
            <input inputMode="decimal" value={concentration} onChange={(e) => setConcentration(e.target.value)} className="field" />
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-cyan-200/20 bg-cyan-950/35 p-4 md:col-span-2">
            <input type="checkbox" checked={protocolConfirmed} onChange={(e) => setProtocolConfirmed(e.target.checked)} className="mt-1" />
            <span className="text-sm text-cyan-50/85">
              I independently confirmed the medicine, indication, mg/kg value,
              maximum dose, formulation, and patient-specific safety factors in a
              current authoritative protocol.
            </span>
          </label>
        </section>

        {protocolConfirmed && result ? (
          <section className="surface-card p-5 md:p-7">
            <h2 className="display-title text-2xl">Arithmetic result</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-cyan-200/20 bg-cyan-950/35 p-4">
                <dt className="text-xs uppercase tracking-wide text-cyan-100/60">Calculated amount</dt>
                <dd className="mt-2 text-2xl font-semibold text-cyan-50">{result.calculatedMg.toFixed(2)} mg</dd>
              </div>
              <div className="rounded-lg border border-cyan-200/20 bg-cyan-950/35 p-4">
                <dt className="text-xs uppercase tracking-wide text-cyan-100/60">After supplied maximum</dt>
                <dd className="mt-2 text-2xl font-semibold text-cyan-50">{result.doseMg.toFixed(2)} mg</dd>
                {result.capped && <p className="mt-1 text-xs text-amber-200">Capped at the maximum you supplied.</p>}
              </div>
              {result.volumeMl !== null && (
                <div className="rounded-lg border border-cyan-200/20 bg-cyan-950/35 p-4 sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-cyan-100/60">Volume at supplied concentration</dt>
                  <dd className="mt-2 text-2xl font-semibold text-cyan-50">{result.volumeMl.toFixed(2)} mL</dd>
                </div>
              )}
            </dl>
            <p className="mt-4 text-sm text-amber-100">
              Independently recalculate and confirm before prescribing or administering.
            </p>
          </section>
        ) : (
          <p className="rounded-xl border border-cyan-200/20 bg-cyan-950/30 p-4 text-sm text-cyan-100/70">
            Complete the required fields and protocol confirmation to display a result.
          </p>
        )}
      </section>
    </main>
  );
}
