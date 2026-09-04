"use client";

import { useEffect, useState } from "react";
import { apiGet, ApiError } from "@/lib/api";
import LoadingState from "@/components/LoadingState";
import ErrorBanner from "@/components/ErrorBanner";

interface UserRow {
  id: string;
  google_id: string;
  name: string;
  email: string;
  picture: string | null;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EligibleVotersPage() {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiGet<UserRow[]>("/admin/users")
      .then(setUsers)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Something went wrong.")
      );
  }, []);

  const filtered = users?.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header row */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl uppercase tracking-wide text-navy-deep">
            Eligible Voters
          </h1>
          <p className="mt-1 text-xs text-navy-deep/50">
            {users ? `${users.length} logged in user${users.length !== 1 ? "s" : ""}` : "Loading…"}
          </p>
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded border border-navy-deep/15 bg-white px-4 py-2 text-sm text-navy-deep placeholder-navy-deep/40 shadow-sm outline-none focus:border-gold sm:w-72"
        />
      </div>

      {error && <ErrorBanner message={error} />}
      {!users && !error && <LoadingState message="Loading eligible voters…" />}

      {filtered && filtered.length === 0 && (
        <p className="py-16 text-center text-sm text-navy-deep/50">
          {search ? "No eligible voters match your search." : "No users have logged in yet."}
        </p>
      )}

      {filtered && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-navy-deep/10 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-navy-deep text-cream">
              <tr>
                <th className="px-5 py-3 font-medium uppercase tracking-wide">#</th>
                <th className="px-5 py-3 font-medium uppercase tracking-wide">Name</th>
                <th className="px-5 py-3 font-medium uppercase tracking-wide">Email</th>
                <th className="px-5 py-3 font-medium uppercase tracking-wide">First Logged In</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr
                  key={u.id}
                  className="border-t border-navy-deep/10 transition hover:bg-navy-deep/[0.03]"
                >
                  <td className="px-5 py-3 text-navy-deep/40">{i + 1}</td>
                  <td className="px-5 py-3 font-medium text-navy-deep">
                    <div className="flex items-center gap-3">
                      {u.picture ? (
                        <img
                          src={u.picture}
                          alt={u.name}
                          className="h-8 w-8 rounded-full border border-navy-deep/10 bg-cream object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-navy-deep/10 bg-navy-deep/5 text-xs text-navy-deep">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-navy-deep/70">
                    <a
                      href={`mailto:${u.email}`}
                      className="hover:text-gold hover:underline"
                    >
                      {u.email}
                    </a>
                  </td>
                  <td className="px-5 py-3 text-navy-deep/50">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
