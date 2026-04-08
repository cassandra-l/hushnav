import { useEffect, useMemo, useRef } from "react";
import Map, {
  Marker,
  NavigationControl,
  Source,
  Layer,
  type MapRef,
} from "react-map-gl/mapbox";
import { MapPin, Navigation, Trees, Building2 } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";
import type { PlanRouteResponse } from "../types/route";

// Props for the map component
type RouteMapProps = {
  routeData: PlanRouteResponse | null;
};

export function RouteMap({ routeData }: RouteMapProps) {
  const mapRef = useRef<MapRef | null>(null);

  // Read Mapbox token from .env
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  // Default Melbourne CBD view before a route is loaded
  const melbourneCBD = {
    longitude: 144.9631,
    latitude: -37.8136,
    zoom: 15,
  };

  // Build GeoJSON line feature from backend route coordinates
  const routeGeoJson = useMemo(() => {
    if (
      !routeData ||
      routeData.route.geojson.type !== "LineString" ||
      routeData.route.geojson.coordinates.length === 0
    ) {
      return null;
    }

    return {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: routeData.route.geojson.coordinates,
      },
    };
  }, [routeData]);

  // Fit the map to the route when route data arrives
  useEffect(() => {
    if (!mapRef.current || !routeData) return;

    const coordinates = routeData.route.geojson.coordinates;

    if (!coordinates.length) return;

    let minLng = coordinates[0][0];
    let minLat = coordinates[0][1];
    let maxLng = coordinates[0][0];
    let maxLat = coordinates[0][1];

    for (const [lng, lat] of coordinates) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }

    mapRef.current.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding: 90,
        duration: 1200,
      }
    );
  }, [routeData]);

  // Friendly fallback if the token is missing
  if (!mapboxToken) {
    return (
      <div className="h-screen w-full bg-[#DDEAE7] flex items-center justify-center text-center px-6 text-[#6A7282]">
        Mapbox token not found. Add VITE_MAPBOX_TOKEN to your .env file.
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <Map
        ref={mapRef}
        initialViewState={melbourneCBD}
        mapboxAccessToken={mapboxToken}
        mapStyle="mapbox://styles/mapbox/light-v11"
      >
        {/* Standard map controls */}
        <NavigationControl position="top-right" />

        {/* Start marker */}
        {routeData && (
          <Marker longitude={routeData.start.lng} latitude={routeData.start.lat}>
            <div className="w-12 h-12 rounded-full bg-[#D4B896] border-4 border-white shadow-lg flex items-center justify-center">
              <Navigation size={18} className="text-white" />
            </div>
          </Marker>
        )}

        {/* Destination marker */}
        {routeData && (
          <Marker longitude={routeData.end.lng} latitude={routeData.end.lat}>
            <div className="w-12 h-12 rounded-full bg-[#7DB0A6] border-4 border-white shadow-lg flex items-center justify-center">
              <MapPin size={18} className="text-white" />
            </div>
          </Marker>
        )}

        {/* Quiet route line */}
        {routeGeoJson && (
          <Source id="planned-route" type="geojson" data={routeGeoJson}>
            <Layer
              id="planned-route-line"
              type="line"
              paint={{
                "line-color": "#7DB0A6",
                "line-width": 6,
                "line-opacity": 0.9,
                "line-blur": 0.2,
              }}
            />
          </Source>
        )}

        {/* Optional small mock quiet-space markers to make the map feel richer.
            Remove or replace these later with real quiet-space data. */}
        <Marker longitude={144.9639} latitude={-37.8102}>
          <div className="w-8 h-8 rounded-full bg-white border-2 border-[#E8EEEC] shadow-md flex items-center justify-center">
            <Trees size={14} className="text-[#7DB0A6]" />
          </div>
        </Marker>

        <Marker longitude={144.9647} latitude={-37.8105}>
          <div className="w-8 h-8 rounded-full bg-white border-2 border-[#E8EEEC] shadow-md flex items-center justify-center">
            <Building2 size={14} className="text-[#7DB0A6]" />
          </div>
        </Marker>
      </Map>
    </div>
  );
}