import type { APIGatewayProxyHandler } from "aws-lambda";
import { handleGetSafeSpaces } from "../../navigation/handler";

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const result = await handleGetSafeSpaces();

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
    console.error("Safe spaces Lambda handler error:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Failed to load safe spaces.",
      }),
    };
  }
};