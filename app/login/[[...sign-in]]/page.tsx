import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <main className="min-h-[80vh] py-8 md:py-12">
      <section className="container-frame grid gap-6 lg:grid-cols-[0.85fr_1fr] lg:items-center">
        <aside className="surface-card-strong p-6 md:p-8">
          <span className="pill mb-4">Verified clinician access</span>
          <h1 className="display-title text-3xl md:text-4xl">
            Sign in securely
          </h1>
          <p className="mt-4 text-cyan-50/85">
            Continue with Google or verify your email address to access the
            clinician workspace.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-cyan-100/80">
            <li>Individual verified identity</li>
            <li>Protected clinician workspace</li>
            <li>No patient-identifiable information permitted</li>
          </ul>
        </aside>

        <div className="flex justify-center">
          <SignIn
            path="/login"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/dashboard"
          />
        </div>
      </section>
    </main>
  );
}
