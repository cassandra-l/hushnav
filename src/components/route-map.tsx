import { useEffect, useMemo, useRef } from "react";
import Map, {
  Marker,
  NavigationControl,
  Source,
  Layer,
  type MapRef,
} from "react-map-gl/mapbox";
import { MapPin, Navigation, LocateFixed } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";
import type { PlanRouteResponse } from "../types/route";

type UserLocation = {
  lng: number;
  lat: number;
};

// Props for map component
type RouteMapProps = {
  routeData: PlanRouteResponse | null;
  userLocation: UserLocation | null;
};

export function RouteMap({ routeData, userLocation }: RouteMapProps) {
  const mapRef = useRef<MapRef | null>(null);

  // Read Mapbox token from .env
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  // Default Melbourne CBD view before a route is loaded
  const melbourneCBD = {
    longitude: 144.9631,
    latitude: -37.8136,
    zoom: 14.5,
  };

  // Convert backend route geometry into a GeoJSON feature for Mapbox
  // This uses the older working backend shape: routeData.route.geojson.coordinates
  const routeGeoJson = useMemo(() => {
    if (
      !routeData ||
      !routeData.route?.geojson ||
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

  // Fit the map to the route bounds after data arrives
  useEffect(() => {
    if (!mapRef.current || !routeData?.route?.geojson?.coordinates?.length) {
      return;
    }

    const coordinates = routeData.route.geojson.coordinates;

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

  // If there is no route yet, center on the user's location
  useEffect(() => {
    if (
      !mapRef.current ||
      routeData?.route?.geojson?.coordinates?.length ||
      !userLocation
    ) {
      return;
    }

    mapRef.current.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 15,
      duration: 1200,
    });
  }, [userLocation, routeData]);

  // Recenter button action
  const handleRecenterToUser = () => {
    if (!mapRef.current || !userLocation) {
      return;
    }

    mapRef.current.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 16,
      duration: 1000,
    });
  };

  // Fallback if Mapbox token is missing
  if (!mapboxToken) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#DDEAE7] px-6 text-center text-[#6A7282]">
        Mapbox token not found. Add VITE_MAPBOX_TOKEN to your .env file.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        initialViewState={melbourneCBD}
        mapboxAccessToken={mapboxToken}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" />

        {/* User location marker */}
        {userLocation && (
          <Marker
            longitude={userLocation.lng}
            latitude={userLocation.lat}
            anchor="center"
          >
            <div className="flex items-center justify-center">
              <div className="h-4 w-4 rounded-full border-2 border-white bg-[#2E90FA] shadow-md ring-4 ring-[#2E90FA]/25" />
            </div>
          </Marker>
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

        {/* Route line */}
        {routeGeoJson && (
          <Source
            id="planned-route"
            type="geojson"
            data={routeGeoJson}
            key={JSON.stringify(routeData?.route?.geojson?.coordinates)}
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

      {/* Recenter button */}
      {userLocation && (
        <button
          type="button"
          onClick={handleRecenterToUser}
          aria-label="Recenter to my location"
          className="absolute bottom-20 right-6 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-[#5A9A8E] shadow-lg transition hover:bg-[#4C877C]"
        >
          <LocateFixed size={20} className="text-white" />
        </button>
      )}
    </div>
  );
}