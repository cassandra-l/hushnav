import { fetchMicroclimateData, upsertNoiseSensors } from "./fetchNoise";
import {
  fetchPedestrianDataFull,
  fetchPedestrianDataIncremental,
  upsertPedestrianSensors,
  type PedestrianCountRecord,
  type PedestrianLocation,
} from "./fetchCrowd";
import { updateEdgeWeights } from "./updateEdgeWeights";

// This handler is used by AWS Lambda
export const handler = async () => {
  const skipNoiseFetch =
    process.env.SKIP_NOISE_FETCH === "true" ||
    process.env.SKIP_API_FETCH === "true";

  const skipCrowdFetch = process.env.SKIP_CROWD_FETCH === "true";
  const crowdMode = process.env.CROWD_MODE || "incremental";

  try {
    if (skipNoiseFetch) {
      console.log("Skipping noise API fetch.");
    } else {
      const noiseRecords = await fetchMicroclimateData();
      console.log(`Fetched ${noiseRecords.length} noise records from API.`);
      await upsertNoiseSensors(noiseRecords);
    }

    if (skipCrowdFetch) {
      console.log("Skipping crowd API fetch.");
    } else {
      let pedestrianRecords: Array<PedestrianCountRecord & PedestrianLocation>;

      if (crowdMode === "full") {
        console.log("Running crowd FULL refresh...");
        pedestrianRecords = await fetchPedestrianDataFull();
      } else {
        console.log("Running crowd INCREMENTAL refresh...");
        pedestrianRecords = await fetchPedestrianDataIncremental();
      }

      console.log(
        `Fetched ${pedestrianRecords.length} pedestrian records from API.`
      );

      await upsertPedestrianSensors(pedestrianRecords);
    }

    await updateEdgeWeights();
    console.log("Edge cost update complete.");

    return {
      ok: true,
      message: "Edge cost update complete.",
      crowdMode,
    };
  } catch (error) {
    console.error("Failed to update edge costs:", error);

    throw error;
  }
};