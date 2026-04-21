import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center py-12 md:py-16">
      <section className="container-frame fade-in">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
          <article className="surface-card p-7 md:p-10 lg:p-11">
            <span className="pill mb-4">Clinician Workspace</span>
            <h1 className="display-title text-4xl sm:text-5xl md:text-6xl">
              Clinical Reasoning Assistant
            </h1>
            <p className="mt-5 max-w-2xl text-[1.02rem] text-cyan-50/85">
              Capture consultation notes, organize differential thinking, and
              surface clearer next-step checks before clinical decisions are
              made.
            </p>
            <p className="mt-4 max-w-xl text-sm text-cyan-100/72">
              Built for clinician-authored input with privacy-aware validation
              and a local-first reasoning workflow.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard" className="btn-primary px-6 py-3">
                Open Dashboard
              </Link>
              <Link href="/login" className="btn-muted px-6 py-3">
                Sign In
              </Link>
            </div>

            <p className="mt-7 rounded-lg border border-amber-300/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              Public demo only. Please do not enter real patient information or
              personally identifiable data.
            </p>
          </article>

          <aside className="surface-card-strong p-6 md:p-7 lg:p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/70">
              Why this helps
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-cyan-200/15 bg-cyan-950/35 p-4">
                <p className="text-sm font-semibold text-cyan-50">
                  Structured clinical capture
                </p>
                <p className="mt-2 text-sm text-cyan-100/78">
                  Turn rough consultation notes into a more consistent review
                  flow before final decision-making.
                </p>
              </div>

              <div className="rounded-xl border border-cyan-200/15 bg-cyan-950/35 p-4">
                <p className="text-sm font-semibold text-cyan-50">
                  Privacy-aware workflow
                </p>
                <p className="mt-2 text-sm text-cyan-100/78">
                  PHI checks help reinforce demo-safe usage without changing the
                  clinician-led process.
                </p>
              </div>

              <div className="rounded-xl border border-cyan-200/15 bg-cyan-950/35 p-4">
                <p className="text-sm font-semibold text-cyan-50">
                  Flexible reasoning engine
                </p>
                <p className="mt-2 text-sm text-cyan-100/78">
                  Works with local LLM support when available and falls back to
                  built-in rules when needed.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
