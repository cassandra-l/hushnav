import { runConstructionIngestion } from "./fetchConstruction";
import { pool } from "../edgeCost/db";

async function main() {
  try {
    await runConstructionIngestion();
  } catch (error) {
    console.error("Failed to update construction events:", error);
  } finally {
    await pool.end();
  }
}

main();