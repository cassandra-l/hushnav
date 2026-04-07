import { planRoute } from "./planRoute";

export async function handlePlanRoute(body: unknown) {
  try {
    const result = await planRoute(body as Parameters<typeof planRoute>[0]);

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Plan route handler error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to plan route.",
      }),
    };
  }
}