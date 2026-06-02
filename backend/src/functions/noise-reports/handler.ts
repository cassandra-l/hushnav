import type { APIGatewayProxyHandler } from "aws-lambda";
import {
  handleCreateNoiseReport,
  handleGetNoiseReports,
} from "../../spatialData/noiseReportsHandler";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Content-Type": "application/json",
};

export const handler: APIGatewayProxyHandler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod === "GET") {
    const result = await handleGetNoiseReports(event.queryStringParameters ?? {});
    return { statusCode: result.statusCode, headers, body: result.body };
  }

  if (event.httpMethod === "POST") {
    const body = event.body ? JSON.parse(event.body) : {};
    const result = await handleCreateNoiseReport(body);
    return { statusCode: result.statusCode, headers, body: result.body };
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: "Method not allowed." }),
  };
};
