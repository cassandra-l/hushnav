import type { APIGatewayProxyHandler } from "aws-lambda";
import { handlePlanRoute } from "../../navigation/handler";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
};

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const result = await handlePlanRoute(body);

    return {
      statusCode: result.statusCode,
      headers, 
      body: result.body,
    };
  } catch (error) {
    console.error("Lambda handler error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to plan route.",
      }),
    };
  }
};