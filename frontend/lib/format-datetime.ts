const TIME_ZONE = "Asia/Kolkata";

/** Formats an ISO timestamp for display, always in the event's official timezone regardless of the viewer's own. */
export function formatEventDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/** Splits an ISO timestamp into `<input type="date">` / `<input type="time">` values, in Asia/Kolkata, for admin edit forms. */
export function isoToDateAndTimeInputs(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { date: "", time: "" };

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

/** Combines `<input type="date">` + `<input type="time">` values (entered in Asia/Kolkata) back into a UTC ISO instant. */
export function dateAndTimeInputsToIso(date: string, time: string): string | null {
  if (!date || !time) return null;
  // The IST offset is fixed (no DST), so appending it directly gives the
  // correct UTC instant without needing a timezone-aware date library.
  const withOffset = `${date}T${time}:00+05:30`;
  const parsed = new Date(withOffset);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}
