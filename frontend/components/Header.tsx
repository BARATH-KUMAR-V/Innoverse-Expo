"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function Header() {
  const { status, user, logout } = useAuthStore();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.push("/");
    setMenuOpen(false);
  }

  return (
    <header className="border-b border-navy-deep/10 bg-cream/95 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        {/* Logo */}
        <Link
          href="/"
          className="font-serif text-base tracking-[0.15em] text-navy-deep sm:text-lg"
          onClick={() => setMenuOpen(false)}
        >
          INNOVERSE
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm text-navy-deep/70 sm:flex">
          <Link href="/results" className="transition hover:text-gold">
            Results
          </Link>
          {status === "authenticated" && user && (
            <>
              {user.isAdmin && (
                <Link href="/admin" className="transition hover:text-gold">
                  Admin
                </Link>
              )}
              <button onClick={handleLogout} className="transition hover:text-gold">
                Sign out
              </button>
            </>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded sm:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <span
            className={`block h-0.5 w-5 bg-navy-deep transition-all duration-200 ${menuOpen ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`block h-0.5 w-5 bg-navy-deep transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block h-0.5 w-5 bg-navy-deep transition-all duration-200 ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <nav className="border-t border-navy-deep/10 bg-cream px-4 pb-4 pt-2 sm:hidden">
          <div className="flex flex-col gap-1">
            <Link
              href="/results"
              className="rounded px-3 py-2.5 text-sm text-navy-deep/70 transition hover:bg-navy-deep/5 hover:text-gold"
              onClick={() => setMenuOpen(false)}
            >
              Results
            </Link>
            {status === "authenticated" && user && (
              <>
                {user.isAdmin && (
                  <Link
                    href="/admin"
                    className="rounded px-3 py-2.5 text-sm text-navy-deep/70 transition hover:bg-navy-deep/5 hover:text-gold"
                    onClick={() => setMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="rounded px-3 py-2.5 text-left text-sm text-navy-deep/70 transition hover:bg-navy-deep/5 hover:text-gold"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
