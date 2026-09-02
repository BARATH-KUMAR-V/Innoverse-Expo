"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { googleLoginUrl } from "@/lib/api";
import AdminNav from "@/components/admin/AdminNav";
import LoadingState from "@/components/LoadingState";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { status, user, fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  if (status === "idle" || status === "loading") {
    return <LoadingState message="Loading..." />;
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-navy-deep px-6 text-center text-cream">
        <p className="font-serif text-2xl uppercase tracking-wide">Innoverse Admin</p>
        <p className="max-w-sm text-sm text-cream/70">Sign in with your college Google account to continue.</p>
        <a
          href={googleLoginUrl()}
          className="rounded-sm border border-gold px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold transition hover:bg-gold hover:text-navy-deep"
        >
          Continue with Google
        </a>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-navy-deep px-6 text-center text-cream">
        <p className="font-serif text-2xl uppercase tracking-wide">Access Denied</p>
        <p className="max-w-sm text-sm leading-relaxed text-cream/70">
          You are signed in, but this account is not authorized to view the admin dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <AdminNav />
      <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>
    </div>
  );
}
