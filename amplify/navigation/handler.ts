import { getAllSafeSpaces } from "./safeSpaces";

export async function handlePlanRoute(body: unknown) {
  try {
    // Import planRoute only when this function is actually called.
    // This prevents the safe-spaces Lambda from loading geocode.ts on startup.
    const { planRoute } = await import("./planRoute");

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
        error: error instanceof Error ? error.message : "Failed to plan route.",
      }),
    };
  }
}

export async function handleGetSafeSpaces() {
  try {
    const result = await getAllSafeSpaces();

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Get safe spaces handler error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to load safe spaces.",
      }),
    };
  }
}