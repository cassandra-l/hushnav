import { getAllSafeSpaces } from "./safeSpaces";

// ================= PLAN ROUTE HANDLER =================

// Handles route planning requests from frontend.
// This is used by BOTH:
// - Express server (local development)
// - AWS Lambda
export async function handlePlanRoute(body: unknown) {
  try {
    // Dynamically import planRoute only when needed.
    // This prevents unnecessary loading (important for Lambda cold starts).
    const { planRoute } = await import("./planRoute");

    // Call the actual routing logic
    const result = await planRoute(
      body as Parameters<typeof planRoute>[0],
    );

    // Return successful response
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    // Log error for debugging
    console.error("Plan route handler error:", error);

    // Return error response
    return {
      statusCode: 500,
      body: JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to plan route.",
      }),
    };
  }
}

// ================= SAFE SPACES HANDLER =================

// Returns all safe spaces for the application.
// This is used by BOTH:
// - Local Express server (/safe-spaces)
// - AWS Lambda (/safe-spaces endpoint)
export async function handleGetSafeSpaces() {
  try {
    // Fetch safe spaces from shared data source
    const result = await getAllSafeSpaces();

    // Return successful response
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    // Log error for debugging
    console.error("Get safe spaces handler error:", error);

    // Return error response
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