"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CsrfResponse = {
  csrfToken?: string;
};

type CredentialsResponse = {
  url?: string;
};

export default function LoginPage() {
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
              <li>Private pilot access only</li>
            </ul>
            <div className="mt-6 rounded-xl border border-cyan-200/20 bg-cyan-950/35 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/65">
                Pilot Access Notice
              </p>
              <p className="mt-3 text-sm text-cyan-50/90">
                Access is intended for invited testers only. Share credentials
                privately and avoid entering real patient data.
              </p>
              <p className="mt-3 text-sm text-cyan-100/80">
                If someone needs access, add them to the pilot account list in
                your environment settings rather than publishing one public
                demo login.
              </p>
            </div>
          </aside>

          <form
            autoComplete="off"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setIsSubmitting(true);

              try {
                const csrfResponse = await fetch("/api/auth/csrf", {
                  cache: "no-store",
                });
                const csrf = (await csrfResponse.json()) as CsrfResponse;

                if (!csrfResponse.ok || !csrf.csrfToken) {
                  throw new Error("Could not initialize a secure sign-in.");
                }

                const formData = new URLSearchParams({
                  csrfToken: csrf.csrfToken,
                  email: email.trim(),
                  password,
                  json: "true",
                });

                const authResponse = await fetch(
                  "/api/auth/callback/credentials",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: formData,
                  }
                );
                const authResult =
                  (await authResponse.json()) as CredentialsResponse;
                const signInFailed =
                  !authResponse.ok ||
                  authResult.url?.includes("/api/auth/error") ||
                  authResult.url?.includes("error=");

                if (signInFailed) {
                  setError(
                    "Sign-in failed. Check the email and password exactly, then retry."
                  );
                  return;
                }

                const sessionResponse = await fetch("/api/auth/session", {
                  cache: "no-store",
                });
                const session = (await sessionResponse.json()) as {
                  user?: { email?: string };
                };

                if (!session.user?.email) {
                  throw new Error("The sign-in completed but no session was created.");
                }

                router.replace("/dashboard");
                router.refresh();
              } catch (signInError) {
                setError(
                  signInError instanceof Error
                    ? signInError.message
                    : "Sign-in could not be completed. Please retry."
                );
              } finally {
                setIsSubmitting(false);
              }
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
                name="pilot-email"
                autoComplete="off"
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
                name="pilot-password"
                autoComplete="new-password"
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
