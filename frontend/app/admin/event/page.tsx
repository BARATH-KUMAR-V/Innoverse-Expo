"use client";

import { useEffect, useState, FormEvent } from "react";
import { apiGet, apiPut, ApiError } from "@/lib/api";
import { EventSettings } from "@/lib/types";
import { isoToDateAndTimeInputs, dateAndTimeInputsToIso } from "@/lib/format-datetime";
import LoadingState from "@/components/LoadingState";
import ErrorBanner from "@/components/ErrorBanner";

interface FormState {
  expoName: string;
  expoDate: string;
  expoVenue: string;
  votingStartDate: string;
  votingStartTime: string;
  votingEndDate: string;
  votingEndTime: string;
  announceDate: string;
  announceTime: string;
}

function toFormState(settings: EventSettings): FormState {
  const start = isoToDateAndTimeInputs(settings.votingStartsAt);
  const end = isoToDateAndTimeInputs(settings.votingEndsAt);
  const announce = isoToDateAndTimeInputs(settings.winnersAnnounceAt);
  return {
    expoName: settings.expoName,
    expoDate: settings.expoDate ?? "",
    expoVenue: settings.expoVenue ?? "",
    votingStartDate: start.date,
    votingStartTime: start.time,
    votingEndDate: end.date,
    votingEndTime: end.time,
    announceDate: announce.date,
    announceTime: announce.time,
  };
}

export default function AdminEventSettingsPage() {
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<EventSettings>("/event-settings")
      .then((data) => setForm(toFormState(data)))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again."));
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await apiPut<EventSettings>("/admin/event-settings", {
        expoName: form.expoName.trim(),
        expoDate: form.expoDate.trim() || null,
        expoVenue: form.expoVenue.trim() || null,
        votingStartsAt: dateAndTimeInputsToIso(form.votingStartDate, form.votingStartTime),
        votingEndsAt: dateAndTimeInputsToIso(form.votingEndDate, form.votingEndTime),
        winnersAnnounceAt: dateAndTimeInputsToIso(form.announceDate, form.announceTime),
      });
      setForm(toFormState(updated));
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="mb-2 font-serif text-2xl uppercase tracking-wide text-navy-deep">Event Settings</h1>
      <p className="mb-8 text-sm text-navy-deep/60">
        These values drive the landing page, gallery, and vote confirmation screen — nothing about the event
        schedule is hardcoded. All times are interpreted in Asia/Kolkata (IST).
      </p>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} />
        </div>
      )}
      {!form && !error && <LoadingState message="Loading event settings..." />}

      {form && (
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
          <fieldset className="rounded-lg border border-navy-deep/10 bg-white p-6 shadow-sm">
            <legend className="px-1 text-xs font-medium uppercase tracking-wide text-gold">Expo Information</legend>
            <div className="space-y-4">
              <Field label="Expo Name">
                <input
                  type="text"
                  value={form.expoName}
                  onChange={(e) => update("expoName", e.target.value)}
                  required
                  className="input"
                />
              </Field>
              <Field label="Expo Date / Hours" hint='e.g. "Thursday – Saturday, 10:00 AM – 5:00 PM"'>
                <input
                  type="text"
                  value={form.expoDate}
                  onChange={(e) => update("expoDate", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Expo Venue">
                <input
                  type="text"
                  value={form.expoVenue}
                  onChange={(e) => update("expoVenue", e.target.value)}
                  className="input"
                />
              </Field>
            </div>
          </fieldset>

          <fieldset className="rounded-lg border border-navy-deep/10 bg-white p-6 shadow-sm">
            <legend className="px-1 text-xs font-medium uppercase tracking-wide text-gold">Voting Schedule</legend>
            <div className="space-y-4">
              <DateTimeField
                label="Voting Starts"
                date={form.votingStartDate}
                time={form.votingStartTime}
                onDateChange={(v) => update("votingStartDate", v)}
                onTimeChange={(v) => update("votingStartTime", v)}
                hint="Informational only — voting still requires the Start Voting button on the Voting Control page."
              />
              <DateTimeField
                label="Voting Closes"
                date={form.votingEndDate}
                time={form.votingEndTime}
                onDateChange={(v) => update("votingEndDate", v)}
                onTimeChange={(v) => update("votingEndTime", v)}
                hint="Voting automatically closes once this passes, even if left open."
              />
            </div>
          </fieldset>

          <fieldset className="rounded-lg border border-navy-deep/10 bg-white p-6 shadow-sm">
            <legend className="px-1 text-xs font-medium uppercase tracking-wide text-gold">Result Schedule</legend>
            <DateTimeField
              label="Winners Announced"
              date={form.announceDate}
              time={form.announceTime}
              onDateChange={(v) => update("announceDate", v)}
              onTimeChange={(v) => update("announceTime", v)}
              hint="Shown to students before they vote. Winners still only become public once you publish them from Rankings."
            />
          </fieldset>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-navy-deep px-6 py-3 text-sm font-medium uppercase tracking-wide text-gold transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
            {saved && <span className="text-sm text-emerald-700">Saved.</span>}
          </div>
        </form>
      )}

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.25rem;
          border: 1px solid rgba(15, 23, 42, 0.2);
          background: white;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #0f172a;
        }
        .input:focus {
          outline: none;
          border-color: #c9a227;
        }
      `}</style>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wide text-navy-deep/60">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-navy-deep/40">{hint}</span>}
    </label>
  );
}

function DateTimeField({
  label,
  date,
  time,
  onDateChange,
  onTimeChange,
  hint,
}: {
  label: string;
  date: string;
  time: string;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <span className="mb-1 block text-xs uppercase tracking-wide text-navy-deep/60">{label} (IST)</span>
      <div className="flex gap-3">
        <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} className="input" />
        <input type="time" value={time} onChange={(e) => onTimeChange(e.target.value)} className="input" />
      </div>
      {hint && <span className="mt-1 block text-xs text-navy-deep/40">{hint}</span>}
    </div>
  );
}
