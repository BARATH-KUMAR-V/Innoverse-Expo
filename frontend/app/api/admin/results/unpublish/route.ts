import { NextRequest, NextResponse } from "next/server";
import { handleRoute, requireAdmin } from "@/lib/api-handler";
import { setWinnersPublished } from "@/lib/services/votingConfig";

export const POST = handleRoute(async (req: NextRequest) => {
  await requireAdmin(req);
  const config = await setWinnersPublished(false);
  return NextResponse.json({ winnersPublished: config.winners_published });
});
