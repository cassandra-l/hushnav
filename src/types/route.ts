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
  resolvedName: string;
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
    coordinates: number[][];
  };
};

// Full backend response
export type PlanRouteResponse = {
  start: ResolvedLocation;
  end: ResolvedLocation;
  route: PlannedRoute;
};