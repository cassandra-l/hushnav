import { runConstructionPipeline } from "./runConstructionPipeline";

export const handler = async () => {
  try {
    const result = await runConstructionPipeline();

    return {
      ok: true,
      message: "Construction pipeline update complete.",
      result,
    };
  } catch (error) {
    console.error("Failed to run construction pipeline:", error);
    throw error;
  }
};