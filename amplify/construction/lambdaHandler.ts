import { runConstructionIngestion } from "./fetchConstruction";

export const handler = async () => {
  try {
    await runConstructionIngestion();

    return {
      ok: true,
      message: "Construction event update complete.",
    };
  } catch (error) {
    console.error("Failed to update construction events:", error);
    throw error;
  }
};