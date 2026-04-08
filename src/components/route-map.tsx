import Map, {
  Marker,
  NavigationControl,
  Source,
  Layer,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { PlanRouteResponse } from "../types/route";

// Props passed from the page into the map component
type RouteMapProps = {
  routeData: PlanRouteResponse | null;
};

export function RouteMap({ routeData }: RouteMapProps) {
  // Read Mapbox token from the Vite environment file
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  // Default map view centred on Melbourne CBD
  // This is shown before a route is planned
  const melbourneCBD = {
    longitude: 144.9631,
    latitude: -37.8136,
    zoom: 13,
  };

  // If the token is missing, show a friendly fallback instead of crashing
  if (!mapboxToken) {
    return (
      <div className="h-[420px] rounded-2xl bg-[#DDEAE7] border border-[#C7D8D3] flex items-center justify-center text-center px-6 text-[#6A7282]">
        Mapbox token not found. Add VITE_MAPBOX_TOKEN to your .env file.
      </div>
    );
  }

  // Convert backend coordinates into GeoJSON format for Mapbox
  // The backend is already returning GeoJSON-style coordinates for the LineString
  const routeGeoJson =
    routeData &&
    routeData.route.geojson.type === "LineString" &&
    routeData.route.geojson.coordinates.length > 0
      ? {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "LineString" as const,
            coordinates: routeData.route.geojson.coordinates,
          },
        }
      : null;

  // Use the route start position if available, otherwise default to Melbourne CBD
  const initialViewState = routeData
    ? {
        longitude: routeData.start.lng,
        latitude: routeData.start.lat,
        zoom: 14,
      }
    : melbourneCBD;

  return (
    <div className="h-[420px] w-full rounded-2xl overflow-hidden border border-[#C7D8D3]">
      <Map
        initialViewState={initialViewState}
        mapboxAccessToken={mapboxToken}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        {/* Standard map controls */}
        <NavigationControl position="top-right" />

        {/* Start marker */}
        {routeData && (
          <Marker longitude={routeData.start.lng} latitude={routeData.start.lat}>
            <div className="w-4 h-4 rounded-full bg-[#1E2939] border-2 border-white shadow-md" />
          </Marker>
        )}

        {/* End marker */}
        {routeData && (
          <Marker longitude={routeData.end.lng} latitude={routeData.end.lat}>
            <div className="w-4 h-4 rounded-full bg-[#7DB0A6] border-2 border-white shadow-md" />
          </Marker>
        )}

        {/* Route line */}
        {routeGeoJson && (
          <Source id="planned-route" type="geojson" data={routeGeoJson}>
            <Layer
              id="planned-route-line"
              type="line"
              paint={{
                "line-color": "#1E2939",
                "line-width": 5,
                "line-opacity": 0.85,
              }}
            />
          </Source>
        )}
      </Map>
    </div>
  );
}