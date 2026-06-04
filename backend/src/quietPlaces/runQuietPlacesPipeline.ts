import { pool } from "../db.js";
import { fetchQuietPlaces, replaceQuietPlaces } from "./fetchQuietPlaces.js";

export async function runQuietPlacesPipeline(): Promise<void> {
  const quietPlaces = await fetchQuietPlaces();
  console.log(`Fetched ${quietPlaces.length} quiet places from API.`);

  await replaceQuietPlaces(quietPlaces);

  console.log("Quiet places refresh complete.");
}

export async function runQuietPlacesPipelineStandalone(): Promise<void> {
  try {
    await runQuietPlacesPipeline();
  } catch (error) {
    console.error("Failed to refresh quiet places:", error);
  } finally {
    await pool.end();
  }
}
