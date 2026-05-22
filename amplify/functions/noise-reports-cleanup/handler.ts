import { deleteExpiredNoiseReports } from "../../spatialData/noiseReports";

export const handler = async () => {
  console.log("[noise-reports-cleanup] cleanup started");

  const deletedCount = await deleteExpiredNoiseReports();

  console.log("[noise-reports-cleanup] cleanup finished", {
    deletedCount,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      deletedCount,
    }),
  };
};