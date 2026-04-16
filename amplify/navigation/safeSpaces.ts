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

// Raw database row shape returned by Postgres
type SafeSpaceRow = {
  id: number;
  feature_name: string;
  sub_theme: string;
  lat: number;
  lng: number;
};

// Maps dataset sub themes into frontend-friendly safe space types
function mapSubThemeToType(
  subTheme: string,
): "park" | "library" | "museum" | "church" | "synagogue" | "quiet-space" {
  switch (subTheme) {
    case "Library":
      return "library";
    case "Informal Outdoor Facility (Park/Garden/Reserve)":
      return "park";
    case "Art Gallery/Museum":
      return "museum";
    case "Church":
      return "church";
    case "Synagogue":
      return "synagogue";
    default:
      return "quiet-space";
  }
}

// Builds a short description for each safe space.
// The source dataset does not provide a user-friendly description field,
// so we generate one from the place category.
function buildDescription(subTheme: string): string {
  switch (subTheme) {
    case "Library":
      return "A quiet indoor space along your route.";
    case "Informal Outdoor Facility (Park/Garden/Reserve)":
      return "A calm outdoor space along your route.";
    case "Art Gallery/Museum":
      return "A quieter cultural space along your route.";
    case "Church":
      return "A peaceful indoor space along your route.";
    case "Synagogue":
      return "A peaceful indoor space along your route.";
    default:
      return "A quiet space along your route.";
  }
}

// Finds safe spaces close to the planned route line.
// bufferMeters controls how far from the route a place can be and still appear.
export async function getSafeSpacesNearRoute(
  routeGeoJson: LineString,
  bufferMeters = 80,
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
      [routeGeoJsonString, bufferMeters],
    );

    return result.rows.map((row) => ({
      id: Number(row.id),
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