import { pool } from "./db";
import type { SensorRow } from "./fetchNoise";
import type { PedestrianSensorRow } from "./fetchCrowd";

// A row from the node table
export type NodeRow = {
  node_id: number;
  lat: number;
  lon: number;
};

// A row from the edge table
type EdgeRow = {
  edge_id: number;
  u: number;
  v: number;
  length: number;
};

// Calculate the distance between two latitude/longitude points
function haversineDistanceMeters(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number
): number {
  const R = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

// Load all nodes from the db and stores them in a Map
async function loadNodes(): Promise<Map<number, NodeRow>> {
  const client = await pool.connect();

  try {
    const result = await client.query<NodeRow>(
      `
      SELECT node_id, lat, lon
      FROM node
      `
    );

    const nodeMap = new Map<number, NodeRow>();
    for (const row of result.rows) {
      nodeMap.set(row.node_id, row);
    }

    return nodeMap;
  } finally {
    client.release();
  }
}

// Load all road edges from the db
async function loadEdges(): Promise<EdgeRow[]> {
  const client = await pool.connect();

  try {
    const result = await client.query<EdgeRow>(
      `
      SELECT edge_id, u, v, length
      FROM edge
      `
    );

    return result.rows;
  } finally {
    client.release();
  }
}

// Load all usable noise sensor records that currently have a noise value
async function loadNoiseSensors(): Promise<SensorRow[]> {
  const client = await pool.connect();

  try {
    const result = await client.query<SensorRow>(
      `
      SELECT
        device_id,
        ST_Y(geom_sensor) AS lat,
        ST_X(geom_sensor) AS lon,
        current_db,
        last_updated
      FROM noise_sensor
      WHERE current_db IS NOT NULL
      `
    );

    return result.rows;
  } finally {
    client.release();
  }
}

// Load all usable pedestrian sensor records that currently have a crowd count
async function loadPedestrianSensors(): Promise<PedestrianSensorRow[]> {
  const client = await pool.connect();

  try {
    const result = await client.query<PedestrianSensorRow>(
      `
      SELECT
        location_id,
        ST_Y(geom_sensor) AS lat,
        ST_X(geom_sensor) AS lon,
        current_count,
        observation_time
      FROM pedestrian_sensor
      WHERE current_count IS NOT NULL
      `
    );

    return result.rows;
  } finally {
    client.release();
  }
}

// Find the nearest noise sensor to the midpoint of an edge
function findNearestNoiseSensor(
  edgeMidLat: number,
  edgeMidLon: number,
  sensors: SensorRow[]
): SensorRow | null {
  if (sensors.length === 0) return null;

  let bestSensor = sensors[0];
  let bestDistance = haversineDistanceMeters(
    edgeMidLat,
    edgeMidLon,
    bestSensor.lat,
    bestSensor.lon
  );

  for (const sensor of sensors) {
    const distance = haversineDistanceMeters(
      edgeMidLat,
      edgeMidLon,
      sensor.lat,
      sensor.lon
    );

    if (distance < bestDistance) {
      bestDistance = distance;
      bestSensor = sensor;
    }
  }

  return bestSensor;
}

// Find the nearest pedestrian sensor to the midpoint of an edge
function findNearestPedestrianSensor(
  edgeMidLat: number,
  edgeMidLon: number,
  sensors: PedestrianSensorRow[]
): PedestrianSensorRow | null {
  if (sensors.length === 0) return null;

  let bestSensor = sensors[0];
  let bestDistance = haversineDistanceMeters(
    edgeMidLat,
    edgeMidLon,
    bestSensor.lat,
    bestSensor.lon
  );

  for (const sensor of sensors) {
    const distance = haversineDistanceMeters(
      edgeMidLat,
      edgeMidLon,
      sensor.lat,
      sensor.lon
    );

    if (distance < bestDistance) {
      bestDistance = distance;
      bestSensor = sensor;
    }
  }

  return bestSensor;
}

// Convert pedestrian count into a crowd penalty for calculating the cost
function crowdCountToPenalty(count: number): number {
  if (count < 20) return 0;
  if (count < 50) return 0.05;
  if (count < 100) return 0.1;
  if (count < 200) return 0.2;
  return 0.35;
}

// Noise affects cost directly, and crowd affects cost through crowd penalty multiplier
function calculateFinalCost(
  length: number,
  noiseDb: number,
  crowdPenalty: number
): number {
  return length * (1 + noiseDb / 100 + crowdPenalty);
}

// Determine whether an edge should be classified as high crowd
function isHighCrowd(currentCount: number): boolean {
  return currentCount >= 30;
}

// Represent one processed edge row that will be upserted into edge_weight
type EdgeWeightUpsertRow = {
  edge_id: number;
  final_cost: number;
  observation_time: string | null;
  noise_db: number;
  crowd_count: number;
  is_high_crowd: boolean;
};

// 1. Load nodes, edges, noise sensors, and pedestrian sensors
// 2. Compute the nearest sensor values for each edge
// 3. Calculate final cost and high-crowd classification
// 4. Upsert all computed rows into edge_weight
export async function updateEdgeWeights() {
  const nodes = await loadNodes();
  const edges = await loadEdges();
  const noiseSensors = await loadNoiseSensors();
  const pedestrianSensors = await loadPedestrianSensors();

  if (noiseSensors.length === 0) {
    throw new Error("No sensor data available in noise_sensor.");
  }

  const client = await pool.connect();

  try {
    const rowsToUpsert: EdgeWeightUpsertRow[] = [];
    let processed = 0;

    for (const edge of edges) {
      const uNode = nodes.get(edge.u);
      const vNode = nodes.get(edge.v);

      if (!uNode || !vNode) {
        console.warn(
          `Skipping edge ${edge.edge_id}: missing u or v node in node table.`
        );
        continue;
      }

      const edgeMidLat = (uNode.lat + vNode.lat) / 2;
      const edgeMidLon = (uNode.lon + vNode.lon) / 2;

      const nearestNoiseSensor = findNearestNoiseSensor(
        edgeMidLat,
        edgeMidLon,
        noiseSensors
      );

      if (!nearestNoiseSensor || nearestNoiseSensor.current_db === null) {
        console.warn(
          `Skipping edge ${edge.edge_id}: no latest usable noise reading found.`
        );
        continue;
      }

      const nearestPedestrianSensor = findNearestPedestrianSensor(
        edgeMidLat,
        edgeMidLon,
        pedestrianSensors
      );

      const noiseDb = nearestNoiseSensor.current_db;
      const crowdCount =
        nearestPedestrianSensor?.current_count !== null &&
        nearestPedestrianSensor?.current_count !== undefined
          ? nearestPedestrianSensor.current_count
          : 0;

      const crowdPenalty = crowdCountToPenalty(crowdCount);
      const finalCost = calculateFinalCost(edge.length, noiseDb, crowdPenalty);
      const highCrowd = isHighCrowd(crowdCount);

      const observationTime =
        nearestPedestrianSensor?.observation_time ??
        nearestNoiseSensor.last_updated;

      rowsToUpsert.push({
        edge_id: edge.edge_id,
        final_cost: finalCost,
        observation_time: observationTime,
        noise_db: noiseDb,
        crowd_count: crowdCount,
        is_high_crowd: highCrowd,
      });

      processed++;
      if (processed % 5000 === 0) {
        console.log(`Prepared ${processed}/${edges.length} edge weights...`);
      }
    }

    console.log(`Prepared ${rowsToUpsert.length} rows. Starting batch upsert...`);

    const batchSize = 500;

    for (let i = 0; i < rowsToUpsert.length; i += batchSize) {
      const batch = rowsToUpsert.slice(i, i + batchSize);

      const valuesSql: string[] = [];
      const params: Array<number | string | boolean | null> = [];

      batch.forEach((row, index) => {
        const base = index * 6;
        valuesSql.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`
        );

        params.push(
          row.edge_id,
          row.final_cost,
          row.observation_time,
          row.noise_db,
          row.crowd_count,
          row.is_high_crowd
        );
      });

      await client.query(
        `
        INSERT INTO edge_weight (
          edge_id,
          final_cost,
          observation_time,
          noise_db,
          crowd_count,
          is_high_crowd
        )
        VALUES ${valuesSql.join(",")}
        ON CONFLICT (edge_id)
        DO UPDATE SET
          final_cost = EXCLUDED.final_cost,
          observation_time = EXCLUDED.observation_time,
          noise_db = EXCLUDED.noise_db,
          crowd_count = EXCLUDED.crowd_count,
          is_high_crowd = EXCLUDED.is_high_crowd
        `,
        params
      );

      console.log(
        `Upserted ${Math.min(i + batch.length, rowsToUpsert.length)}/${rowsToUpsert.length} edge weights...`
      );
    }

    console.log(`Upserted edge weights for ${rowsToUpsert.length} edges.`);
  } finally {
    client.release();
  }
}