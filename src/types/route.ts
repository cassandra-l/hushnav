// Types for route planning request/response from the backend

export type RoutePreference = "quietest" | "balanced" | "fastest";

// This should match the backend avoid modes.
// "both" means avoid noise/crowd/construction together based on backend weighting.
export type AvoidMode = "crowd" | "construction" | "both";

// Generic lat/lng coordinate used across the frontend
export type LatLng = {
  lat: number;
  lng: number;
};

// Safe space returned by backend and shown on the map
export type SafeSpaceType =
  | "park"
  | "library"
  | "museum"
  | "church"
  | "synagogue"
  | "quiet-space";

export type SafeSpace = {
  id: number;
  name: string;
  subTheme: string;
  type: SafeSpaceType;
  description: string;
  lat: number;
  lng: number;
};

// Backend request body
export type PlanRouteRequest = {
  start?: LatLng;
  end?: LatLng;
  startQuery?: string;
  endQuery?: string;
  avoidMode?: AvoidMode;
  safeSpaceTypes?: SafeSpaceType[];

  // Old single-stop field, kept so older code does not break
  stopSafeSpaceId?: number;

  // New multi-stop field.
  // The order of this array controls the route order:
  // start -> stop 1 -> stop 2 -> destination
  stopSafeSpaceIds?: number[];
};

// Resolved location returned by backend
export type ResolvedLocation = {
  input: string;
  resolvedName: string | null;
  lat: number;
  lng: number;
  snappedNodeId: number;
};

// Route payload returned by backend
export type PlannedRoute = {
  totalCost: number;
  totalLength: number;
  edgeIds: number[];
  nodeIds: number[];
  geojson: {
    type: "LineString";
    coordinates: [number, number][];
  };
};

// Stopover details returned by backend
export type RouteStopover = {
  id: number;
  name: string;
  type: SafeSpaceType;
  lat: number;
  lng: number;
};

// Full backend response
export type PlanRouteResponse = {
  start: ResolvedLocation;
  end: ResolvedLocation;
  route: PlannedRoute;
  safeSpaces: SafeSpace[];

  // Old single-stop response field
  stopover?: RouteStopover;

  // New multi-stop response field
  stopovers?: RouteStopover[];
};