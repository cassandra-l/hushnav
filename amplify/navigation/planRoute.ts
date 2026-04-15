import { geocodePlace } from "./geocode";
import { getQuietestRouteFromCoordinates } from "./route";
import type { LineString } from "geojson";

export type Coordinate = {
  lat: number;
  lng: number;
};

// Request body for route planning
export type PlanRouteRequest = {
  start?: Coordinate;
  end?: Coordinate;
  startQuery?: string;
  endQuery?: string;
};
// Include start, end information and the final route details
export type PlanRouteResponse = {
  start: {
    input: string;
    resolvedName: string | null;
    lat: number;
    lng: number;
    snappedNodeId: number;
  };
  end: {
    input: string;
    resolvedName: string | null;
    lat: number;
    lng: number;
    snappedNodeId: number;
  };
  route: {
    totalCost: number;
    totalLength: number;
    edgeIds: number[];
    nodeIds: number[];
    geojson: LineString;
  };
};
// Check whether a value is a valid coordinate object
function isValidCoordinate(value: unknown): value is Coordinate {
  if (!value || typeof value !== "object") return false;

  const coord = value as Record<string, unknown>;
  return typeof coord.lat === "number" && typeof coord.lng === "number";
}


export async function planRoute(
  body: PlanRouteRequest
): Promise<PlanRouteResponse> {
  const { start, end, startQuery, endQuery } = body;

  let startCoordinate: Coordinate;
  let endCoordinate: Coordinate;
  let resolvedStartName: string | null = null;
  let resolvedEndName: string | null = null;

  // Use the provided start coordinates directly if they are valid or geocode the start query string
  if (isValidCoordinate(start)) {
    startCoordinate = start;
  } else if (typeof startQuery === "string" && startQuery.trim()) {
    const geocodedStart = await geocodePlace(startQuery);
    startCoordinate = {
      lat: geocodedStart.lat,
      lng: geocodedStart.lng,
    };
    resolvedStartName = geocodedStart.displayName;
  } else {
    throw new Error(
      "Invalid request body. Expected either start coordinates or startQuery."
    );
  }

  // Use the provided end coordinates directly if they are valid or geocode the end query string
  if (isValidCoordinate(end)) {
    endCoordinate = end;
  } else if (typeof endQuery === "string" && endQuery.trim()) {
    const geocodedEnd = await geocodePlace(endQuery);
    endCoordinate = {
      lat: geocodedEnd.lat,
      lng: geocodedEnd.lng,
    };
    resolvedEndName = geocodedEnd.displayName;
  } else {
    throw new Error(
      "Invalid request body. Expected either end coordinates or endQuery."
    );
  }
  const result = await getQuietestRouteFromCoordinates(
    startCoordinate,
    endCoordinate
  );

  return {
    start: {
      input: isValidCoordinate(start)
        ? "selected_start_coordinates"
        : startQuery!,
      resolvedName: resolvedStartName,
      lat: startCoordinate.lat,
      lng: startCoordinate.lng,
      snappedNodeId: result.startNode.node_id,
    },
    end: {
      input: isValidCoordinate(end)
        ? "selected_end_coordinates"
        : endQuery!,
      resolvedName: resolvedEndName,
      lat: endCoordinate.lat,
      lng: endCoordinate.lng,
      snappedNodeId: result.endNode.node_id,
    },
    route: {
      totalCost: result.route.totalCost,
      totalLength: result.route.totalLength,
      edgeIds: result.route.edgeIds,
      nodeIds: result.route.nodeIds,
      geojson: result.route.geojson,
    },
  };
}