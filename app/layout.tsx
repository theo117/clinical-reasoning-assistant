import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import AppHeader from "./components/AppHeader";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="app-shell min-h-screen text-gray-100 antialiased">
        <ClerkProvider>
          <AppHeader />
          {children}
          <footer className="border-t border-cyan-200/10 bg-[rgba(4,18,24,0.62)]">
            <div className="container-frame py-5 text-center text-sm text-cyan-100/70">
              powered by teodor dev tech
            </div>
          </footer>
        </ClerkProvider>
      </body>
    </html>
  );
}
