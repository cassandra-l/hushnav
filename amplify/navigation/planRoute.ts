import { geocodePlace } from "./geocode";
import { getQuietestRouteFromCoordinates } from "./route";

export type Coordinate = {
  lat: number;
  lng: number;
};

export type PlanRouteRequest = {
  start?: Coordinate;
  startQuery?: string;
  endQuery?: string;
};

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
    geojson: GeoJSON.LineString;
  };
};

function isValidCoordinate(value: unknown): value is Coordinate {
  if (!value || typeof value !== "object") return false;

  const coord = value as Record<string, unknown>;

  return (
    typeof coord.lat === "number" &&
    typeof coord.lng === "number"
  );
}

export async function planRoute(body: PlanRouteRequest): Promise<PlanRouteResponse> {
  const { start, startQuery, endQuery } = body;

  let startCoordinate: Coordinate;
  let resolvedStartName: string | null = null;

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
      "Invalid request body. Expected either start coordinates or startQuery, and also endQuery."
    );
  }

  if (typeof endQuery !== "string" || !endQuery.trim()) {
    throw new Error("Invalid request body. Expected endQuery.");
  }

  const geocodedEnd = await geocodePlace(endQuery);
  const endCoordinate: Coordinate = {
    lat: geocodedEnd.lat,
    lng: geocodedEnd.lng,
  };

  const result = await getQuietestRouteFromCoordinates(
    startCoordinate,
    endCoordinate
  );

  return {
    start: {
      input: isValidCoordinate(start)
        ? "current_location_coordinates"
        : startQuery!,
      resolvedName: resolvedStartName,
      lat: startCoordinate.lat,
      lng: startCoordinate.lng,
      snappedNodeId: result.startNode.node_id,
    },
    end: {
      input: endQuery,
      resolvedName: geocodedEnd.displayName,
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