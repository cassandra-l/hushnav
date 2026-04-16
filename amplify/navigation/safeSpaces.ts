import { pool } from "./db";
import type { LineString } from "geojson";

// Safe space returned to the frontend
export type SafeSpace = {
  id: number;
  name: string;
  subTheme: string;
  type: "park" | "library" | "museum" | "church" | "synagogue" | "quiet-space";
  description: string;
  lat: number;
  lng: number;
};

type SafeSpaceRow = {
  id: number;
  feature_name: string;
  sub_theme: string;
  lat: number;
  lng: number;
};

// Converts backend dataset themes into frontend-friendly safe space types
function mapSubThemeToType(
  subTheme: string
): "park" | "library" | "museum" | "church" | "synagogue" | "quiet-space" {
  if (subTheme === "Library") return "library";
  if (subTheme === "Informal Outdoor Facility (Park/Garden/Reserve)") return "park";
  if (subTheme === "Art Gallery/Museum") return "museum";
  if (subTheme === "Church") return "church";
  if (subTheme === "Synagogue") return "synagogue";
  return "quiet-space";
}

// Creates a short description for the popup/list if the dataset does not provide one
function buildDescription(subTheme: string): string {
  if (subTheme === "Library") {
    return "A quiet indoor space along your route.";
  }

  if (subTheme === "Informal Outdoor Facility (Park/Garden/Reserve)") {
    return "A calm outdoor space along your route.";
  }

  if (subTheme === "Art Gallery/Museum") {
    return "A quieter cultural space along your route.";
  }

  if (subTheme === "Church") {
    return "A peaceful indoor space along your route.";
  }

  if (subTheme === "Synagogue") {
    return "A peaceful indoor space along your route.";
  }

  return "A quiet space along your route.";
}

// Finds safe spaces close to the route line.
// bufferMeters controls how close a place must be to the route to be included.
export async function getSafeSpacesNearRoute(
  routeGeoJson: LineString,
  bufferMeters = 80
): Promise<SafeSpace[]> {
  const client = await pool.connect();

  try {
    const routeGeoJsonString = JSON.stringify(routeGeoJson);

    const result = await client.query<SafeSpaceRow>(
      `
      WITH route_geom AS (
        SELECT ST_SetSRID(ST_GeomFromGeoJSON($1), 4326) AS geom
      )
      SELECT
        ss.id,
        ss.feature_name,
        ss.sub_theme,
        ST_Y(ss.geom_safe_space) AS lat,
        ST_X(ss.geom_safe_space) AS lng
      FROM safe_space ss, route_geom rg
      WHERE ST_DWithin(
        ss.geom_safe_space::geography,
        rg.geom::geography,
        $2
      )
      ORDER BY
        ST_Distance(
          ss.geom_safe_space::geography,
          rg.geom::geography
        ) ASC,
        ss.feature_name ASC
      LIMIT 20
      `,
      [routeGeoJsonString, bufferMeters]
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.feature_name,
      subTheme: row.sub_theme,
      type: mapSubThemeToType(row.sub_theme),
      description: buildDescription(row.sub_theme),
      lat: Number(row.lat),
      lng: Number(row.lng),
    }));
  } finally {
    client.release();
  }
}