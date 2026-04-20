"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const demoEmail = "doctor@example.com";
  const demoPassword = "DevOnly!456";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center py-10">
      <section className="container-frame fade-in">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1fr]">
          <aside className="surface-card-strong p-7">
            <span className="pill mb-4">Secure Access</span>
            <h1 className="display-title text-3xl md:text-4xl">Doctor Login</h1>
            <p className="mt-4 text-cyan-50/85">
              Sign in to continue documenting consultations and generating
              structured reasoning support.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-cyan-100/80">
              <li>Session protected</li>
              <li>Clinician-facing workflow</li>
              <li>Ready for backend LLM connection</li>
            </ul>
            <div className="mt-6 rounded-xl border border-cyan-200/20 bg-cyan-950/35 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/65">
                Public Demo Notice
              </p>
              <p className="mt-3 text-sm text-cyan-50/90">
                This app is shared for public testing and feedback only. Do not
                enter real patient data.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEmail(demoEmail);
                  setPassword(demoPassword);
                }}
                className="btn-muted mt-4 px-4 py-2 text-sm"
              >
                Use Demo Login
              </button>
            </div>
          </aside>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setIsSubmitting(true);

              const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
              });

              setIsSubmitting(false);

              if (result?.ok) {
                router.push("/dashboard");
                return;
              }

              setError("Sign-in failed. Check your credentials and retry.");
            }}
            className="surface-card p-7 space-y-4"
          >
            <p className="text-xs uppercase tracking-[0.17em] text-cyan-100/70">
              Credentials
            </p>

            <label className="block space-y-2">
              <span className="text-sm text-cyan-50/90">Email</span>
              <input
                type="email"
                placeholder="doctor@clinic.com"
                className="field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-cyan-50/90">Password</span>
              <input
                type="password"
                placeholder="Enter password"
                className="field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {error && (
              <p className="rounded-lg border border-red-300/35 bg-red-400/10 px-3 py-2 text-sm text-red-100">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
