import { pool } from "./db";

export type NoiseReport = {
  id: number;
  lat: number;
  lng: number;
  noiseLevel: number | null;
  createdAt: string;
};

type NoiseReportRow = {
  report_id: number;
  lat: number;
  lng: number;
  noise_level: number | null;
  created_at: string;
};

export type GetNoiseReportsInput = {
  lat?: number;
  lng?: number;
  radiusMeters?: number;
};

function toNoiseReport(row: NoiseReportRow): NoiseReport {
  return {
    id: row.report_id,
    lat: Number(row.lat),
    lng: Number(row.lng),
    noiseLevel: row.noise_level === null ? null : Number(row.noise_level),
    createdAt: row.created_at,
  };
}

export async function createNoiseReport(input: {
  lat: number;
  lng: number;
  noiseLevel?: number | null;
}): Promise<NoiseReport> {
  const result = await pool.query<NoiseReportRow>(
    `
    INSERT INTO noise_report (lat, lng, noise_level)
    VALUES ($1, $2, $3)
    RETURNING report_id, lat, lng, noise_level, created_at
    `,
    [input.lat, input.lng, input.noiseLevel ?? null],
  );

  return toNoiseReport(result.rows[0]);
}

export async function getNoiseReports(
  input: GetNoiseReportsInput = {},
): Promise<NoiseReport[]> {
  const hasNearbyFilter =
    typeof input.lat === "number" && typeof input.lng === "number";
  const radiusMeters = input.radiusMeters ?? 1000;

  const result = hasNearbyFilter
    ? await pool.query<NoiseReportRow>(
      `
      SELECT report_id, lat, lng, noise_level, created_at
      FROM noise_report
      WHERE created_at >= NOW() - INTERVAL '30 minutes'
        AND ST_DWithin(
          geom::geography,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
          $3
        )
      ORDER BY created_at DESC
      LIMIT 500
      `,
      [input.lat, input.lng, radiusMeters],
    )
    : await pool.query<NoiseReportRow>(
      `
      SELECT report_id, lat, lng, noise_level, created_at
      FROM noise_report
      WHERE created_at >= NOW() - INTERVAL '30 minutes'
      ORDER BY created_at DESC
      LIMIT 500
      `,
    );

  return result.rows.map(toNoiseReport);
}
