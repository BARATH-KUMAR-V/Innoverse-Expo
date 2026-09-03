import { NextRequest, NextResponse } from "next/server";
import { handleRoute, requireAdmin } from "@/lib/api-handler";
import { deleteAllVotes } from "@/lib/services/votes";

export const DELETE = handleRoute(async (req: NextRequest) => {
  await requireAdmin(req);
  const deleted = await deleteAllVotes();
  return NextResponse.json({ deleted });
});
