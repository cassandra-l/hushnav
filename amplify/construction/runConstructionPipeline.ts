import {
  refreshConstructionBlockedEdges,
  runConstructionIngestion,
} from "./fetchConstruction";
import { pool } from "../edgeCost/db";

export async function runConstructionPipeline(): Promise<{
  blockedEdges: number;
}> {
  console.log("Starting construction pipeline...");

  await runConstructionIngestion();

  const blockedEdges = await refreshConstructionBlockedEdges();

  console.log("Construction pipeline complete.");
  console.log(`Blocked edges refreshed: ${blockedEdges}`);

  return {
    blockedEdges,
  };
}

// Only run this block when executing this file directly from the terminal.
// This prevents the pipeline from running automatically when the Lambda imports this file.
if (import.meta.url === `file://${process.argv[1]}`) {
  runConstructionPipeline()
    .catch((error) => {
      console.error("Failed to run construction pipeline:", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await pool.end();
    });
}