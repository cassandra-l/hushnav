import { pool } from "../db.js";
import { runQuietPlacesPipeline } from "../quietPlaces/runQuietPlacesPipeline.js";

async function main(): Promise<void> {
  const result = await pool.query<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM safe_space",
  );
  const count = result.rows[0]?.count ?? 0;

  if (count > 0) {
    console.log(`Safe spaces already populated (${count} rows), skipping import.`);
    return;
  }

  await runQuietPlacesPipeline();
}

main()
  .catch((error) => {
    console.error("Failed to import quiet places:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
