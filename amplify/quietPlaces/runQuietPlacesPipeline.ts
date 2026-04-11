import { pool } from "./db";
import { fetchQuietPlaces, replaceQuietPlaces } from "./fetchQuietPlaces";

async function main() {
  try {
    const quietPlaces = await fetchQuietPlaces();
    console.log(`Fetched ${quietPlaces.length} quiet places from API.`);

    await replaceQuietPlaces(quietPlaces);

    console.log("Quiet places refresh complete.");
  } catch (error) {
    console.error("Failed to refresh quiet places:", error);
  } finally {
    await pool.end();
  }
}

main();