import axios from "axios";
import { pool } from "./db.js";

export type MicroclimateRecord = {
  device_id: string;
  received_at: string;
  latlong?: {
    lat: number;
    lon: number;
  };
  noise?: number;
};

export type SensorRow = {
  device_id: string;
  lat: number;
  lon: number;
  current_db: number | null;
  last_updated: string | null;
};

export async function fetchAllNoiseDeviceIds(): Promise<string[]> {
  const baseUrl =
    "https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/microclimate-sensors-data/records";

  const response = await axios.get(baseUrl, {
    params: {
      select: "device_id, count(*) as rows_with_noise",
      where: "noise is not null",
      group_by: "device_id",
      limit: 100,
    },
    headers: {
      "User-Agent": "hush-nav-backend/1.0",
    },
  });

  const results = response.data.results ?? [];
  return results
    .map((row: { device_id?: string }) => row.device_id)
    .filter((deviceId: string | undefined): deviceId is string => !!deviceId);
}

export async function fetchLatestNoiseRecordForDevice(
  deviceId: string
): Promise<MicroclimateRecord | null> {
  const baseUrl =
    "https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/microclimate-sensors-data/records";

  const response = await axios.get(baseUrl, {
    params: {
      where: `device_id="${deviceId}" AND noise is not null`,
      order_by: "received_at desc",
      limit: 1,
    },
    headers: {
      "User-Agent": "hush-nav-backend/1.0",
    },
  });

  const results: MicroclimateRecord[] = response.data.results ?? [];
  if (results.length === 0) {
    return null;
  }

  return results[0];
}

export async function fetchMicroclimateData(): Promise<MicroclimateRecord[]> {
  const deviceIds = await fetchAllNoiseDeviceIds();
  console.log(`Found ${deviceIds.length} devices with non-null noise.`);

  const records: MicroclimateRecord[] = [];

  for (const deviceId of deviceIds) {
    const record = await fetchLatestNoiseRecordForDevice(deviceId);

    if (
      record &&
      record.latlong &&
      typeof record.latlong.lat === "number" &&
      typeof record.latlong.lon === "number" &&
      typeof record.noise === "number"
    ) {
      records.push(record);
      console.log(
        `Using latest valid noise for ${deviceId}: noise=${record.noise}, time=${record.received_at}`
      );
    } else {
      console.log(`No valid latest noise record found for ${deviceId}`);
    }
  }

  return records;
}

export async function upsertNoiseSensors(records: MicroclimateRecord[]) {
  const client = await pool.connect();

  try {
    let upsertedCount = 0;

    for (const record of records) {
      if (
        !record.device_id ||
        !record.latlong ||
        typeof record.latlong.lat !== "number" ||
        typeof record.latlong.lon !== "number" ||
        typeof record.noise !== "number"
      ) {
        continue;
      }

      await client.query(
        `
        INSERT INTO noise_sensor (
          device_id,
          geom_sensor,
          current_db,
          last_updated
        )
        VALUES (
          $1,
          ST_SetSRID(ST_MakePoint($2, $3), 4326),
          $4,
          $5
        )
        ON CONFLICT (device_id)
        DO UPDATE SET
          geom_sensor = EXCLUDED.geom_sensor,
          current_db = EXCLUDED.current_db,
          last_updated = EXCLUDED.last_updated
        `,
        [
          record.device_id,
          record.latlong.lon,
          record.latlong.lat,
          record.noise,
          record.received_at,
        ]
      );

      upsertedCount++;
    }

    console.log(
      `Upserted ${upsertedCount} latest valid sensor records into noise_sensor.`
    );
  } finally {
    client.release();
  }
}