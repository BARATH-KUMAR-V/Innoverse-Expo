import { NextRequest, NextResponse } from "next/server";
import { handleRoute, requireAdmin } from "@/lib/api-handler";
import { updateEventSettings, toPublicEventSettings, EventSettingsUpdate } from "@/lib/services/eventSettings";
import { HttpError } from "@/lib/http-error";

function optionalIsoTimestamp(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string" || Number.isNaN(new Date(value).getTime())) {
    throw new HttpError(400, "validation_error", `${field} must be a valid date/time or null.`);
  }
  return new Date(value).toISOString();
}

export const PUT = handleRoute(async (req: NextRequest) => {
  await requireAdmin(req);
  const body = await req.json().catch(() => ({}));

  const update: EventSettingsUpdate = {};

  if (body?.expoName !== undefined) {
    const expoName = typeof body.expoName === "string" ? body.expoName.trim() : "";
    if (!expoName) {
      throw new HttpError(400, "validation_error", "Expo name cannot be empty.");
    }
    update.expoName = expoName;
  }
  if (body?.expoDate !== undefined) {
    update.expoDate = typeof body.expoDate === "string" && body.expoDate.trim() ? body.expoDate.trim() : null;
  }
  if (body?.expoVenue !== undefined) {
    update.expoVenue = typeof body.expoVenue === "string" && body.expoVenue.trim() ? body.expoVenue.trim() : null;
  }

  update.votingStartsAt = optionalIsoTimestamp(body?.votingStartsAt, "votingStartsAt");
  update.votingEndsAt = optionalIsoTimestamp(body?.votingEndsAt, "votingEndsAt");
  update.winnersAnnounceAt = optionalIsoTimestamp(body?.winnersAnnounceAt, "winnersAnnounceAt");

  const updated = await updateEventSettings(update);
  return NextResponse.json(toPublicEventSettings(updated));
});
