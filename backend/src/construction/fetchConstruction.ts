import axios from "axios";
import { pool } from "../edgeCost/db";

const BASE_URL =
  "https://api.opendata.transport.vic.gov.au/opendata/roads/disruptions/planned/v1/";

const API_KEY = process.env.TRANSPORT_VIC_API_KEY;

if (!API_KEY) {
  throw new Error("TRANSPORT_VIC_API_KEY is not set.");
}

// The API appears to return up to 500 records per page
const PAGE_LIMIT = 500;

// Distance threshold used to decide whether a construction event is relevant to our route network edges.
const EDGE_MATCH_BUFFER_METERS = 20;

const MAX_CONSECUTIVE_EMPTY_PAGES = 3;

// Generic GeoJSON geometry shape returned by the API.
type GeoJsonGeometry = {
  type: string;
  coordinates?: unknown;
  geometries?: GeoJsonGeometry[];
};

// Shape of one disruption feature from the API response.
type PlannedDisruptionFeature = {
  geometry?: GeoJsonGeometry;
  properties?: {
    id?: string;
    status?: string;
    duration?: {
      start?: string;
      end?: string;
    };
    lastUpdated?: string;
  };
};

type PlannedDisruptionsResponse = {
  features?: PlannedDisruptionFeature[];
};

// Internal record format used before inserting into the database.
export type ConstructionEventRecord = {
  source_id: string;
  geomGeoJson: string;
  is_active: boolean;
  start_time: string | null;
  end_time: string | null;
  last_updated: string | null;
};

// Result returned after fetching and preparing one page.
type FetchPageResult = {
  fetchedCount: number;
  records: ConstructionEventRecord[];
  reachedEnd: boolean;
};

function isActiveStatus(status?: string): boolean {
  return status === "Active";
}

// Converts the API geometry object into a GeoJSON string that PostGIS can read.
function geometryToGeoJsonString(
  geometry: GeoJsonGeometry | undefined
): string | null {
  if (!geometry) return null;

// Handle Point / LineString / Polygon / MultiLineString and other standard geometries.
  if (geometry.coordinates) {
    return JSON.stringify(geometry);
  }

  if (Array.isArray(geometry.geometries) && geometry.geometries.length > 0) {
    return JSON.stringify({
      type: "GeometryCollection",
      geometries: geometry.geometries,
    });
  }

  return null;
}

// Fetches one page of planned disruptions from the API, then keeps only active records with valid geometry.
async function fetchPlannedDisruptionsPage(page: number): Promise<FetchPageResult> {
  const apiResponse = await axios.get(BASE_URL, {
    params: {
      format: "GeoJson",
      page,
      limit: PAGE_LIMIT,
    },
    headers: {
      KeyID: API_KEY,
      "User-Agent": "hush-nav-backend/1.0",
    },
    timeout: 15000,
  });

  const data = apiResponse.data as PlannedDisruptionsResponse;
  const features = data.features ?? [];

  const records: ConstructionEventRecord[] = [];

  for (const feature of features) {
    const sourceId = feature.properties?.id;
    const geomGeoJson = geometryToGeoJsonString(feature.geometry);
    const active = isActiveStatus(feature.properties?.status);

    if (!sourceId || !geomGeoJson || !active) {
      continue;
    }

    records.push({
      source_id: sourceId,
      geomGeoJson,
      is_active: true,
      start_time: feature.properties?.duration?.start ?? null,
      end_time: feature.properties?.duration?.end ?? null,
      last_updated: feature.properties?.lastUpdated ?? null,
    });
  }

  return {
    fetchedCount: features.length,
    records,
    reachedEnd: features.length < PAGE_LIMIT,
  };
}

