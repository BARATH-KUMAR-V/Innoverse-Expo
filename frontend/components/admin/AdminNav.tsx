"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/teams", label: "Manage Teams" },
  { href: "/admin/voting", label: "Voting Control" },
  { href: "/admin/rankings", label: "Rankings & Export" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="border-b border-gold/20 bg-navy-deep text-cream">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div>
          <p className="font-serif text-sm uppercase tracking-[0.25em] text-gold">Innoverse</p>
          <p className="text-xs uppercase tracking-widest text-cream/50">Admin</p>
        </div>
        <nav className="flex flex-wrap items-center gap-5 text-xs uppercase tracking-wide">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition hover:text-gold ${pathname === link.href ? "text-gold" : "text-cream/70"}`}
            >
              {link.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="text-cream/70 transition hover:text-gold">
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
