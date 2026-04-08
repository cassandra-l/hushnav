import type { APIGatewayProxyHandler } from "aws-lambda";
import { handlePlanRoute } from "../../navigation/handler";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const result = await handlePlanRoute(body);

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
    console.error("Lambda handler error:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Failed to plan route.",
      }),
    };
  }
};