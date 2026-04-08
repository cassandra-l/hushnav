import { pool } from "./db";
import type { LineString, MultiLineString } from "geojson";

export type NoiseMapFeature = {
  type: "Feature";
  properties: {
    edgeId: number;
    noiseDb: number | null;
    isHighNoise: boolean;
    noiseCategory: "high" | "non-high";
  };
  geometry: LineString | MultiLineString;
};

export type NoiseMapFeatureCollection = {
  type: "FeatureCollection";
  features: NoiseMapFeature[];
};

export async function getNoiseMapData(): Promise<NoiseMapFeatureCollection> {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `
      SELECT
        e.edge_id,
        ew.noise_db,
        ew.is_high_noise,
        ST_AsGeoJSON(e.geom_edge) AS geojson
      FROM edge e
      LEFT JOIN edge_weight ew
        ON e.edge_id = ew.edge_id
      `
    );

    const features: NoiseMapFeature[] = result.rows
      .filter((row) => row.geojson)
      .map((row) => ({
        type: "Feature",
        properties: {
          edgeId: row.edge_id,
          noiseDb: row.noise_db,
          isHighNoise: row.is_high_noise ?? false,
          noiseCategory: row.is_high_noise ? "high" : "non-high",
        },
        geometry: JSON.parse(row.geojson),
      }));

    return {
      type: "FeatureCollection",
      features,
    };
  } finally {
    client.release();
  }
}