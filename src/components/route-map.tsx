import { useEffect, useMemo, useRef, useState } from "react";
import ReactMap, {
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

type UserLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
};

type NoiseReportPin = {
  id: number;
  lat: number;
  lng: number;
  noiseLevel: number | null;
  createdAt: string;
};

type RouteMapProps = {
  routeData: PlanRouteResponse | null;
  crowdMapData: CrowdMapFeatureCollection | null;
  noiseReportPins: NoiseReportPin[];
  focusedNoiseReportPin: NoiseReportPin | null;
  allSafeSpaces: SafeSpace[];
  isNavigationActive?: boolean;
  selectedSafeSpaceFromPanel?: SafeSpace | null;
  userLocation?: UserLocation | null;
  onMapCenterChange?: (center: { lat: number; lng: number }) => void;
};

type SafeSpaceMarkerProps = {
  safeSpace: SafeSpace;
  onClick: () => void;
  stopNumber?: number;
  isSelectedStop?: boolean;
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

function SafeSpaceMarker({
  safeSpace,
  onClick,
  stopNumber,
  isSelectedStop = false,
}: SafeSpaceMarkerProps) {
  // Selected stopovers are shown as numbered markers.
  // This makes the route order clearer: Stop 1 -> Stop 2 -> Stop 3.
  if (isSelectedStop && stopNumber !== undefined) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="relative flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-[#5A9A8E] text-white shadow-lg"
        aria-label={`Stop ${stopNumber}: ${safeSpace.name}`}
      >
        <span className="text-base font-bold">{stopNumber}</span>

        <span className="absolute -bottom-6 whitespace-nowrap rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-[#1E2939] shadow-sm">
          Stop {stopNumber}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/90 bg-white/80 shadow-md"
      aria-label={safeSpace.name}
    >
      {renderSafeSpaceIcon(safeSpace.type)}
    </button>
  );
}

function UserLocationMarker() {
  return (
    <div className="relative flex h-6 w-6 items-center justify-center">
      {/* Outer pulse/radius circle */}
      <div className="absolute h-12 w-12 rounded-full bg-[#5A9A8E]/20" />

      {/* Inner soft circle */}
      <div className="absolute h-8 w-8 rounded-full bg-[#5A9A8E]/30" />

      {/* Main live location dot */}
      <div className="relative h-4 w-4 rounded-full border-2 border-white bg-[#5A9A8E] shadow-md" />
    </div>
  );
}

function NoiseReportMarker({
  pin,
  nowMs,
}: {
  pin: NoiseReportPin;
  nowMs: number;
}) {
  const isVeryHighNoise = pin.noiseLevel !== null && pin.noiseLevel >= 75;
  const isRecent =
    nowMs - new Date(pin.createdAt).getTime() < 60 * 60 * 1000;
  const markerColor = isVeryHighNoise ? "#B84732" : "#C7785A";

  return (
    <div className="relative flex h-12 w-12 items-center justify-center">
      <div
        className={`absolute h-12 w-12 rounded-full ${isRecent ? "animate-pulse" : ""
          }`}
        style={{ backgroundColor: `${markerColor}33` }}
      />
      <div
        className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-white shadow-lg"
        style={{ backgroundColor: markerColor }}
      >
        <MapPin size={20} className="text-white" />
      </div>
    </div>
  );
}

