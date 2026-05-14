import { pool } from "./db";
import type { LineString } from "geojson";

export type Coordinate = {
  lat: number;
  lng: number;
};

export type AvoidMode = "crowd" | "construction" | "both";
export type RouteMode = "live" | "forecast";

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
  is_indoor: boolean | null;
  final_cost: number | null;
  noise_db: number | null;
  crowd_count: number | null;
  is_high_crowd: boolean | null;
  live_final_cost: number | null;
  live_noise_db: number | null;
  live_crowd_count: number | null;
  forecast_final_cost: number | null;
  forecast_noise_db: number | null;
  forecast_crowd_count: number | null;
};

type RoutingOptions = {
  routeMode?: RouteMode;
  routeTime?: string;
};

export type GraphEdge = {
  edgeId: number;
  from: number;
  to: number;
  length: number;
  defaultCost: number | null;
  noiseDb: number | null;
  crowdCount: number | null;
  isHighCrowd: boolean;
};

export type RouteResult = {
  geojson: LineString;
  totalCost: number;
  totalLength: number;
  nodeIds: number[];
  edgeIds: number[];
};

type QueueItem = {
  nodeId: number;
  fScore: number;
};

let nodeCoordinateCache: Map<number, NodeRow> | null = null;
let nodeCoordinateCachePromise: Promise<Map<number, NodeRow>> | null = null;

let graphCache: Map<number, GraphEdge[]> | null = null;
let graphCachePromise: Promise<Map<number, GraphEdge[]>> | null = null;


let forecastGraphCache = new Map<string, Map<number, GraphEdge[]>>();
let forecastGraphCachePromises = new Map<
  string,
  Promise<Map<number, GraphEdge[]>>
>();

async function loadNodeCoordinateCache(): Promise<Map<number, NodeRow>> {
  const client = await pool.connect();

  try {
    const result = await client.query<NodeRow>(
      `
      SELECT node_id, lat, lon
      FROM node
      `
    );

    const byId = new Map<number, NodeRow>();

    for (const row of result.rows) {
      byId.set(Number(row.node_id), {
        node_id: Number(row.node_id),
        lat: Number(row.lat),
        lon: Number(row.lon),
      });
    }

    return byId;
  } finally {
    client.release();
  }
}

async function getNodeCoordinateCache(): Promise<Map<number, NodeRow>> {
  if (nodeCoordinateCache) {
    return nodeCoordinateCache;
  }

  // Prevent multiple route requests from loading the same node table at the same time
  if (!nodeCoordinateCachePromise) {
    nodeCoordinateCachePromise = loadNodeCoordinateCache();
  }

  try {
    nodeCoordinateCache = await nodeCoordinateCachePromise;
    return nodeCoordinateCache;
  } finally {
    nodeCoordinateCachePromise = null;
  }
}



export function clearNodeCoordinateCache() {
  nodeCoordinateCache = null;
  nodeCoordinateCachePromise = null;
}



function haversineDistanceMeters(a: Coordinate, b: Coordinate): number {
  const R = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
    Math.cos(lat2) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);

  return 2 * R * Math.asin(Math.sqrt(h));
}

function buildLineString(nodes: NodeRow[]): LineString {
  return {
    type: "LineString",
    coordinates: nodes.map((node) => [node.lon, node.lat]),
  };
}

function reconstructPath(
  cameFrom: Map<number, { previousNodeId: number; edgeId: number }>,
  currentNodeId: number
): { nodeIds: number[]; edgeIds: number[] } {
  const nodeIds: number[] = [currentNodeId];
  const edgeIds: number[] = [];

  while (cameFrom.has(currentNodeId)) {
    const step = cameFrom.get(currentNodeId)!;
    edgeIds.push(step.edgeId);
    currentNodeId = step.previousNodeId;
    nodeIds.push(currentNodeId);
  }

  nodeIds.reverse();
  edgeIds.reverse();

  return { nodeIds, edgeIds };
}

