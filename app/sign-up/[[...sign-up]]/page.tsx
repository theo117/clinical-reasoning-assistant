import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-[80vh] items-center justify-center py-8">
      <SignUp
        path="/sign-up"
        signInUrl="/login"
        fallbackRedirectUrl="/dashboard"
      />
    </main>
  );
}
