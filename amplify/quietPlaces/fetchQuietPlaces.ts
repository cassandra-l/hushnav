import axios from "axios";
import { pool } from "./db";

const DATASET_URL =
  "https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/landmarks-and-places-of-interest-including-schools-theatres-health-services-spor/records";

const TARGET_SUB_THEMES = [
  "Library",
  "Art Gallery/Museum",
  "Church",
  "Synagogue",
  "Informal Outdoor Facility (Park/Garden/Reserve)",
];

export type QuietPlaceRecord = {
  sub_theme: string;
  feature_name: string;
  co_ordinates: {
    lon: number;
    lat: number;
  };
};

export async function fetchQuietPlaces(): Promise<QuietPlaceRecord[]> {
  const limit = 250;
  let offset = 0;
  const results: QuietPlaceRecord[] = [];

  const whereClause = TARGET_SUB_THEMES.map(
    (theme) => `sub_theme="${theme}"`
  ).join(" OR ");

  while (true) {
    const response = await axios.get(DATASET_URL, {
      params: {
        select: "sub_theme, feature_name, co_ordinates",
        where: whereClause,
        order_by: "sub_theme asc, feature_name asc",
        limit,
        offset,
      },
      headers: {
        "User-Agent": "hush-nav-backend/1.0",
      },
    });

    const rows = response.data?.results ?? [];

    for (const row of rows) {
      if (
        typeof row.sub_theme !== "string" ||
        typeof row.feature_name !== "string" ||
        !row.co_ordinates ||
        typeof row.co_ordinates.lat !== "number" ||
        typeof row.co_ordinates.lon !== "number"
      ) {
        continue;
      }

      results.push({
        sub_theme: row.sub_theme,
        feature_name: row.feature_name.trim(),
        co_ordinates: {
          lat: row.co_ordinates.lat,
          lon: row.co_ordinates.lon,
        },
      });
    }

    console.log(`Fetched ${rows.length} quiet place rows at offset ${offset}.`);

    if (rows.length < limit) {
      break;
    }

    offset += limit;
  }

  console.log(`Total quiet places prepared: ${results.length}`);
  return results;
}

export async function replaceQuietPlaces(
  records: QuietPlaceRecord[]
): Promise<void> {
  if (records.length === 0) {
    throw new Error("No quiet places fetched.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query("TRUNCATE TABLE safe_space RESTART IDENTITY");

    for (const record of records) {
      if (
        !record.feature_name ||
        typeof record.co_ordinates.lat !== "number" ||
        typeof record.co_ordinates.lon !== "number"
      ) {
        continue;
      }

      await client.query(
        `
        INSERT INTO safe_space (
          geom_safe_space,
          sub_theme,
          feature_name
        )
        VALUES (
          ST_SetSRID(ST_MakePoint($1, $2), 4326),
          $3,
          $4
        )
        `,
        [
          record.co_ordinates.lon,
          record.co_ordinates.lat,
          record.sub_theme,
          record.feature_name,
        ]
      );
    }

    await client.query("COMMIT");
    console.log("safe_space table updated successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}