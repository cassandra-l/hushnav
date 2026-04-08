import { pool } from "./db";
import type { SensorRow } from "./fetchNoise";
import type { PedestrianSensorRow } from "./fetchCrowd";

export type NodeRow = {
  node_id: number;
  lat: number;
  lon: number;
};

type EdgeRow = {
  edge_id: number;
  u: number;
  v: number;
  length: number;
};

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

function crowdCountToPenalty(count: number): number {
  if (count < 20) return 0;
  if (count < 50) return 0.05;
  if (count < 100) return 0.1;
  if (count < 200) return 0.2;
  return 0.35;
}

function calculateFinalCost(
  length: number,
  noiseDb: number,
  crowdPenalty: number
): number {
  return length * (1 + noiseDb / 100 + crowdPenalty);
}

function isHighNoise(currentDb: number): boolean {
  return currentDb > 70;
}

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
        nearestPedestrianSensor && nearestPedestrianSensor.current_count !== null
          ? nearestPedestrianSensor.current_count
          : 0;

      const crowdPenalty = crowdCountToPenalty(crowdCount);
      const finalCost = calculateFinalCost(edge.length, noiseDb, crowdPenalty);
      const highNoise = isHighNoise(noiseDb);

      await client.query(
        `
        INSERT INTO edge_weight (
          edge_id,
          final_cost,
          observation_time,
          noise_db,
          is_high_noise
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (edge_id)
        DO UPDATE SET
          final_cost = EXCLUDED.final_cost,
          observation_time = EXCLUDED.observation_time,
          noise_db = EXCLUDED.noise_db,
          is_high_noise = EXCLUDED.is_high_noise
        `,
        [
          edge.edge_id,
          finalCost,
          nearestNoiseSensor.last_updated,
          noiseDb,
          highNoise,
        ]
      );
    }

    console.log(`Upserted edge weights for ${edges.length} edges.`);
  } finally {
    client.release();
  }
}