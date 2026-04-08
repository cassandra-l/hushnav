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

// Props for map component
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

    console.log("Route GeoJSON feature:", feature);
    console.log(
      "Route coordinate count:",
      routeData.route.geojson.coordinates.length
    );

    return feature;
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

    // Extra left padding on desktop so the route is not hidden behind the sidebar
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
      }
    );
  }, [routeData]);

  // Helpful debug logs
  useEffect(() => {
    if (routeData) {
      console.log("Start resolved name:", routeData.start.resolvedName);
      console.log("End resolved name:", routeData.end.resolvedName);
      console.log("Route length:", routeData.route.totalLength);
      console.log("Route coordinates:", routeData.route.geojson.coordinates);
    }
  }, [routeData]);

  // Fallback if Mapbox token is missing
  if (!mapboxToken) {
    return (
      <div className="h-full w-full bg-[#DDEAE7] flex items-center justify-center text-center px-6 text-[#6A7282]">
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
          <Source
            id="planned-route"
            type="geojson"
            data={routeGeoJson}
            key={JSON.stringify(routeData?.route.geojson.coordinates)}
          >
            {/* Soft glow under the route */}
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

            {/* Main visible route line */}
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

        {/* Optional mock quiet-space markers for presentation/demo feel */}
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