function popLowestFScore(queue: QueueItem[]): QueueItem | undefined {
  if (queue.length === 0) return undefined;

  let bestIndex = 0;
  for (let i = 1; i < queue.length; i++) {
    if (queue[i].fScore < queue[bestIndex].fScore) {
      bestIndex = i;
    }
  }

  const [item] = queue.splice(bestIndex, 1);
  return item;
}

function crowdCountToPenaltyDefault(count: number): number {
  if (count < 20) return 0;
  if (count < 50) return 0.05;
  if (count < 100) return 0.1;
  if (count < 200) return 0.2;
  return 0.35;
}

function crowdCountToPenaltyStrong(count: number): number {
  if (count < 20) return 0;
  if (count < 50) return 0.1;
  if (count < 100) return 0.3;
  if (count < 200) return 0.6;
  return 0.9;
}

function computeEdgeCost(edge: GraphEdge, avoidMode: AvoidMode): number {
  if (edge.noiseDb === null) {
    return edge.defaultCost ?? edge.length;
  }

  const noisePenalty = edge.noiseDb / 100;

  // 1. noise + construction
  if (avoidMode === "construction") {
    return edge.length * (1 + noisePenalty);
  }

  // 2. noise + crowd + construction
  if (avoidMode === "both") {
    const crowdPenalty =
      edge.crowdCount !== null ? crowdCountToPenaltyDefault(edge.crowdCount) : 0;

    const normalCrowdWeight = 1;
    return edge.length * (1 + noisePenalty + normalCrowdWeight * crowdPenalty);
  }

  // 3. noise + crowd (stronger crowd effect)
  if (avoidMode === "crowd") {
    const baseCrowdPenalty =
      edge.crowdCount !== null ? crowdCountToPenaltyStrong(edge.crowdCount) : 0;
    const extraHighCrowdPenalty = edge.isHighCrowd ? 0.5 : 0;
    const crowdPenalty = baseCrowdPenalty + extraHighCrowdPenalty;

    const strongCrowdWeight = 6;
    return edge.length * (1 + noisePenalty + strongCrowdWeight * crowdPenalty);
  }

  // fallback / old default mode
  return edge.defaultCost ?? edge.length;
}

async function getConstructionBlockedEdgeIds(): Promise<Set<number>> {
  const client = await pool.connect();

  try {
    const result = await client.query<{ edge_id: number }>(
      `
      SELECT edge_id
      FROM construction_blocked_edge
      `
    );

    return new Set(result.rows.map((row) => Number(row.edge_id)));
  } finally {
    client.release();
  }
}


export async function snapToNearestNode(
  coordinate: Coordinate,
  bboxDelta = 0.003
): Promise<NodeRow> {
  const client = await pool.connect();

  try {
    const nearbyNodesResult = await client.query<NodeRow>(
      `
      SELECT node_id, lat, lon
      FROM node
      WHERE lat BETWEEN $1 AND $2
        AND lon BETWEEN $3 AND $4
      `,
      [
        coordinate.lat - bboxDelta,
        coordinate.lat + bboxDelta,
        coordinate.lng - bboxDelta,
        coordinate.lng + bboxDelta,
      ]
    );

    let candidates = nearbyNodesResult.rows;

    if (candidates.length === 0) {
      const fallbackResult = await client.query<NodeRow>(
        `
        SELECT node_id, lat, lon
        FROM node
        `
      );
      candidates = fallbackResult.rows;
    }

    if (candidates.length === 0) {
      throw new Error("No nodes found in database.");
    }

    let bestNode = candidates[0];
    let bestDistance = haversineDistanceMeters(coordinate, {
      lat: Number(bestNode.lat),
      lng: Number(bestNode.lon),
    });

    for (const node of candidates) {
      const distance = haversineDistanceMeters(coordinate, {
        lat: Number(node.lat),
        lng: Number(node.lon),
      });

      if (distance < bestDistance) {
        bestDistance = distance;
        bestNode = node;
      }
    }

    return {
      node_id: Number(bestNode.node_id),
      lat: Number(bestNode.lat),
      lon: Number(bestNode.lon),
    };
  } finally {
    client.release();
  }
}

