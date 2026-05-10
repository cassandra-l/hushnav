// Standardised suggestion shape used by the UI
export type LocationSuggestion = {
  id: string;
  place_name: string;
  center?: [number, number];
};

// Used to bias Photon results toward Melbourne CBD
const CBD_CENTER = {
  lng: 144.9631,
  lat: -37.8136,
};

// A wider Melbourne inner bounding box so nearby areas like Docklands,
// Southbank, and East Melbourne can still appear in suggestions
const MELBOURNE_INNER_BBOX = "144.88,-37.86,145.05,-37.77";

// Photon API feature shape
type PhotonFeature = {
  geometry?: {
    type?: string;
    coordinates?: [number, number];
  };
  properties?: {
    osm_id?: number | string;
    osm_type?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    suburb?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
  };
};

// Photon API response shape
type PhotonResponse = {
  features?: PhotonFeature[];
};

// Builds a readable label from Photon feature properties
function buildPhotonLabel(feature: PhotonFeature): string {
  const props = feature.properties ?? {};

  const addressPart = [props.housenumber, props.street]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ")
    .trim();

  const firstLine = [props.name, addressPart].filter((part): part is string =>
    Boolean(part && part.trim()),
  );

  const secondLine = [
    props.suburb || props.city || props.district,
    props.state,
    props.postcode,
  ].filter((part): part is string => Boolean(part && part.trim()));

  const parts = [...firstLine, ...secondLine];

  const uniqueParts = Array.from(
    new Set(parts.map((part) => part.trim())),
  ).filter((part) => part.length > 0);

  return uniqueParts.join(", ");
}

// Converts a Photon feature into our app's LocationSuggestion format
function normalisePhotonFeature(
  feature: PhotonFeature,
  index: number,
): LocationSuggestion | null {
  const coordinates = feature.geometry?.coordinates;
  const props = feature.properties ?? {};

  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return null;
  }

  const [lng, lat] = coordinates;

  if (typeof lng !== "number" || typeof lat !== "number") {
    return null;
  }

  const label = buildPhotonLabel(feature);

  if (!label) {
    return null;
  }

  const idBase =
    props.osm_id !== undefined
      ? `${props.osm_type ?? "feature"}-${String(props.osm_id)}`
      : `${label}-${index}`;

  return {
    id: `${idBase}-${index}`,
    place_name: label,
    center: [lng, lat],
  };
}

// Calls Photon API to fetch live search suggestions
export async function fetchPhotonSuggestions(
  query: string,
  signal?: AbortSignal,
): Promise<LocationSuggestion[]> {
  const trimmed = query.trim();

  if (trimmed.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    q: trimmed,
    limit: "8",
    lang: "en",
    lat: String(CBD_CENTER.lat),
    lon: String(CBD_CENTER.lng),
    bbox: MELBOURNE_INNER_BBOX,
  });

  const response = await fetch(
    `https://photon.komoot.io/api/?${params.toString()}`,
    {
      signal,
    },
  );

  if (!response.ok) {
    const body = await response.text();
    console.error("Photon search failed:", response.status, body);
    throw new Error(`Photon request failed with status ${response.status}`);
  }

  const data = (await response.json()) as PhotonResponse;
  const features = Array.isArray(data.features) ? data.features : [];

  return features
    .map((feature, index) => normalisePhotonFeature(feature, index))
    .filter((item): item is LocationSuggestion => item !== null);
}