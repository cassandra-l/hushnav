import type { APIGatewayProxyHandler } from "aws-lambda";
import { handleNoiseMap } from "../../spatialData/handler";

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const result = await handleNoiseMap();

    return {
      statusCode: result.statusCode,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Content-Type": "application/json",
      },
      body: result.body,
    };
  } catch (error) {
    console.error("Lambda noise-map handler error:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Failed to load noise map data.",
      }),
    };
  }
};