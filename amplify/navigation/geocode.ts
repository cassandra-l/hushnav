import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export type GeocodeResult = {
  lat: number;
  lng: number;
  displayName: string;
};

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;

if (!MAPBOX_TOKEN) {
  throw new Error("MAPBOX_TOKEN is not set.");
}

export async function geocodePlace(query: string): Promise<GeocodeResult> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    throw new Error("Query is empty.");
  }

  const response = await axios.get(
    "https://api.mapbox.com/search/geocode/v6/forward",
    {
      params: {
        q: trimmedQuery,
        access_token: MAPBOX_TOKEN,
        limit: 1,
        country: "au",
        bbox: "144.92,-37.835,145.01,-37.79",
        language: "en",
        types: "address,street,place,locality,neighborhood",
      },
    }
  );

  const features = response.data?.features;

  if (!Array.isArray(features) || features.length === 0) {
    throw new Error("No geocoding result found.");
  }

  const first = features[0];
  const coordinates = first?.geometry?.coordinates;

  if (
    !Array.isArray(coordinates) ||
    coordinates.length < 2 ||
    typeof coordinates[0] !== "number" ||
    typeof coordinates[1] !== "number"
  ) {
    throw new Error("Invalid Mapbox geocoding response.");
  }

  return {
    lng: coordinates[0],
    lat: coordinates[1],
    displayName:
      first.properties?.full_address ||
      first.properties?.name ||
      first.place_name ||
      trimmedQuery,
  };
}