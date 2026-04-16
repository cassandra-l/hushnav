import { useEffect, useMemo, useRef, useState } from "react";
import Map, {
  Marker,
  NavigationControl,
  Popup,
  Source,
  Layer,
  type MapRef,
} from "react-map-gl/mapbox";
import { MapPin, Navigation, TreePine, Book } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";
import type { PlanRouteResponse } from "../types/route";
import type { CrowdMapFeatureCollection } from "../types/noise-map";

// Safe space type used by the frontend.
// This assumes the backend now returns a safeSpaces array inside routeData.
// If your backend names these fields slightly differently, only this type
// and the property access below will need a small adjustment.
type SafeSpace = {
  id: string;
  name: string;
  description: string;
  type: "park" | "library";
  lat: number;
  lng: number;
};

// Props for map component
type RouteMapProps = {
  routeData: PlanRouteResponse | null;
  crowdMapData: CrowdMapFeatureCollection | null;
};

// Small reusable marker button for safe spaces.
// This keeps the map JSX cleaner and makes the AC styling easier to manage.
type SafeSpaceMarkerProps = {
  safeSpace: SafeSpace;
  onClick: () => void;
};

function SafeSpaceMarker({ safeSpace, onClick }: SafeSpaceMarkerProps) {
  const isPark = safeSpace.type === "park";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={safeSpace.name}
      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/90 bg-white/80 shadow-md"
    >
      {isPark ? (
        <TreePine size={18} className="text-[#5A9A8E]" />
      ) : (
        <Book size={18} className="text-[#5A9A8E]" />
      )}
    </button>
  );
}

