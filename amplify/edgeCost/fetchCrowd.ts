import axios from "axios";
import { pool } from "./db";

export type PedestrianCountRecord = {
  location_id: number;
  sensing_datetime: string;
  total_of_directions: number;
};

export type PedestrianLocation = {
  location_id: number;
  latitude: number;
  longitude: number;
};

export type PedestrianSensorRow = {
  location_id: number;
  lat: number;
  lon: number;
  current_count: number | null;
  observation_time: string | null;
};

export async function fetchPedSensorLocations(): Promise<
  Map<number, PedestrianLocation>
> {
  const url =
    "https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/pedestrian-counting-system-sensor-locations/records";

  const locationMap = new Map<number, PedestrianLocation>();
  const limit = 100;
  let offset = 0;

  while (true) {
    const response = await axios.get(url, {
      params: { limit, offset },
      headers: { "User-Agent": "hush-nav-backend/1.0" },
    });

    const rows: PedestrianLocation[] = response.data.results ?? [];

    for (const loc of rows) {
      if (
        typeof loc.location_id === "number" &&
        typeof loc.latitude === "number" &&
        typeof loc.longitude === "number"
      ) {
        locationMap.set(loc.location_id, loc);
      }
    }

    console.log(
      `Fetched ${rows.length} pedestrian sensor locations at offset ${offset}.`
    );

    if (rows.length < limit) {
      break;
    }

    offset += limit;
  }

  console.log(`Total pedestrian sensor locations loaded: ${locationMap.size}`);
  return locationMap;
}

export async function fetchLatestPedCountForLocation(
  locationId: number
): Promise<PedestrianCountRecord | null> {
  const url =
    "https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/pedestrian-counting-system-past-hour-counts-per-minute/records";

  const response = await axios.get(url, {
    params: {
      where: `location_id=${locationId}`,
      order_by: "sensing_datetime desc",
      limit: 1,
    },
    headers: { "User-Agent": "hush-nav-backend/1.0" },
  });

  const results: PedestrianCountRecord[] = response.data.results ?? [];
  if (results.length === 0) {
    return null;
  }

  return results[0];
}

export async function fetchPedestrianDataFull(): Promise<
  Array<PedestrianCountRecord & PedestrianLocation>
> {
  const locations = await fetchPedSensorLocations();
  const locationIds = Array.from(locations.keys());

  const records: Array<PedestrianCountRecord & PedestrianLocation> = [];

  for (const locationId of locationIds) {
    const latestCount = await fetchLatestPedCountForLocation(locationId);
    const geo = locations.get(locationId);

    if (!latestCount || !geo) {
      console.log(`No usable crowd record found for location ${locationId}`);
      continue;
    }

    records.push({
      ...latestCount,
      ...geo,
    });

    console.log(
      `Using latest available crowd for location ${locationId}: count=${latestCount.total_of_directions}, time=${latestCount.sensing_datetime}`
    );
  }

  console.log(
    `Final full-refresh pedestrian records prepared: ${records.length}/${locationIds.length}`
  );

  return records;
}

export async function fetchPedestrianDataIncremental(): Promise<
  Array<PedestrianCountRecord & PedestrianLocation>
> {
  const locations = await fetchPedSensorLocations();

  const url =
    "https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/pedestrian-counting-system-past-hour-counts-per-minute/records";

  const response = await axios.get(url, {
    params: {
      order_by: "sensing_datetime desc",
      limit: 100,
    },
    headers: { "User-Agent": "hush-nav-backend/1.0" },
  });

  const rows: PedestrianCountRecord[] = response.data.results ?? [];
  const latestByLocation = new Map<number, PedestrianCountRecord>();

  for (const row of rows) {
    if (
      typeof row.location_id === "number" &&
      typeof row.total_of_directions === "number" &&
      !latestByLocation.has(row.location_id) &&
      locations.has(row.location_id)
    ) {
      latestByLocation.set(row.location_id, row);
    }
  }

  const records: Array<PedestrianCountRecord & PedestrianLocation> = [];

  for (const [locationId, latestCount] of latestByLocation.entries()) {
    const geo = locations.get(locationId);
    if (!geo) continue;

    records.push({
      ...latestCount,
      ...geo,
    });
  }

  console.log(
    `Final incremental pedestrian records prepared: ${records.length}`
  );

  return records;
}

export async function upsertPedestrianSensors(
  records: Array<PedestrianCountRecord & PedestrianLocation>
) {
  const client = await pool.connect();

  try {
    let upsertedCount = 0;

    for (const record of records) {
      if (
        typeof record.location_id !== "number" ||
        typeof record.latitude !== "number" ||
        typeof record.longitude !== "number" ||
        typeof record.total_of_directions !== "number"
      ) {
        continue;
      }

      await client.query(
        `
        INSERT INTO pedestrian_sensor (
          location_id,
          geom_sensor,
          current_count,
          observation_time
        )
        VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5)
        ON CONFLICT (location_id)
        DO UPDATE SET
          geom_sensor = EXCLUDED.geom_sensor,
          current_count = EXCLUDED.current_count,
          observation_time = EXCLUDED.observation_time
        `,
        [
          record.location_id,
          record.longitude,
          record.latitude,
          record.total_of_directions,
          record.sensing_datetime,
        ]
      );

      upsertedCount++;
    }

    console.log(`Upserted ${upsertedCount} pedestrian sensors.`);
  } finally {
    client.release();
  }
}