async function loadGraph(): Promise<Map<number, GraphEdge[]>> {
  const client = await pool.connect();

  try {
    const result = await client.query<EdgeRow>(
      `
      SELECT
        e.edge_id,
        e.u,
        e.v,
        e.length,
        e.is_indoor,
        ew.final_cost,
        ew.noise_db,
        ew.crowd_count,
        ew.is_high_crowd
      FROM edge e
      LEFT JOIN edge_weight ew
        ON e.edge_id = ew.edge_id
      `
    );

    const graph = new Map<number, GraphEdge[]>();

    for (const row of result.rows) {
      const forward: GraphEdge = {
        edgeId: Number(row.edge_id),
        from: Number(row.u),
        to: Number(row.v),
        length: Number(row.length),
        defaultCost:
          row.final_cost !== null && row.final_cost !== undefined
            ? Number(row.final_cost)
            : null,
        noiseDb:
          row.noise_db !== null && row.noise_db !== undefined
            ? Number(row.noise_db)
            : null,
        crowdCount:
          row.crowd_count !== null && row.crowd_count !== undefined
            ? Number(row.crowd_count)
            : null,
        isHighCrowd: Boolean(row.is_high_crowd),
      };

      const backward: GraphEdge = {
        ...forward,
        from: Number(row.v),
        to: Number(row.u),
      };

      if (!graph.has(forward.from)) graph.set(forward.from, []);
      if (!graph.has(backward.from)) graph.set(backward.from, []);

      graph.get(forward.from)!.push(forward);
      graph.get(backward.from)!.push(backward);
    }

    return graph;
  } finally {
    client.release();
  }
}

function bucketToNearestHour(routeTime: string): Date {
  const parsed = new Date(routeTime);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid routeTime. Expected an ISO datetime string.");
  }

  const slotMs = 60 * 60 * 1000;
  const roundedMs = Math.round(parsed.getTime() / slotMs) * slotMs;
  return new Date(roundedMs);
}

async function loadGraphForForecast(
  forecastBucket: Date
): Promise<Map<number, GraphEdge[]>> {
  const client = await pool.connect();

  try {
    const result = await client.query<EdgeRow>(
      `
      WITH latest_succeeded_run AS (
        SELECT fr.run_id
        FROM forecast_runs fr
        WHERE fr.status = 'succeeded'
        ORDER BY fr.generated_at DESC
        LIMIT 1
      )
      SELECT
        e.edge_id,
        e.u,
        e.v,
        e.length,
        e.is_indoor,
        ew.final_cost AS live_final_cost,
        ew.noise_db AS live_noise_db,
        ew.crowd_count AS live_crowd_count,
        fw.final_cost AS forecast_final_cost,
        fw.predicted_noise_db AS forecast_noise_db,
        fw.predicted_crowd_count AS forecast_crowd_count,
        COALESCE(fw.final_cost, ew.final_cost) AS final_cost,
        COALESCE(fw.predicted_noise_db, ew.noise_db) AS noise_db,
        COALESCE(fw.predicted_crowd_count, ew.crowd_count) AS crowd_count,
        COALESCE(fw.is_high_crowd, ew.is_high_crowd) AS is_high_crowd
      FROM edge e
      LEFT JOIN edge_weight ew
        ON e.edge_id = ew.edge_id
      LEFT JOIN LATERAL (
        SELECT
          f.final_cost,
          f.predicted_noise_db,
          f.predicted_crowd_count,
          f.is_high_crowd
        FROM edge_forecasts f
        WHERE f.edge_id = e.edge_id
          AND f.run_id = (SELECT run_id FROM latest_succeeded_run)
          AND (
            -- Exact slot match when requested time is inside stored horizon.
            f.forecast_time = $1
            OR
            -- Fallback for dates beyond horizon:
            -- use same Melbourne weekday + hour from the latest forecast week.
            (
              EXTRACT(ISODOW FROM (f.forecast_time AT TIME ZONE 'Australia/Melbourne')) =
              EXTRACT(ISODOW FROM ($1::timestamptz AT TIME ZONE 'Australia/Melbourne'))
              AND EXTRACT(HOUR FROM (f.forecast_time AT TIME ZONE 'Australia/Melbourne')) =
              EXTRACT(HOUR FROM ($1::timestamptz AT TIME ZONE 'Australia/Melbourne'))
            )
          )
        ORDER BY
          CASE
            WHEN f.forecast_time = $1 THEN 0
            ELSE 1
          END
        LIMIT 1
      ) fw ON TRUE
      `,
      [forecastBucket.toISOString()]
    );

    const graph = new Map<number, GraphEdge[]>();

    for (const row of result.rows) {
      const forward: GraphEdge = {
        edgeId: Number(row.edge_id),
        from: Number(row.u),
        to: Number(row.v),
        length: Number(row.length),
        defaultCost:
          row.final_cost !== null && row.final_cost !== undefined
            ? Number(row.final_cost)
            : null,
        noiseDb:
          row.noise_db !== null && row.noise_db !== undefined
            ? Number(row.noise_db)
            : null,
        crowdCount:
          row.crowd_count !== null && row.crowd_count !== undefined
            ? Number(row.crowd_count)
            : null,
        isHighCrowd: Boolean(row.is_high_crowd),
      };

      const backward: GraphEdge = {
        ...forward,
        from: Number(row.v),
        to: Number(row.u),
      };

      if (!graph.has(forward.from)) graph.set(forward.from, []);
      if (!graph.has(backward.from)) graph.set(backward.from, []);

      graph.get(forward.from)!.push(forward);
      graph.get(backward.from)!.push(backward);
    }

    return graph;
  } finally {
    client.release();
  }
}

