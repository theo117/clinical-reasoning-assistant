import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const demoEmail = process.env.DEMO_DOCTOR_EMAIL;
const demoPassword = process.env.DEMO_DOCTOR_PASSWORD;

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        if (!demoEmail || !demoPassword) {
          throw new Error(
            "Missing demo authentication environment variables."
          );
        }

        if (
          credentials?.email === demoEmail &&
          credentials?.password === demoPassword
        ) {
          return { id: "1", email: credentials.email };
        }
        return null;
      },
    }),
  ],
};
