import { create } from "zustand";
import { apiGet, apiPost } from "@/lib/api";
import { PublicUser } from "@/lib/types";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  status: AuthStatus;
  user: PublicUser | null;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Client-side auth state is purely a UI convenience for showing/hiding
 * elements and redirecting - it is rehydrated from GET /auth/me (backed by
 * the httpOnly session cookie) and is never itself trusted for anything
 * security-sensitive. The backend enforces every real permission check.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  status: "idle",
  user: null,

  fetchMe: async () => {
    if (get().status === "loading") return;
    set({ status: "loading" });
    try {
      const data = await apiGet<{ authenticated: boolean; user: PublicUser | null }>("/auth/me");
      set({ status: data.authenticated ? "authenticated" : "unauthenticated", user: data.user });
    } catch {
      set({ status: "unauthenticated", user: null });
    }
  },

  logout: async () => {
    try {
      await apiPost("/auth/logout");
    } finally {
      set({ status: "unauthenticated", user: null });
    }
  },
}));
