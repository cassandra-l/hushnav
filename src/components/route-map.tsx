import Map, { Marker, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Props for the map component
type RouteMapProps = {
  startLocation?: string;
  destination?: string;
};

export function RouteMap({ startLocation, destination }: RouteMapProps) {
  // Read the Mapbox token from the Vite environment file
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  // Temporary default centre point for Melbourne CBD
  // Later, this can be updated based on real route coordinates from the backend
  const melbourneCBD = {
    longitude: 144.9631,
    latitude: -37.8136,
    zoom: 13,
  };

  // If no token is found, show a friendly message instead of crashing
  if (!mapboxToken) {
    return (
      <div className="h-72 rounded-2xl bg-[#DDEAE7] border border-[#C7D8D3] flex items-center justify-center text-center px-6 text-[#6A7282]">
        Mapbox token not found. Add VITE_MAPBOX_TOKEN to your .env file.
      </div>
    );
  }

  return (
    <div className="h-72 w-full rounded-2xl overflow-hidden border border-[#C7D8D3]">
      <Map
        initialViewState={melbourneCBD}
        mapboxAccessToken={mapboxToken}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        {/* Zoom and compass controls */}
        <NavigationControl position="top-right" />

        {/* Temporary marker for Melbourne CBD */}
        {/* Later you can replace this with start/destination coordinates */}
        <Marker longitude={144.9631} latitude={-37.8136} color="#1E2939" />
      </Map>
    </div>
  );
}