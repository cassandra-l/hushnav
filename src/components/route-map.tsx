import { useEffect, useMemo, useRef, useState } from "react";
import Map, {
  Marker,
  NavigationControl,
  Popup,
  Source,
  Layer,
  type MapRef,
} from "react-map-gl/mapbox";
import {
  MapPin,
  Navigation,
  TreePine,
  Book,
  Landmark,
  Church,
  Building2,
  X,
} from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";
import type { PlanRouteResponse, SafeSpace } from "../types/route";
import type { CrowdMapFeatureCollection } from "../types/noise-map";

// Props for map component
type RouteMapProps = {
  routeData: PlanRouteResponse | null;
  crowdMapData: CrowdMapFeatureCollection | null;
  allSafeSpaces: SafeSpace[];
};

// Reusable safe space marker button shown on the map
type SafeSpaceMarkerProps = {
  safeSpace: SafeSpace;
  onClick: () => void;
};

// Returns the correct Lucide icon for each safe space type
function renderSafeSpaceIcon(type: SafeSpace["type"]) {
  switch (type) {
    case "park":
      return <TreePine size={18} className="text-[#5A9A8E]" />;
    case "library":
      return <Book size={18} className="text-[#5A9A8E]" />;
    case "museum":
      return <Landmark size={18} className="text-[#5A9A8E]" />;
    case "church":
      return <Church size={18} className="text-[#5A9A8E]" />;
    case "synagogue":
      return <Building2 size={18} className="text-[#5A9A8E]" />;
    default:
      return <MapPin size={18} className="text-[#5A9A8E]" />;
  }
}

// Small reusable marker UI so all safe space markers stay visually consistent
function SafeSpaceMarker({ safeSpace, onClick }: SafeSpaceMarkerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={safeSpace.name}
      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/90 bg-white/80 shadow-md transition-transform hover:scale-105"
    >
      {renderSafeSpaceIcon(safeSpace.type)}
    </button>
  );
}

export function RouteMap({
  routeData,
  crowdMapData,
  allSafeSpaces,
}: RouteMapProps) {
  const mapRef = useRef<MapRef | null>(null);

  // Tracks which safe space is currently selected so a popup can be shown
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

    return {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: routeData.route.geojson.coordinates,
      },
    };
  }, [routeData]);

  // Before a route is selected, show all safe spaces.
  // After a route is selected, only show safe spaces that belong to that route.
  const safeSpaces = routeData ? routeData.safeSpaces : allSafeSpaces;

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
          : { top: 80, right: 40, bottom: 170, left: 40 },
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

        {/* Crowd / noise line layer */}
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
          <Marker
            longitude={routeData.start.lng}
            latitude={routeData.start.lat}
            anchor="bottom"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-[#D4B896] shadow-lg">
              <Navigation size={18} className="text-white" />
            </div>
          </Marker>
        )}

        {/* Destination marker */}
        {routeData && (
          <Marker
            longitude={routeData.end.lng}
            latitude={routeData.end.lat}
            anchor="bottom"
          >
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

        {/* Safe space popup shown when a marker is clicked */}
        {selectedSafeSpace && (
          <Popup
            longitude={selectedSafeSpace.lng}
            latitude={selectedSafeSpace.lat}
            anchor="top"
            closeOnClick={false}
            closeButton={false}
            onClose={() => setSelectedSafeSpace(null)}
            offset={14}
            maxWidth="220px"
          >
            <div className="relative min-w-[170px] max-w-[190px] rounded-2xl bg-white p-1 text-[#1E2939]">
              <button
                type="button"
                onClick={() => setSelectedSafeSpace(null)}
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full text-[#6A7282] hover:bg-[#F4F7F6]"
                aria-label="Close safe space popup"
              >
                <X size={14} />
              </button>

              <div className="pr-7">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/90 bg-white/80 shadow-sm">
                  {renderSafeSpaceIcon(selectedSafeSpace.type)}
                </div>

                <h3 className="text-[15px] font-semibold leading-5 text-[#1E2939]">
                  {selectedSafeSpace.name}
                </h3>

                <p className="mt-1 text-[11px] font-medium text-[#5A9A8E]">
                  {selectedSafeSpace.subTheme}
                </p>

                <p className="mt-2 text-[13px] leading-5 text-[#4A5565]">
                  {selectedSafeSpace.description}
                </p>
              </div>
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
            {/* Glow line behind the main route */}
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

            {/* Main route line */}
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