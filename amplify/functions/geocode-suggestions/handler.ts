type LocationSuggestion = {
    id: string;
    place_name: string;
    center: [number, number];
};

const CBD_CENTER = {
    lat: -37.8136,
    lng: 144.9631,
};

const MELBOURNE_INNER_BBOX = "144.88,-37.87,145.05,-37.77";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
};

function jsonResponse(statusCode: number, body: unknown) {
    return {
        statusCode,
        headers: corsHeaders,
        body: JSON.stringify(body),
    };
}

function normalisePhotonFeature(feature: any, index: number): LocationSuggestion | null {
    const coordinates = feature?.geometry?.coordinates;

    if (!Array.isArray(coordinates) || coordinates.length < 2) {
        return null;
    }

    const [lng, lat] = coordinates;

    if (typeof lng !== "number" || typeof lat !== "number") {
        return null;
    }

    const props = feature?.properties ?? {};

    const labelParts = [
        props.name,
        props.street,
        props.city,
        props.state,
        props.country,
    ].filter(Boolean);

    const label = labelParts.join(", ");

    if (!label) {
        return null;
    }

    const idBase =
        props.osm_id != null
            ? `${props.osm_type ?? "feature"}-${String(props.osm_id)}`
            : `${label}-${index}`;

    return {
        id: `photon-${idBase}-${index}`,
        place_name: label,
        center: [lng, lat],
    };
}

function normaliseGisgraphyFeature(item: any, index: number): LocationSuggestion | null {
    const lat = Number(item?.lat);
    const lng = Number(item?.lng ?? item?.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
    }

    const labelParts = [
        item.formattedAddress ||
        item.label ||
        item.name ||
        item.address ||
        item.streetName,
        item.city,
        item.state,
        item.countryCode,
    ].filter(Boolean);

    const label = labelParts.join(", ");

    if (!label) {
        return null;
    }

    return {
        id: `gisgraphy-${item.osm_id ?? item.geonameId ?? label}-${index}`,
        place_name: label,
        center: [lng, lat],
    };
}

async function fetchPhotonSuggestions(query: string): Promise<LocationSuggestion[]> {
    const params = new URLSearchParams({
        q: query,
        limit: "8",
        lang: "en",
        lat: String(CBD_CENTER.lat),
        lon: String(CBD_CENTER.lng),
        bbox: MELBOURNE_INNER_BBOX,
    });

    const response = await fetch(
        `https://photon.komoot.io/api/?${params.toString()}`,
    );

    if (!response.ok) {
        const body = await response.text();
        console.error("Photon failed:", response.status, body);
        return [];
    }

    const data = await response.json();
    const features = Array.isArray(data.features) ? data.features : [];

    return features
        .map((feature: any, index: number) => normalisePhotonFeature(feature, index))
        .filter((item: LocationSuggestion | null): item is LocationSuggestion => item !== null);
}

async function fetchGisgraphySuggestions(query: string): Promise<LocationSuggestion[]> {
    const params = new URLSearchParams({
        q: query,
        format: "JSON",
        lang: "en",
        from: "1",
        to: "12",
        lat: String(CBD_CENTER.lat),
        lng: String(CBD_CENTER.lng),
        radius: "8000",
        country: "AU",
        suggest: "true",
        allwordsrequired: "true",
        style: "MEDIUM",
    });

    const response = await fetch(
        `https://services.gisgraphy.com/fulltext/search?${params.toString()}`,
    );

    if (!response.ok) {
        const body = await response.text();
        console.error("Gisgraphy failed:", response.status, body);
        return [];
    }

    const data = (await response.json()) as {
        result?: unknown[];
        results?: unknown[];
        docs?: unknown[];
        response?: {
            docs?: unknown[];
        };
    };

    const records = Array.isArray(data.result)
        ? data.result
        : Array.isArray(data.results)
            ? data.results
            : Array.isArray(data.docs)
                ? data.docs
                : Array.isArray(data.response?.docs)
                    ? data.response.docs
                    : [];

    return records
        .map((item: any, index: number) => normaliseGisgraphyFeature(item, index))
        .filter((item: LocationSuggestion | null): item is LocationSuggestion => item !== null);
}

export const handler = async (event: any) => {
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 204,
            headers: corsHeaders,
            body: "",
        };
    }

    try {
        const query = event.queryStringParameters?.q?.trim();

        if (!query || query.length < 2 || query === "Current Location") {
            return jsonResponse(200, {
                suggestions: [],
            });
        }

        let provider = "photon";
        let suggestions = await fetchPhotonSuggestions(query);

        if (suggestions.length === 0) {
            provider = "gisgraphy";
            suggestions = await fetchGisgraphySuggestions(query);
        }

        console.log(
            `[geocode-suggestions] query="${query}", provider=${provider}, count=${suggestions.length}`,
        );
        return jsonResponse(200, {
            provider,
            suggestions,
        });
    } catch (error) {
        console.error("Geocode suggestions error:", error);

        return jsonResponse(200, {
            suggestions: [],
        });
    }
};