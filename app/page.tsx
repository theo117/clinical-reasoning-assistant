import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center py-14">
      <section className="container-frame fade-in">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <article className="surface-card p-7 md:p-10">
            <span className="pill mb-4">Clinician Workspace</span>
            <h1 className="display-title text-4xl sm:text-5xl md:text-6xl">
              Clinical Reasoning Assistant
            </h1>
            <p className="mt-5 max-w-2xl text-[1.02rem] text-cyan-50/85">
              Structure consultation notes, track differential thinking, and
              generate clearer next-step checks before you move to decision-making.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard" className="btn-primary px-6 py-3">
                Enter Dashboard
              </Link>
              <Link href="/login" className="btn-muted px-6 py-3">
                Doctor Login
              </Link>
            </div>

            <p className="mt-6 rounded-lg border border-amber-300/35 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              Public demo only. Please do not enter real patient information or
              personally identifiable data.
            </p>
          </article>

          <aside className="surface-card-strong p-6 md:p-7">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/70">
              Why this helps
            </p>
            <ul className="mt-4 space-y-3 text-sm text-cyan-50/90">
              <li>Clinician-authored input only</li>
              <li>No patient audio collection</li>
              <li>Reasoning support, not diagnosis</li>
              <li>Ready for backend LLM integration later</li>
            </ul>
            <p className="mt-6 rounded-lg border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
              Frontend-first strategy is valid. You can add a hosted or local
              model endpoint later without redesigning this flow.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}
