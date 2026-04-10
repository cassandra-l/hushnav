import { pool } from "./db";
import type { LineString } from "geojson";

export type Coordinate = {
  lat: number;
  lng: number;
};

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
};

type GraphEdge = {
  edgeId: number;
  from: number;
  to: number;
  cost: number;
  length: number;
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
      lat: bestNode.lat,
      lng: bestNode.lon,
    });

    for (const node of candidates) {
      const distance = haversineDistanceMeters(coordinate, {
        lat: node.lat,
        lng: node.lon,
      });

      if (distance < bestDistance) {
        bestDistance = distance;
        bestNode = node;
      }
    }

    return bestNode;
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
        ew.final_cost
      FROM edge e
      LEFT JOIN edge_weight ew
        ON e.edge_id = ew.edge_id
      `
    );

    const graph = new Map<number, GraphEdge[]>();

    for (const row of result.rows) {
      const cost =
        row.final_cost !== null && row.final_cost !== undefined
          ? Number(row.final_cost)
          : Number(row.length);

      const forward: GraphEdge = {
        edgeId: row.edge_id,
        from: row.u,
        to: row.v,
        cost,
        length: Number(row.length),
      };

      const backward: GraphEdge = {
        edgeId: row.edge_id,
        from: row.v,
        to: row.u,
        cost,
        length: Number(row.length),
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

async function getNodesByIds(nodeIds: number[]): Promise<NodeRow[]> {
  if (nodeIds.length === 0) return [];

  const client = await pool.connect();

  try {
    const result = await client.query<NodeRow>(
      `
      SELECT node_id, lat, lon
      FROM node
      WHERE node_id = ANY($1::bigint[])
      `,
      [nodeIds]
    );

    const byId = new Map<number, NodeRow>();
    for (const row of result.rows) {
      byId.set(row.node_id, row);
    }

    return nodeIds.map((id) => {
      const row = byId.get(id);
      if (!row) {
        throw new Error(`Node ${id} not found while building route geometry.`);
      }
      return row;
    });
  } finally {
    client.release();
  }
}

async function getNodeCoordinate(nodeId: number): Promise<Coordinate> {
  const client = await pool.connect();

  try {
    const result = await client.query<NodeRow>(
      `
      SELECT node_id, lat, lon
      FROM node
      WHERE node_id = $1
      LIMIT 1
      `,
      [nodeId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Node ${nodeId} not found.`);
    }

    return {
      lat: result.rows[0].lat,
      lng: result.rows[0].lon,
    };
  } finally {
    client.release();
  }
}

export async function findQuietestRoute(
  startNodeId: number,
  endNodeId: number
): Promise<RouteResult> {
  const graph = await loadGraph();

  if (!graph.has(startNodeId)) {
    throw new Error(`Start node ${startNodeId} has no connected edges.`);
  }
  if (!graph.has(endNodeId)) {
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
      const routeGraph = await loadGraph();

      for (let i = 0; i < nodeIds.length - 1; i++) {
        const from = nodeIds[i];
        const to = nodeIds[i + 1];
        const edge = routeGraph.get(from)?.find((e) => e.to === to);
        if (edge) {
          totalLength += edge.length;
        }
      }

      return {
        geojson: buildLineString(routeNodes),
        totalCost: gScore.get(endNodeId)!,
        totalLength,
        nodeIds,
        edgeIds,
      };
    }

    if (visited.has(current.nodeId)) {
      continue;
    }
    visited.add(current.nodeId);

    const neighbors = graph.get(current.nodeId) ?? [];

    for (const edge of neighbors) {
      const tentativeG =
        (gScore.get(current.nodeId) ?? Number.POSITIVE_INFINITY) + edge.cost;

      if (tentativeG < (gScore.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
        cameFrom.set(edge.to, {
          previousNodeId: current.nodeId,
          edgeId: edge.edgeId,
        });

        gScore.set(edge.to, tentativeG);

        const neighborCoordinate = await getNodeCoordinate(edge.to);
        const heuristic = haversineDistanceMeters(
          neighborCoordinate,
          endCoordinate
        );

        const neighborFScore = tentativeG + heuristic;

        openSet.push({
          nodeId: edge.to,
          fScore: neighborFScore,
        });
      }
    }
  }

  throw new Error("No route found between the selected nodes.");
}

export async function getQuietestRouteFromCoordinates(
  start: Coordinate,
  end: Coordinate
): Promise<{
  startNode: NodeRow;
  endNode: NodeRow;
  route: RouteResult;
}> {
  const startNode = await snapToNearestNode(start);
  const endNode = await snapToNearestNode(end);

  const route = await findQuietestRoute(startNode.node_id, endNode.node_id);

  return {
    startNode,
    endNode,
    route,
  };
}