async function getForecastGraphCache(
  forecastBucket: Date
): Promise<Map<number, GraphEdge[]>> {
  const cacheKey = forecastBucket.toISOString();

  const cachedGraph = forecastGraphCache.get(cacheKey);
  if (cachedGraph) {
    return cachedGraph;
  }

  let graphPromise = forecastGraphCachePromises.get(cacheKey);

  if (!graphPromise) {
    graphPromise = loadGraphForForecast(forecastBucket);
    forecastGraphCachePromises.set(cacheKey, graphPromise);
  }

  try {
    const graph = await graphPromise;
    forecastGraphCache.set(cacheKey, graph);
    return graph;
  } finally {
    forecastGraphCachePromises.delete(cacheKey);
  }
}


async function getGraphCache(): Promise<Map<number, GraphEdge[]>> {
  if (graphCache) {
    return graphCache;
  }

  if (!graphCachePromise) {
    graphCachePromise = loadGraph();
  }

  try {
    graphCache = await graphCachePromise;
    return graphCache;
  } finally {
    graphCachePromise = null;
  }
}

export function clearGraphCache() {
  graphCache = null;
  graphCachePromise = null;
  forecastGraphCache.clear();
  forecastGraphCachePromises.clear();
}



export async function getRouteGraph(): Promise<Map<number, GraphEdge[]>> {
  return getGraphCache();
}


async function getNodesByIds(nodeIds: number[]): Promise<NodeRow[]> {
  if (nodeIds.length === 0) return [];

  const nodesById = await getNodeCoordinateCache();

  return nodeIds.map((id) => {
    const row = nodesById.get(Number(id));

    if (!row) {
      throw new Error(`Node ${id} not found while building route geometry.`);
    }

    return row;
  });
}


async function getNodeCoordinate(nodeId: number): Promise<Coordinate> {
  const nodesById = await getNodeCoordinateCache();
  const row = nodesById.get(Number(nodeId));

  if (!row) {
    throw new Error(`Node ${nodeId} not found.`);
  }

  return {
    lat: Number(row.lat),
    lng: Number(row.lon),
  };
}


