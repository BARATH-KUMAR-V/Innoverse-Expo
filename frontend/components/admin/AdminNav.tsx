"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/teams", label: "Manage Teams" },
  { href: "/admin/event", label: "Event Settings" },
  { href: "/admin/voting", label: "Voting Control" },
  { href: "/admin/rankings", label: "Rankings & Export" },
  { href: "/admin/voters", label: "Voters" },
  { href: "/admin/eligible-voters", label: "Eligible Voters" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.push("/");
    setMenuOpen(false);
  }

  return (
    <header className="border-b border-gold/20 bg-navy-deep text-cream sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        {/* Brand */}
        <div>
          <p className="font-serif text-sm uppercase tracking-[0.25em] text-gold">Innoverse</p>
          <p className="text-[10px] uppercase tracking-widest text-cream/50">Admin</p>
        </div>

        {/* Desktop nav */}
        <nav className="hidden flex-wrap items-center gap-5 text-xs uppercase tracking-wide sm:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition hover:text-gold ${pathname === link.href ? "text-gold" : "text-cream/70"}`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/gallery"
            className="rounded border border-gold/40 px-3 py-1 text-gold transition hover:bg-gold hover:text-navy-deep"
          >
            ← Gallery
          </Link>
          <button onClick={handleLogout} className="text-cream/70 transition hover:text-gold">
            Sign out
          </button>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded sm:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <span
            className={`block h-0.5 w-5 bg-cream transition-all duration-200 ${menuOpen ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`block h-0.5 w-5 bg-cream transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block h-0.5 w-5 bg-cream transition-all duration-200 ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <nav className="border-t border-gold/20 bg-navy-deep px-4 pb-4 pt-2 sm:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded px-3 py-2.5 text-sm uppercase tracking-wide transition hover:bg-gold/10 ${
                  pathname === link.href ? "text-gold" : "text-cream/70"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/gallery"
              className="rounded border border-gold/30 px-3 py-2.5 text-sm uppercase tracking-wide text-gold transition hover:bg-gold/10"
              onClick={() => setMenuOpen(false)}
            >
              ← View Gallery
            </Link>
            <button
              onClick={handleLogout}
              className="rounded px-3 py-2.5 text-left text-sm uppercase tracking-wide text-cream/70 transition hover:bg-gold/10 hover:text-gold"
            >
              Sign out
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
