import { pool } from "./db";
import type { LineString } from "geojson";

import { filterSafeSpacesByTypes } from "./safeSpaceUtils";

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

export type SafeSpaceType = SafeSpace["type"];

// Raw database row shape returned by Postgres
type SafeSpaceRow = {
  safe_space_id: number;
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

// Builds a short description for each safe space
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

// Finds safe spaces close to the planned route line
export async function getSafeSpacesNearRoute(
  routeGeoJson: LineString,
  safeSpaceTypes?: SafeSpaceType[],

  // 100m was too strict for some routes after snapping to the road network.
  // 250m is better for walking routes because it still feels "near the route"
  // while giving Emily useful nearby safe spaces.
  bufferMeters = 250,
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
        ss.safe_space_id,
        ss.feature_name,
        ss.sub_theme,
        ST_Y(ss.geom_safe_space) AS lat,
        ST_X(ss.geom_safe_space) AS lng
      FROM safe_space ss
      CROSS JOIN route_geom rg
      WHERE ss.geom_safe_space IS NOT NULL
        AND ss.feature_name IS NOT NULL
        AND ss.sub_theme IS NOT NULL
        AND ST_DWithin(
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

    console.log(
      `Found ${result.rows.length} safe spaces within ${bufferMeters}m of route.`,
    );

    const safeSpaces = result.rows.map((row) => ({
      id: Number(row.safe_space_id),
      name: row.feature_name,
      subTheme: row.sub_theme,
      type: mapSubThemeToType(row.sub_theme),
      description: buildDescription(row.sub_theme),
      lat: Number(row.lat),
      lng: Number(row.lng),
    }));

    return filterSafeSpacesByTypes(safeSpaces, safeSpaceTypes);
    
  } finally {
    client.release();
  }
}

export async function getSafeSpaceById(id: number): Promise<SafeSpace | null> {
  const client = await pool.connect();

  try {
    const result = await client.query<SafeSpaceRow>(
      `
      SELECT
        ss.safe_space_id,
        ss.feature_name,
        ss.sub_theme,
        ST_Y(ss.geom_safe_space) AS lat,
        ST_X(ss.geom_safe_space) AS lng
      FROM safe_space ss
      WHERE ss.safe_space_id = $1
        AND ss.geom_safe_space IS NOT NULL
        AND ss.feature_name IS NOT NULL
        AND ss.sub_theme IS NOT NULL
      LIMIT 1
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      id: Number(row.safe_space_id),
      name: row.feature_name,
      subTheme: row.sub_theme,
      type: mapSubThemeToType(row.sub_theme),
      description: buildDescription(row.sub_theme),
      lat: Number(row.lat),
      lng: Number(row.lng),
    };
  } finally {
    client.release();
  }
}

// Returns all safe spaces so markers can always be shown on the map
export async function getAllSafeSpaces(): Promise<SafeSpace[]> {
  const client = await pool.connect();

  try {
    const result = await client.query<SafeSpaceRow>(
      `
      SELECT
        ss.safe_space_id,
        ss.feature_name,
        ss.sub_theme,
        ST_Y(ss.geom_safe_space) AS lat,
        ST_X(ss.geom_safe_space) AS lng
      FROM safe_space ss
      WHERE ss.geom_safe_space IS NOT NULL
        AND ss.feature_name IS NOT NULL
        AND ss.sub_theme IS NOT NULL
      ORDER BY ss.feature_name ASC
      `,
    );

    console.log(`Loaded ${result.rows.length} total safe spaces.`);

    return result.rows.map((row) => ({
      id: Number(row.safe_space_id),
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