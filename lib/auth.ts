import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

type PilotAccount = {
  email: string;
  password: string;
};

function parsePilotAccounts(): PilotAccount[] {
  const configuredAccounts = process.env.PILOT_DOCTOR_ACCOUNTS;

  if (configuredAccounts) {
    return configuredAccounts
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [email, password] = entry.split(":").map((part) => part.trim());

        if (!email || !password) {
          return null;
        }

        return { email, password };
      })
      .filter((account): account is PilotAccount => Boolean(account));
  }

  const singleEmail = process.env.DEMO_DOCTOR_EMAIL?.trim();
  const singlePassword = process.env.DEMO_DOCTOR_PASSWORD?.trim();

  if (!singleEmail || !singlePassword) {
    return [];
  }

  return [{ email: singleEmail, password: singlePassword }];
}

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
        const pilotAccounts = parsePilotAccounts();

        if (pilotAccounts.length === 0) {
          throw new Error(
            "Missing pilot authentication environment variables."
          );
        }

        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password?.trim();

        const matchedAccount = pilotAccounts.find(
          (account) =>
            account.email.toLowerCase() === email && account.password === password
        );

        if (matchedAccount) {
          return { id: matchedAccount.email, email: matchedAccount.email };
        }

        return null;
      },
    }),
  ],
};
