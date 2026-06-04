import { pool } from "./db.js";
import type { LineString, MultiLineString } from "geojson";

// A row returned from the crowd map query
type CrowdMapRow = {
  crowd_count: number | null;
  geojson: string | null;
};

// A GeoJSON returned to the frontend
export type CrowdMapFeature = {
  type: "Feature";
  properties: {
    crowdCount: number | null;
    isHighCrowd: boolean;
    crowdCategory: "high";
  };
  geometry: LineString | MultiLineString;
};

// Standard GeoJSON FeatureCollection for all highlighted crowd edges
export type CrowdMapFeatureCollection = {
  type: "FeatureCollection";
  features: CrowdMapFeature[];
};

// Get all edges which are classified as high crowd and convert them into GeoJSON FeatureCollection
export async function getCrowdMapData(): Promise<CrowdMapFeatureCollection> {
  const client = await pool.connect();

  try {
    const result = await client.query<CrowdMapRow>(
      `
      SELECT
        ew.crowd_count,
        ST_AsGeoJSON(e.geom_edge) AS geojson
      FROM edge e
      JOIN edge_weight ew
        ON e.edge_id = ew.edge_id
      WHERE ew.is_high_crowd = true
      `
    );

    const features: CrowdMapFeature[] = result.rows
      .filter((row) => row.geojson)
      .map((row) => ({
        type: "Feature",
        properties: {
          crowdCount: row.crowd_count,
          isHighCrowd: true,
          crowdCategory: "high",
        },
        geometry: JSON.parse(row.geojson as string) as
          | LineString
          | MultiLineString,
      }));

    return {
      type: "FeatureCollection",
      features,
    };
  } finally {
    client.release();
  }
}