export function RouteMap({ routeData, crowdMapData }: RouteMapProps) {
  const mapRef = useRef<MapRef | null>(null);

  // Tracks which safe space is currently selected so we can show its popup.
  const [selectedSafeSpace, setSelectedSafeSpace] = useState<SafeSpace | null>(
    null,
  );

  // Read Mapbox token from .env
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  // Default Melbourne CBD view before a route is loaded
  const melbourneCBD = {
    longitude: 144.9631,
    latitude: -37.8136,
    zoom: 14.5,
  };

  // Convert backend route geometry into a GeoJSON feature for Mapbox
  const routeGeoJson = useMemo(() => {
    if (
      !routeData ||
      routeData.route.geojson.type !== "LineString" ||
      !routeData.route.geojson.coordinates ||
      routeData.route.geojson.coordinates.length === 0
    ) {
      return null;
    }

    const feature = {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: routeData.route.geojson.coordinates,
      },
    };

    return feature;
  }, [routeData]);

  // Normalise safe spaces coming from the backend.
  // This gives us a consistent shape to use in markers and popups.
  const safeSpaces = useMemo<SafeSpace[]>(() => {
    if (!routeData || !("safeSpaces" in routeData)) {
      return [];
    }

    const rawSafeSpaces = (routeData as PlanRouteResponse & {
      safeSpaces?: Array<{
        id?: string;
        name?: string;
        description?: string;
        type?: string;
        lat?: number;
        lng?: number;
      }>;
    }).safeSpaces;

    if (!Array.isArray(rawSafeSpaces)) {
      return [];
    }

    return rawSafeSpaces
      .map((safeSpace, index) => {
        const type =
          safeSpace.type === "library" ? "library" : "park";

        if (
          typeof safeSpace.name !== "string" ||
          typeof safeSpace.description !== "string" ||
          typeof safeSpace.lat !== "number" ||
          typeof safeSpace.lng !== "number"
        ) {
          return null;
        }

        return {
          id: safeSpace.id ?? `safe-space-${index}`,
          name: safeSpace.name,
          description: safeSpace.description,
          type,
          lat: safeSpace.lat,
          lng: safeSpace.lng,
        };
      })
      .filter((safeSpace): safeSpace is SafeSpace => safeSpace !== null);
  }, [routeData]);

  // Clear any open safe space popup when the route changes or is removed.
  useEffect(() => {
    setSelectedSafeSpace(null);
  }, [routeData]);

  // Fit the map to the route bounds after data arrives
  useEffect(() => {
    if (!mapRef.current || !routeData) return;

    const coordinates = routeData.route.geojson.coordinates;
    if (!coordinates || coordinates.length === 0) return;

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

    const isDesktop = window.innerWidth >= 1024;

    mapRef.current.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding: isDesktop
          ? { top: 80, right: 80, bottom: 80, left: 420 }
          : { top: 80, right: 40, bottom: 140, left: 40 },
        duration: 1200,
      },
    );
  }, [routeData]);

  // Fallback if Mapbox token is missing
  if (!mapboxToken) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#DDEAE7] px-6 text-center text-[#6A7282]">
        Mapbox token not found. Add VITE_MAPBOX_TOKEN to your .env file.
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Map
        ref={mapRef}
        initialViewState={melbourneCBD}
        mapboxAccessToken={mapboxToken}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        {/* Map controls */}
        <NavigationControl position="top-right" />

        {/* Crowd / noise layer shown underneath the route */}
        {crowdMapData && (
          <Source id="crowd-map" type="geojson" data={crowdMapData}>
            <Layer
              id="crowd-map-layer"
              type="line"
              paint={{
                "line-color": [
                  "case",
                  ["==", ["get", "crowdCategory"], "high"],
                  "#E7C0C0",
                  "#D3D3D3",
                ],
                "line-width": [
                  "case",
                  ["==", ["get", "crowdCategory"], "high"],
                  2.5,
                  1.5,
                ],
                "line-opacity": 0.9,
              }}
              layout={{
                "line-join": "round",
                "line-cap": "round",
              }}
            />
          </Source>
        )}

        {/* Start marker */}
        {routeData && (
          <Marker longitude={routeData.start.lng} latitude={routeData.start.lat}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-[#D4B896] shadow-lg">
              <Navigation size={18} className="text-white" />
            </div>
          </Marker>
        )}

        {/* Destination marker */}
        {routeData && (
          <Marker longitude={routeData.end.lng} latitude={routeData.end.lat}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-[#7DB0A6] shadow-lg">
              <MapPin size={18} className="text-white" />
            </div>
          </Marker>
        )}

        {/* Safe space markers */}
        {safeSpaces.map((safeSpace) => (
          <Marker
            key={safeSpace.id}
            longitude={safeSpace.lng}
            latitude={safeSpace.lat}
            anchor="bottom"
          >
            <SafeSpaceMarker
              safeSpace={safeSpace}
              onClick={() => setSelectedSafeSpace(safeSpace)}
            />
          </Marker>
        ))}

        {/* Safe space popup shown when a safe space marker is clicked */}
        {selectedSafeSpace && (
          <Popup
            longitude={selectedSafeSpace.lng}
            latitude={selectedSafeSpace.lat}
            anchor="top"
            closeOnClick={false}
            onClose={() => setSelectedSafeSpace(null)}
            className="safe-space-popup"
          >
            <div className="min-w-[200px] bg-white text-[#1E2939]">
              <p className="text-sm font-semibold">{selectedSafeSpace.name}</p>
              <p className="mt-1 text-sm leading-5 text-[#1E2939]">
                {selectedSafeSpace.description}
              </p>
            </div>
          </Popup>
        )}

        {/* Route line */}
        {routeGeoJson && (
          <Source
            id="planned-route"
            type="geojson"
            data={routeGeoJson}
            key={JSON.stringify(routeData?.route.geojson.coordinates)}
          >
            {/* Glow */}
            <Layer
              id="planned-route-glow"
              type="line"
              paint={{
                "line-color": "#A9D1C8",
                "line-width": 10,
                "line-opacity": 0.35,
                "line-blur": 1.2,
              }}
              layout={{
                "line-join": "round",
                "line-cap": "round",
              }}
            />

            {/* Main line */}
            <Layer
              id="planned-route-line"
              type="line"
              paint={{
                "line-color": "#7DB0A6",
                "line-width": 6,
                "line-opacity": 0.95,
              }}
              layout={{
                "line-join": "round",
                "line-cap": "round",
              }}
            />
          </Source>
        )}
      </Map>
    </div>
  );
}