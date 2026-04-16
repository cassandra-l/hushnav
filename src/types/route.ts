// Types for route planning request/response from the backend

export type RoutePreference = "quietest" | "balanced" | "fastest";

// Generic lat/lng coordinate used across the frontend
export type LatLng = {
  lat: number;
  lng: number;
};

// Backend request body
export type PlanRouteRequest = {
  startQuery: string;
  endQuery: string;
};

// Resolved location returned by backend
export type ResolvedLocation = {
  input: string;
  resolvedName: string | null;
  lat: number;
  lng: number;
  snappedNodeId: number;
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

// Full backend response
export type PlanRouteResponse = {
  start: ResolvedLocation;
  end: ResolvedLocation;
  route: PlannedRoute;
  safeSpaces: SafeSpace[];
};