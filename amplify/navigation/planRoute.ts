import { geocodePlace } from "./geocode";
import {
  getQuietestRouteFromCoordinates,
  type AvoidMode,
  type RouteResult,
} from "./route";
import {
  getSafeSpacesNearRoute,
  getSafeSpaceById,
  type SafeSpace,
  type SafeSpaceType,
} from "./safeSpaces";
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
  avoidMode?: AvoidMode;
  safeSpaceTypes?: SafeSpaceType[];
  stopSafeSpaceId?: number;
};

// Full response returned to the frontend
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
  safeSpaces: SafeSpace[];
  stopover?: {
    id: number;
    name: string;
    type: SafeSpaceType;
    lat: number;
    lng: number;
  };
};

// Checks whether a value is a valid coordinate object
function isValidCoordinate(value: unknown): value is Coordinate {
  if (!value || typeof value !== "object") return false;

  const coord = value as Record<string, unknown>;
  return typeof coord.lat === "number" && typeof coord.lng === "number";
}

// Merges two route results into one route.
// Removes the duplicated stopover node / coordinate at the join point.
function mergeRouteResults(first: RouteResult, second: RouteResult): RouteResult {
  const mergedCoordinates = [...first.geojson.coordinates];

  if (second.geojson.coordinates.length > 0) {
    const firstLastCoordinate = mergedCoordinates[mergedCoordinates.length - 1];
    const secondFirstCoordinate = second.geojson.coordinates[0];

    const sameCoordinate =
      firstLastCoordinate &&
      secondFirstCoordinate &&
      firstLastCoordinate[0] === secondFirstCoordinate[0] &&
      firstLastCoordinate[1] === secondFirstCoordinate[1];

    mergedCoordinates.push(
      ...(sameCoordinate
        ? second.geojson.coordinates.slice(1)
        : second.geojson.coordinates)
    );
  }

  const mergedNodeIds = [...first.nodeIds];
  if (second.nodeIds.length > 0) {
    const sameNode =
      mergedNodeIds.length > 0 &&
      mergedNodeIds[mergedNodeIds.length - 1] === second.nodeIds[0];

    mergedNodeIds.push(...(sameNode ? second.nodeIds.slice(1) : second.nodeIds));
  }

  const mergedEdgeIds = [...first.edgeIds, ...second.edgeIds];

  return {
    geojson: {
      type: "LineString",
      coordinates: mergedCoordinates,
    },
    totalCost: first.totalCost + second.totalCost,
    totalLength: first.totalLength + second.totalLength,
    nodeIds: mergedNodeIds,
    edgeIds: mergedEdgeIds,
  };
}

export async function planRoute(
  body: PlanRouteRequest
): Promise<PlanRouteResponse> {
  const {
    start,
    end,
    startQuery,
    endQuery,
    avoidMode = "both",
    safeSpaceTypes,
    stopSafeSpaceId,
  } = body;

  let startCoordinate: Coordinate;
  let endCoordinate: Coordinate;
  let resolvedStartName: string | null = null;
  let resolvedEndName: string | null = null;

  // Use provided start coordinates if available, otherwise geocode the start query
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

  // Use provided end coordinates if available, otherwise geocode the end query
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

  // Original route logic: start -> end
  if (stopSafeSpaceId === undefined) {
    const result = await getQuietestRouteFromCoordinates(
      startCoordinate,
      endCoordinate,
      avoidMode
    );

    const safeSpaces = await getSafeSpacesNearRoute(
      result.route.geojson,
      safeSpaceTypes
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
      safeSpaces,
    };
  }

  // Stopover route logic: start -> safe space -> end
  const stopSafeSpace = await getSafeSpaceById(stopSafeSpaceId);

  if (!stopSafeSpace) {
    throw new Error(`Safe space ${stopSafeSpaceId} not found.`);
  }

  const stopCoordinate: Coordinate = {
    lat: stopSafeSpace.lat,
    lng: stopSafeSpace.lng,
  };

  const firstLeg = await getQuietestRouteFromCoordinates(
    startCoordinate,
    stopCoordinate,
    avoidMode
  );

  const secondLeg = await getQuietestRouteFromCoordinates(
    stopCoordinate,
    endCoordinate,
    avoidMode
  );

  const mergedRoute = mergeRouteResults(firstLeg.route, secondLeg.route);

  const safeSpaces = await getSafeSpacesNearRoute(
    mergedRoute.geojson,
    safeSpaceTypes
  );

  return {
    start: {
      input: isValidCoordinate(start)
        ? "selected_start_coordinates"
        : startQuery!,
      resolvedName: resolvedStartName,
      lat: startCoordinate.lat,
      lng: startCoordinate.lng,
      snappedNodeId: firstLeg.startNode.node_id,
    },
    end: {
      input: isValidCoordinate(end)
        ? "selected_end_coordinates"
        : endQuery!,
      resolvedName: resolvedEndName,
      lat: endCoordinate.lat,
      lng: endCoordinate.lng,
      snappedNodeId: secondLeg.endNode.node_id,
    },
    route: {
      totalCost: mergedRoute.totalCost,
      totalLength: mergedRoute.totalLength,
      edgeIds: mergedRoute.edgeIds,
      nodeIds: mergedRoute.nodeIds,
      geojson: mergedRoute.geojson,
    },
    safeSpaces,
    stopover: {
    id: stopSafeSpace.id,
    name: stopSafeSpace.name,
    type: stopSafeSpace.type,
    lat: stopSafeSpace.lat,
    lng: stopSafeSpace.lng,
    },
  };
}