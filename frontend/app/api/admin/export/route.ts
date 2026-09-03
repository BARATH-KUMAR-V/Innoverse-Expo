import { NextRequest, NextResponse } from "next/server";
import { handleRoute, requireAdmin } from "@/lib/api-handler";
import { rankingsWithVotes } from "@/lib/services/votes";
import { buildRankingsCsv } from "@/lib/csv";

export const GET = handleRoute(async (req: NextRequest) => {
  await requireAdmin(req);
  const rankings = await rankingsWithVotes();
  const total = rankings.reduce((sum, r) => sum + r.votes, 0);
  const csv = buildRankingsCsv(
    rankings.map((r) => ({
      teamName: r.teamName,
      votes: r.votes,
      percentage: total > 0 ? (r.votes / total) * 100 : 0,
    }))
  );
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="votes.csv"',
    },
  });
});
