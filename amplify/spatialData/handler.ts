import { getNoiseMapData } from "./noiseMap";

export async function handleNoiseMap() {
  try {
    const result = await getNoiseMapData();

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Noise map handler error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to load noise map data.",
      }),
    };
  }
}