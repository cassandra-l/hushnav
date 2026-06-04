import { getCrowdMapData } from "./noiseMap.js";

export async function handleCrowdMap() {
  try {
    const result = await getCrowdMapData();

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Crowd map handler error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to load crowd map data.",
      }),
    };
  }
}