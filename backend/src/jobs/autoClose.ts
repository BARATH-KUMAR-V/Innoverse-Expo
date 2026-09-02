import cron from "node-cron";
import { env } from "../config/env";
import { getVotingConfig, setVotingOpen } from "../services/votingConfig.service";

/**
 * Optional safety net: if VOTING_AUTO_CLOSE_AT is set, check once a minute
 * and automatically close voting once that instant has passed. This never
 * re-opens voting - only the admin's "Start Voting" button does that - and it
 * is a supplement to, not a replacement for, the admin's manual "Stop Voting"
 * control. Uses a fixed ISO-8601 instant (with the +05:30 IST offset baked
 * in) rather than any browser or server-local timezone.
 */
export function startAutoCloseJob(): void {
  if (!env.votingAutoCloseAt) {
    console.log("VOTING_AUTO_CLOSE_AT not set - relying solely on manual admin start/stop control.");
    return;
  }

  const closeAt = new Date(env.votingAutoCloseAt);
  if (Number.isNaN(closeAt.getTime())) {
    console.warn(`VOTING_AUTO_CLOSE_AT="${env.votingAutoCloseAt}" is not a valid date - automatic close-off disabled.`);
    return;
  }

  console.log(`Automatic voting close-off scheduled for ${closeAt.toISOString()} (in addition to manual control).`);

  cron.schedule("* * * * *", async () => {
    try {
      if (Date.now() < closeAt.getTime()) return;
      const config = await getVotingConfig();
      if (config.voting_open) {
        await setVotingOpen(false);
        console.log(`Voting automatically closed at ${new Date().toISOString()} (reached VOTING_AUTO_CLOSE_AT).`);
      }
    } catch (err) {
      console.error("Auto-close job error:", err);
    }
  });
}