export function RouteMap({
  routeData,
  crowdMapData,
  noiseReportPins,
  focusedNoiseReportPin,
  allSafeSpaces,
  isNavigationActive = false,
  selectedSafeSpaceFromPanel = null,
  userLocation = null,
  onMapCenterChange,
}: RouteMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedSafeSpace, setSelectedSafeSpace] =
    useState<SafeSpace | null>(null);

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  const [nowMs] = useState(() => Date.now());

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

  // Selected stopovers returned by the backend.
  // These are the stops the user has added to the route.
  // useMemo prevents a new empty array being created on every render.
  const selectedStopovers = useMemo(() => {
    return routeData?.stopovers ?? [];
  }, [routeData?.stopovers]);

  // Map each selected safe space id to its stop number.
  // Example: { 12 -> 1, 19 -> 2 }
  const selectedStopNumberById = useMemo(() => {
    const stopMap = new Map<number, number>();

    selectedStopovers.forEach((stopover, index) => {
      stopMap.set(stopover.id, index + 1);
    });

    return stopMap;
  }, [selectedStopovers]);

  const safeSpaces = routeData ? routeData.safeSpaces : allSafeSpaces;

  // Preview mode: fit the full route in view once the map is ready.
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !routeData || isNavigationActive) {
      return;
    }

    const coords = routeData.route.geojson.coordinates;
    if (!coords?.length) return;

    let minLng = coords[0][0];
    let minLat = coords[0][1];
    let maxLng = coords[0][0];
    let maxLat = coords[0][1];

    const includePoint = (lng: number, lat: number) => {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    };

    for (const [lng, lat] of coords) {
      includePoint(lng, lat);
    }

    includePoint(routeData.start.lng, routeData.start.lat);
    includePoint(routeData.end.lng, routeData.end.lat);

    const hasMultipleStops = selectedStopovers.length > 1;

    mapRef.current.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding: hasMultipleStops ? 120 : 80,
        duration: 1200,
      },
    );
  }, [routeData, isNavigationActive, isMapLoaded, selectedStopovers.length]);

  // When Emily taps "Use Current Location", move the map to her location.
  // Only in search mode — skip once a route is loaded so preview fit is preserved.
  useEffect(() => {
    if (
      !isMapLoaded ||
      !mapRef.current ||
      !userLocation ||
      isNavigationActive ||
      routeData
    ) {
      return;
    }

    mapRef.current.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 17,
      pitch: 0,
      bearing: 0,
      duration: 1000,
    });
  }, [userLocation, isNavigationActive, routeData, isMapLoaded]);

  useEffect(() => {
    if (!mapRef.current || !focusedNoiseReportPin) return;

    mapRef.current.flyTo({
      center: [focusedNoiseReportPin.lng, focusedNoiseReportPin.lat],
      zoom: 17,
      pitch: 0,
      bearing: 0,
      duration: 900,
    });
  }, [focusedNoiseReportPin]);

  // Navigation mode: always zoom into the route's actual start point.
  // This could be the user's live location OR a manually entered start,
  // depending on what was used when the route was planned.
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !routeData || !isNavigationActive) {
      return;
    }

    mapRef.current.flyTo({
      center: [routeData.start.lng, routeData.start.lat],
      zoom: 18.5,
      pitch: 60,
      bearing: 0,
      duration: 1200,
    });
  }, [isNavigationActive, routeData, isMapLoaded]);

  // Keep following the live location only when the planned route actually starts
  // from the user's current location.
  useEffect(() => {
    if (!mapRef.current || !userLocation || !routeData || !isNavigationActive) {
      return;
    }

    const routeStartIsLiveLocation =
      Math.abs(routeData.start.lat - userLocation.lat) < 0.0005 &&
      Math.abs(routeData.start.lng - userLocation.lng) < 0.0005;

    if (!routeStartIsLiveLocation) return;

    mapRef.current.easeTo({
      center: [userLocation.lng, userLocation.lat],
      duration: 600,
    });
  }, [userLocation, routeData, isNavigationActive]);

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
      <ReactMap
        ref={mapRef}
        initialViewState={melbourneCBD}
        mapboxAccessToken={mapboxToken}
        mapStyle="mapbox://styles/mapbox/streets-v12"

        onMoveEnd={(event) => {
          const center = event.target.getCenter();
          onMapCenterChange?.({
            lat: center.lat,
            lng: center.lng,
          });
        }}

        onLoad={() => setIsMapLoaded(true)}
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
            {/* Main route line */}
            <Layer
              id="route-line"
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

            {/* Direction arrows on the route line */}
            <Layer
              id="route-direction-arrows"
              type="symbol"
              layout={{
                "symbol-placement": "line",
                "symbol-spacing": 80,
                "text-field": "➜",
                "text-size": 18,
                "text-keep-upright": false,
                "text-rotation-alignment": "map",
                "text-pitch-alignment": "map",
                "symbol-z-order": "source",
              }}
              paint={{
                "text-color": "#1F6F64",
                "text-halo-color": "#FFFFFF",
                "text-halo-width": 1.5,
              }}
            />
          </Source>
        )}

        {/* Live user location marker */}
        {userLocation && (
          <Marker
            longitude={userLocation.lng}
            latitude={userLocation.lat}
            anchor="center"
          >
            <UserLocationMarker />
          </Marker>
        )}

        {noiseReportPins.map((pin) => (
          <Marker
            key={pin.id}
            longitude={pin.lng}
            latitude={pin.lat}
            anchor="bottom"
          >
            <NoiseReportMarker pin={pin} nowMs={nowMs} />
          </Marker>
        ))}

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

        {safeSpaces.map((safeSpace) => {
          const stopNumber = selectedStopNumberById.get(safeSpace.id);
          const isSelectedStop = stopNumber !== undefined;

          return (
            <Marker
              key={safeSpace.id}
              longitude={safeSpace.lng}
              latitude={safeSpace.lat}
              anchor="center"
            >
              <SafeSpaceMarker
                safeSpace={safeSpace}
                stopNumber={stopNumber}
                isSelectedStop={isSelectedStop}
                onClick={() => setSelectedSafeSpace(safeSpace)}
              />
            </Marker>
          );
        })}

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
            <div className="max-h-[38vh] w-[180px] max-w-[calc(100vw-96px)] overflow-y-auto rounded-2xl bg-white p-3 text-left text-[#1E2939] sm:w-[220px] sm:p-4">
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

              <button
                type="button"
                onClick={() => setSelectedSafeSpace(null)}
                className="mt-3 w-full rounded-xl border border-[#DCE7E3] bg-white py-2 text-xs font-medium text-[#5A9A8E]"
              >
                Close
              </button>
            </div>
          </Popup>
        )}
      </ReactMap>
    </div>
  );
}
