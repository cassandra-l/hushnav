import { pool } from "./db";
import type { LineString, MultiLineString } from "geojson";

type NoiseMapRow = {
  geojson: string | null;
};

export type NoiseMapFeature = {
  type: "Feature";
  properties: {
    noiseCategory: "high";
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
    const result = await client.query<NoiseMapRow>(
      `
      SELECT
        ST_AsGeoJSON(e.geom_edge) AS geojson
      FROM edge e
      JOIN edge_weight ew
        ON e.edge_id = ew.edge_id
      WHERE ew.is_high_noise = true
      `
    );

    const features: NoiseMapFeature[] = result.rows
      .filter((row) => row.geojson)
      .map((row) => ({
        type: "Feature",
        properties: {
          noiseCategory: "high",
        },
        geometry: JSON.parse(row.geojson as string) as LineString | MultiLineString,
      }));

    return {
      type: "FeatureCollection",
      features,
    };
  } finally {
    client.release();
  }
}