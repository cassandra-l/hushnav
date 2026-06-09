import { createNoiseReport, getNoiseReports } from "./noiseReports.js";

function isValidCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

export async function handleGetNoiseReports(query: unknown = {}) {
  try {
    const params = query as {
      lat?: unknown;
      lng?: unknown;
      radiusMeters?: unknown;
    };
    const lat = parseNumber(params.lat);
    const lng = parseNumber(params.lng);
    const radiusMeters = parseNumber(params.radiusMeters);

    const reports = await getNoiseReports({
      lat,
      lng,
      radiusMeters,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(reports),
    };
  } catch (error) {
    console.error("Get noise reports error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to load noise reports." }),
    };
  }
}

export async function handleCreateNoiseReport(body: unknown) {
  try {
    const input = body as {
      lat?: unknown;
      lng?: unknown;
      noiseLevel?: unknown;
    };

    if (!isValidCoordinate(input.lat) || !isValidCoordinate(input.lng)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "lat and lng are required." }),
      };
    }

    const report = await createNoiseReport({
      lat: input.lat,
      lng: input.lng,
      noiseLevel:
        typeof input.noiseLevel === "number" && Number.isFinite(input.noiseLevel)
          ? input.noiseLevel
          : null,
    });

    return {
      statusCode: 201,
      body: JSON.stringify(report),
    };
  } catch (error) {
    console.error("Create noise report error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to create noise report." }),
    };
  }
}
