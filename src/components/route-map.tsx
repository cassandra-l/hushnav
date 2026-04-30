import { useEffect, useMemo, useRef, useState } from "react";
import Map, {
  Marker,
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
} from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";
import type { PlanRouteResponse, SafeSpace } from "../types/route";
import type { CrowdMapFeatureCollection } from "../types/noise-map";

type RouteMapProps = {
  routeData: PlanRouteResponse | null;
  crowdMapData: CrowdMapFeatureCollection | null;
  allSafeSpaces: SafeSpace[];
  isNavigationActive?: boolean;
  selectedSafeSpaceFromPanel?: SafeSpace | null;
};

type SafeSpaceMarkerProps = {
  safeSpace: SafeSpace;
  onClick: () => void;
};

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

function SafeSpaceMarker({ safeSpace, onClick }: SafeSpaceMarkerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/90 bg-white/80 shadow-md"
    >
      {renderSafeSpaceIcon(safeSpace.type)}
    </button>
  );
}

export function RouteMap({
  routeData,
  crowdMapData,
  allSafeSpaces,
  isNavigationActive = false,
  selectedSafeSpaceFromPanel = null,
}: RouteMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [selectedSafeSpace, setSelectedSafeSpace] =
    useState<SafeSpace | null>(null);

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  const melbourneCBD = {
    longitude: 144.9631,
    latitude: -37.8136,
    zoom: 14.5,
  };

  const routeGeoJson = useMemo(() => {
    if (!routeData) return null;

    return {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: routeData.route.geojson.coordinates,
      },
    };
  }, [routeData]);

  const safeSpaces = routeData ? routeData.safeSpaces : allSafeSpaces;

  // Fit full route in preview mode.
  useEffect(() => {
    if (!mapRef.current || !routeData || isNavigationActive) return;

    const coords = routeData.route.geojson.coordinates;
    if (!coords?.length) return;

    let minLng = coords[0][0];
    let minLat = coords[0][1];
    let maxLng = coords[0][0];
    let maxLat = coords[0][1];

    for (const [lng, lat] of coords) {
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
      { padding: 80, duration: 1200 },
    );
  }, [routeData, isNavigationActive]);

  // Navigation mode: zoom into the start location.
  useEffect(() => {
    if (!mapRef.current || !routeData || !isNavigationActive) return;

    mapRef.current.flyTo({
      center: [routeData.start.lng, routeData.start.lat],
      zoom: 18.5,
      pitch: 60,
      bearing: 0,
      duration: 1200,
    });
  }, [isNavigationActive, routeData]);

  // When a safe space is selected from the sidebar/bottom sheet,
  // move the map to it and open the same popup used by map markers.
  useEffect(() => {
    if (!mapRef.current || !selectedSafeSpaceFromPanel) return;

    mapRef.current.flyTo({
      center: [
        selectedSafeSpaceFromPanel.lng,
        selectedSafeSpaceFromPanel.lat,
      ],
      zoom: 18,
      duration: 800,
    });

    const timer = window.setTimeout(() => {
      setSelectedSafeSpace(selectedSafeSpaceFromPanel);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [selectedSafeSpaceFromPanel]);

  if (!mapboxToken) {
    return <div>Missing Mapbox Token</div>;
  }

  return (
    <div className="h-full w-full">
      <Map
        ref={mapRef}
        initialViewState={melbourneCBD}
        mapboxAccessToken={mapboxToken}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        {/* Crowd / noise road layer. High-crowd roads are shown in red. */}
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

        {routeGeoJson && (
          <Source id="route" type="geojson" data={routeGeoJson}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                "line-color": "#7DB0A6",
                "line-width": 6,
              }}
            />
          </Source>
        )}

        {routeData && (
          <>
            <Marker
              longitude={routeData.start.lng}
              latitude={routeData.start.lat}
              anchor="bottom"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-[#D4B896] shadow-lg">
                <Navigation size={22} className="text-white" />
              </div>
            </Marker>

            <Marker
              longitude={routeData.end.lng}
              latitude={routeData.end.lat}
              anchor="bottom"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-[#7DB0A6] shadow-lg">
                <MapPin size={22} className="text-white" />
              </div>
            </Marker>
          </>
        )}

        {safeSpaces.map((safeSpace) => (
          <Marker
            key={safeSpace.id}
            longitude={safeSpace.lng}
            latitude={safeSpace.lat}
          >
            <SafeSpaceMarker
              safeSpace={safeSpace}
              onClick={() => setSelectedSafeSpace(safeSpace)}
            />
          </Marker>
        ))}

        {selectedSafeSpace && (
          <Popup
            longitude={selectedSafeSpace.lng}
            latitude={selectedSafeSpace.lat}
            anchor="top"
            closeOnClick={false}
            onClose={() => setSelectedSafeSpace(null)}
            offset={10}
            maxWidth="210px"
            className="safe-space-popup"
          >
            <div className="w-[180px] max-w-[calc(100vw-96px)] rounded-2xl bg-white p-3 text-left text-[#1E2939] sm:w-[220px] sm:p-4">
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/90 bg-[#E8F4F1] text-[#5A9A8E] shadow-sm sm:h-8 sm:w-8">
                {renderSafeSpaceIcon(selectedSafeSpace.type)}
              </div>

              <h3 className="text-sm font-semibold leading-tight text-[#1E2939] sm:text-base">
                {selectedSafeSpace.name}
              </h3>

              <p className="mt-1 text-[11px] font-medium text-[#5A9A8E] sm:text-xs">
                {selectedSafeSpace.subTheme}
              </p>

              <p className="mt-2 text-xs leading-snug text-[#4A5565] sm:text-sm">
                {selectedSafeSpace.description}
              </p>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}