export async function findQuietestRoute(
  startNodeId: number,
  endNodeId: number,
  avoidMode: AvoidMode = "both",
  options: RoutingOptions = {}
): Promise<RouteResult> {

  const routeStartMs = Date.now();
  startNodeId = Number(startNodeId);
  endNodeId = Number(endNodeId);


  const routeMode = options.routeMode ?? "live";

  const graphStartMs = Date.now();
  const routeGraph =
    routeMode === "forecast" && options.routeTime
      ? await getForecastGraphCache(bucketToNearestHour(options.routeTime))
      : await getGraphCache();


  console.log("route timing: graph loaded", {
    routeMode,
    routeTime: options.routeTime,
    ms: Date.now() - graphStartMs,
  });

  const blockedStartMs = Date.now();

  const blockedEdgeIds =
    avoidMode === "construction" || avoidMode === "both"
      ? await getConstructionBlockedEdgeIds()
      : new Set<number>();

  console.log("route timing: blocked edges loaded", {
    avoidMode,
    count: blockedEdgeIds.size,
    ms: Date.now() - blockedStartMs,
  });

  if (!routeGraph.has(startNodeId)) {
    throw new Error(`Start node ${startNodeId} has no connected edges.`);
  }
  if (!routeGraph.has(endNodeId)) {
    throw new Error(`End node ${endNodeId} has no connected edges.`);
  }

  const endCoordinate = await getNodeCoordinate(endNodeId);

  const openSet: QueueItem[] = [{ nodeId: startNodeId, fScore: 0 }];
  const cameFrom = new Map<number, { previousNodeId: number; edgeId: number }>();

  const gScore = new Map<number, number>();
  gScore.set(startNodeId, 0);

  const visited = new Set<number>();

  while (openSet.length > 0) {
    const current = popLowestFScore(openSet)!;

    if (current.nodeId === endNodeId) {
      const { nodeIds, edgeIds } = reconstructPath(cameFrom, endNodeId);
      const routeNodes = await getNodesByIds(nodeIds);

      let totalLength = 0;

      for (let i = 0; i < nodeIds.length - 1; i++) {
        const from = Number(nodeIds[i]);
        const to = Number(nodeIds[i + 1]);
        const edge = routeGraph.get(from)?.find((e) => Number(e.to) === to);
        if (edge) {
          totalLength += Number(edge.length);
        }
      }

      console.log("route timing: route search complete", {
        routeMode,
        routeTime: options.routeTime,
        visitedNodes: visited.size,
        pathNodes: nodeIds.length,
        pathEdges: edgeIds.length,
        totalMs: Date.now() - routeStartMs,
      });

      return {
        geojson: buildLineString(routeNodes),
        totalCost: gScore.get(endNodeId)!,
        totalLength,
        nodeIds: nodeIds.map(Number),
        edgeIds: edgeIds.map(Number),
      };
    }

    if (visited.has(current.nodeId)) {
      continue;
    }
    visited.add(current.nodeId);

    const neighbors = routeGraph.get(Number(current.nodeId)) ?? [];

    for (const edge of neighbors) {
      if (blockedEdgeIds.has(Number(edge.edgeId))) {
        continue;
      }

      const edgeCost = computeEdgeCost(edge, avoidMode);
      const tentativeG =
        (gScore.get(Number(current.nodeId)) ?? Number.POSITIVE_INFINITY) +
        edgeCost;

      if (tentativeG < (gScore.get(Number(edge.to)) ?? Number.POSITIVE_INFINITY)) {
        cameFrom.set(Number(edge.to), {
          previousNodeId: Number(current.nodeId),
          edgeId: Number(edge.edgeId),
        });

        gScore.set(Number(edge.to), tentativeG);

        const neighborCoordinate = await getNodeCoordinate(Number(edge.to));
        const heuristic = haversineDistanceMeters(
          neighborCoordinate,
          endCoordinate
        );

        const neighborFScore = tentativeG + heuristic;

        openSet.push({
          nodeId: Number(edge.to),
          fScore: neighborFScore,
        });
      }
    }
  }

  throw new Error("No route found between the selected nodes.");
}

export async function getQuietestRouteFromCoordinates(
  start: Coordinate,
  end: Coordinate,
  avoidMode: AvoidMode = "both",
  options: RoutingOptions = {}
): Promise<{
  startNode: NodeRow;
  endNode: NodeRow;
  route: RouteResult;
}> {
  const startNode = await snapToNearestNode(start);
  const endNode = await snapToNearestNode(end);

  const route = await findQuietestRoute(
    startNode.node_id,
    endNode.node_id,
    avoidMode,
    options
  );

  return {
    startNode,
    endNode,
    route,
  };
}