import { geocodePlace } from "./geocode";
import {
  findQuietestRoute,
  getQuietestRouteFromCoordinates,
  getRouteGraph,
  snapToNearestNode,
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

  // Old single-stop field.
  // Keep this so older frontend code does not break.
  stopSafeSpaceId?: number;

  // New multi-stop field.
  // The frontend should send selected safe spaces in the order the user selects them.
  stopSafeSpaceIds?: number[];
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

  // Old single-stop response field.
  // Kept for compatibility.
  stopover?: {
    id: number;
    name: string;
    type: SafeSpaceType;
    lat: number;
    lng: number;
  };

  // New multi-stop response field.
  stopovers?: {
    id: number;
    name: string;
    type: SafeSpaceType;
    lat: number;
    lng: number;
  }[];
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

    // Use tolerance instead of exact comparison.
    // This avoids tiny coordinate differences creating a strange straight-line join.
    const sameCoordinate =
      firstLastCoordinate &&
      secondFirstCoordinate &&
      Math.abs(firstLastCoordinate[0] - secondFirstCoordinate[0]) < 0.0000001 &&
      Math.abs(firstLastCoordinate[1] - secondFirstCoordinate[1]) < 0.0000001;

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

// Merges any number of route legs into one final route.
function mergeMultipleRouteResults(routeLegs: RouteResult[]): RouteResult {
  if (routeLegs.length === 0) {
    throw new Error("Cannot merge route because no route legs were created.");
  }

  return routeLegs.slice(1).reduce((mergedRoute, nextRoute) => {
    return mergeRouteResults(mergedRoute, nextRoute);
  }, routeLegs[0]);
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
    stopSafeSpaceIds,
  } = body;

  let startCoordinate: Coordinate;
  let endCoordinate: Coordinate;
  let resolvedStartName: string | null = null;
  let resolvedEndName: string | null = null;

  // Use provided start coordinates if available, otherwise geocode the start query.
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

  // Use provided end coordinates if available, otherwise geocode the end query.
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

  // Support both the old single-stop field and the new multi-stop field.
  // If stopSafeSpaceIds is sent by the frontend, use that.
  // Otherwise, fall back to stopSafeSpaceId.
  const selectedStopIds =
    Array.isArray(stopSafeSpaceIds) && stopSafeSpaceIds.length > 0
      ? stopSafeSpaceIds
      : stopSafeSpaceId !== undefined
        ? [stopSafeSpaceId]
        : [];

  // Remove duplicate stop IDs while keeping the user's selected order.
  const orderedUniqueStopIds = Array.from(new Set(selectedStopIds));

  // No stopovers selected: normal start -> destination route.
  if (orderedUniqueStopIds.length === 0) {
    const result = await getQuietestRouteFromCoordinates(
      startCoordinate,
      endCoordinate,
      avoidMode
    );

    const safeSpacesStartMs = Date.now();
    const safeSpaces = await getSafeSpacesNearRoute(
      result.route.geojson,
      safeSpaceTypes
    );
    console.log("route timing: safe spaces loaded", {
      stopovers: 0,
      count: safeSpaces.length,
      ms: Date.now() - safeSpacesStartMs,
    });

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

  // Load the selected safe spaces in the exact order the user selected them.
  const selectedSafeSpaces = await Promise.all(
    orderedUniqueStopIds.map(async (safeSpaceId) => {
      const safeSpace = await getSafeSpaceById(safeSpaceId);

      if (!safeSpace) {
        throw new Error(`Safe space ${safeSpaceId} not found.`);
      }

      return safeSpace;
    })
  );

  // Build ordered waypoints:
  // Start -> Stop 1 -> Stop 2 -> ... -> Destination
  const waypointCoordinates: Coordinate[] = [
    startCoordinate,
    ...selectedSafeSpaces.map((safeSpace) => ({
      lat: safeSpace.lat,
      lng: safeSpace.lng,
    })),
    endCoordinate,
  ];

  // Snap every waypoint once.
  // This prevents weird straight-line joins caused by the same stop being
  // snapped slightly differently across separate route legs.
  const waypointNodes = await Promise.all(
    waypointCoordinates.map((coordinate) => snapToNearestNode(coordinate))
  );

  const routeGraph = await getRouteGraph();

  // Calculate each leg using snapped node IDs:
  // start node -> stop 1 node -> stop 2 node -> end node.
  const routeLegs: RouteResult[] = [];

  for (let i = 0; i < waypointNodes.length - 1; i++) {
    const legStartNode = waypointNodes[i];
    const legEndNode = waypointNodes[i + 1];

    const legRoute = await findQuietestRoute(
      legStartNode.node_id,
      legEndNode.node_id,
      avoidMode,
      routeGraph
    );

    routeLegs.push(legRoute);
  }

  // Merge every leg into one final route line.
  const mergedRoute = mergeMultipleRouteResults(routeLegs);

  const safeSpacesStartMs = Date.now();
  const safeSpaces = await getSafeSpacesNearRoute(
    mergedRoute.geojson,
    safeSpaceTypes
  );
  console.log("route timing: safe spaces loaded", {
    stopovers: orderedUniqueStopIds.length,
    count: safeSpaces.length,
    ms: Date.now() - safeSpacesStartMs,
  });

  const stopovers = selectedSafeSpaces.map((safeSpace) => ({
    id: safeSpace.id,
    name: safeSpace.name,
    type: safeSpace.type,
    lat: safeSpace.lat,
    lng: safeSpace.lng,
  }));

  return {
    start: {
      input: isValidCoordinate(start)
        ? "selected_start_coordinates"
        : startQuery!,
      resolvedName: resolvedStartName,
      lat: startCoordinate.lat,
      lng: startCoordinate.lng,
      snappedNodeId: waypointNodes[0].node_id,
    },
    end: {
      input: isValidCoordinate(end)
        ? "selected_end_coordinates"
        : endQuery!,
      resolvedName: resolvedEndName,
      lat: endCoordinate.lat,
      lng: endCoordinate.lng,
      snappedNodeId: waypointNodes[waypointNodes.length - 1].node_id,
    },
    route: {
      totalCost: mergedRoute.totalCost,
      totalLength: mergedRoute.totalLength,
      edgeIds: mergedRoute.edgeIds,
      nodeIds: mergedRoute.nodeIds,
      geojson: mergedRoute.geojson,
    },
    safeSpaces,
    stopover: stopovers[0],
    stopovers,
  };
}