import { runConstructionPipeline } from "../../construction/runConstructionPipeline";

export const handler = async () => {
  try {
    console.log("Starting scheduled construction pipeline...");

    const result = await runConstructionPipeline();

    console.log("Construction pipeline completed:", result);

    return {
      ok: true,
      message: "Construction pipeline completed.",
      result,
    };
  } catch (error) {
    console.error("Construction pipeline failed:", error);
    throw error;
  }
};