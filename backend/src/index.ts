import app from "./app";
import { env } from "./config/env";
import { checkDatabaseConnection } from "./db/pool";
import { startAutoCloseJob } from "./jobs/autoClose";

async function main() {
  try {
    await checkDatabaseConnection();
    console.log("Connected to PostgreSQL.");
  } catch (err) {
    console.error("Could not connect to PostgreSQL. Check DATABASE_URL in your .env file.", err);
    process.exit(1);
  }

  startAutoCloseJob();

  app.listen(env.port, () => {
    console.log(`INNOVERSE backend listening on port ${env.port} (${env.nodeEnv})`);
  });
}

main();