// Only disruptions that are spatially relevant to our route network are inserted.
export async function upsertConstructionEvents(
  records: ConstructionEventRecord[]
): Promise<number> {
  if (records.length === 0) {
    console.log("No construction records to process for this page.");
    return 0;
  }

  const client = await pool.connect();

  try {
    const payload = JSON.stringify(records);

    const result = await client.query(
      `
      WITH input_rows AS (
        SELECT *
        FROM jsonb_to_recordset($1::jsonb) AS x(
          source_id TEXT,
          "geomGeoJson" TEXT,
          is_active BOOLEAN,
          start_time TIMESTAMPTZ,
          end_time TIMESTAMPTZ,
          last_updated TIMESTAMPTZ
        )
      ),
      prepared AS (
        SELECT
          source_id,
          ST_SetSRID(ST_GeomFromGeoJSON("geomGeoJson"), 4326) AS geom,
          is_active,
          start_time,
          end_time,
          last_updated
        FROM input_rows
      ),
      route_area AS (
        SELECT ST_SetSRID(ST_Envelope(ST_Extent(geom_edge))::geometry, 4326) AS geom
        FROM edge
      ),
      coarse_filtered AS (
        SELECT p.*
        FROM prepared p
        CROSS JOIN route_area r
        WHERE
          ST_Intersects(p.geom, r.geom)
          OR ST_DWithin(
            p.geom::geography,
            r.geom::geography,
            200
          )
      ),
      relevant AS (
        SELECT DISTINCT
          p.source_id,
          p.geom,
          p.is_active,
          p.start_time,
          p.end_time,
          p.last_updated
        FROM coarse_filtered p
        JOIN edge e
          ON (
            e.geom_edge && ST_Expand(p.geom, 0.0003)
            AND (
              ST_Intersects(e.geom_edge, p.geom)
              OR ST_DWithin(
                e.geom_edge::geography,
                p.geom::geography,
                $2
              )
            )
          )
      )
      INSERT INTO construction_event (
        source_id,
        geom,
        is_active,
        start_time,
        end_time,
        last_updated
      )
      SELECT
        source_id,
        geom,
        is_active,
        start_time,
        end_time,
        last_updated
      FROM relevant
      ON CONFLICT (source_id)
      DO UPDATE SET
        geom = EXCLUDED.geom,
        is_active = EXCLUDED.is_active,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        last_updated = EXCLUDED.last_updated
      `,
      [payload, EDGE_MATCH_BUFFER_METERS]
    );

    return result.rowCount ?? 0;
  } finally {
    client.release();
  }
}

// It fetches one page at a time, deduplicates active records by source_id, upserts relevant records into the database, and stops when there is no new data.
export async function runConstructionIngestion(maxPages?: number): Promise<void> {
  let page = 1;
  let pagesProcessed = 0;
  let totalFetched = 0;
  let totalPrepared = 0;
  let totalAffected = 0;
  let consecutiveEmptyPages = 0;

  const seenSourceIds = new Set<string>();

  while (true) {
    if (maxPages !== undefined && page > maxPages) {
      console.log(`Stopped at maxPages=${maxPages}.`);
      break;
    }

    const { fetchedCount, records, reachedEnd } =
      await fetchPlannedDisruptionsPage(page);

    totalFetched += fetchedCount;

    const uniqueRecords = records.filter((record) => {
      if (seenSourceIds.has(record.source_id)) {
        return false;
      }
      seenSourceIds.add(record.source_id);
      return true;
    });

    totalPrepared += uniqueRecords.length;

    console.log(
      `Fetched ${fetchedCount} construction features from page ${page}. Active unique prepared this page: ${uniqueRecords.length}. Total prepared so far: ${totalPrepared}`
    );

    if (uniqueRecords.length === 0) {
      consecutiveEmptyPages += 1;
      console.log(
        `Page ${page} had no new active records after deduplication. Consecutive empty pages: ${consecutiveEmptyPages}`
      );
    } else {
      consecutiveEmptyPages = 0;

      console.log(
        `Starting batch construction upsert for page ${page} with ${uniqueRecords.length} records...`
      );

      const affectedRows = await upsertConstructionEvents(uniqueRecords);
      totalAffected += affectedRows;

      console.log(
        `Finished page ${page}. Affected rows this page: ${affectedRows}. Total affected so far: ${totalAffected}`
      );
    }

    pagesProcessed += 1;

    if (reachedEnd) {
      console.log(`Reached final page at page ${page}.`);
      break;
    }

    if (consecutiveEmptyPages >= MAX_CONSECUTIVE_EMPTY_PAGES) {
      console.log(
        `Stopping ingestion because ${MAX_CONSECUTIVE_EMPTY_PAGES} consecutive pages had no new active unique records.`
      );
      break;
    }

    page += 1;
  }

  console.log("Construction ingestion complete.");
  console.log(`Pages processed: ${pagesProcessed}`);
  console.log(`Total raw fetched features: ${totalFetched}`);
  console.log(`Total active unique prepared records: ${totalPrepared}`);
  console.log(`Total affected rows: ${totalAffected}`);
}

export async function refreshConstructionBlockedEdges(): Promise<number> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query("TRUNCATE construction_blocked_edge");

    const result = await client.query(
      `
      INSERT INTO construction_blocked_edge (edge_id, updated_at)
      SELECT DISTINCT
        e.edge_id,
        NOW()
      FROM edge e
      JOIN construction_event c
        ON (
          e.geom_edge && ST_Expand(c.geom, 0.0003)
          AND (
            ST_Intersects(e.geom_edge, c.geom)
            OR ST_DWithin(
              e.geom_edge::geography,
              c.geom::geography,
              $1
            )
          )
        )
      WHERE c.is_active = true
      ON CONFLICT (edge_id)
      DO UPDATE SET updated_at = NOW()
      `,
      [EDGE_MATCH_BUFFER_METERS],
    );

    await client.query("COMMIT");

    console.log(
      `Refreshed construction_blocked_edge. Blocked edges: ${
        result.rowCount ?? 0
      }`,
    );

    return result.rowCount ?? 0;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}