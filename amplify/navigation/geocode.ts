import axios from "axios";

export type GeocodeResult = {
  lat: number;
  lng: number;
  displayName: string;
};

export async function geocodePlace(query: string): Promise<GeocodeResult> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    throw new Error("Query is empty.");
  }

  const response = await axios.get(
    "https://nominatim.openstreetmap.org/search",
    {
      params: {
        q: trimmedQuery,
        format: "jsonv2",
        limit: 1,
      },
      headers: {
        "User-Agent": "hush-nav-backend/1.0",
      },
    }
  );

  const results = response.data;

  if (!Array.isArray(results) || results.length === 0) {
    throw new Error("No geocoding result found.");
  }

  const first = results[0];

  return {
    lat: Number(first.lat),
    lng: Number(first.lon),
    displayName: first.display_name,
  };
}