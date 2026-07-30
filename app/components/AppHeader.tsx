"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/pilot", label: "Pilot Guide" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/feedback", label: "Feedback" },
];

export default function AppHeader() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-cyan-200/10 bg-[rgba(4,18,24,0.82)] backdrop-blur-xl">
      <div className="container-frame flex items-center justify-between gap-3 py-3 md:py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="pill hidden sm:inline-flex">Private Pilot</span>
          <span className="display-title text-lg text-cyan-50">
            Clinical Reasoning Assistant
          </span>
        </Link>

        <nav className="hidden flex-wrap gap-2 md:flex">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-cyan-400/14 text-cyan-50 ring-1 ring-cyan-300/35"
                    : "text-cyan-100/75 hover:bg-cyan-400/10 hover:text-cyan-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {isLoaded && !isSignedIn ? (
            <Link href="/login" className="rounded-full px-4 py-2 text-sm text-cyan-100/75 hover:bg-cyan-400/10 hover:text-cyan-50">
              Sign In
            </Link>
          ) : null}
          {isLoaded && isSignedIn ? <UserButton /> : null}
        </nav>
      </div>
    </header>
  );
}
