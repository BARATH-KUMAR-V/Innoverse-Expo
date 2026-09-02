"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function Header() {
  const { status, user, logout } = useAuthStore();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="border-b border-navy-deep/10 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-lg tracking-[0.15em] text-navy-deep">
          INNOVERSE
        </Link>
        <nav className="flex items-center gap-6 text-sm text-navy-deep/70">
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
      </div>
    </header>
  );
}
