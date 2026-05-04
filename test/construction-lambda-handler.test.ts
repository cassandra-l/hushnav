import { beforeEach, describe, expect, it, vi } from "vitest";

const runConstructionPipelineMock = vi.fn();

vi.mock("../amplify/construction/runConstructionPipeline", () => ({
  runConstructionPipeline: runConstructionPipelineMock,
}));

describe("construction pipeline Lambda handler", () => {
  beforeEach(() => {
    runConstructionPipelineMock.mockReset();
  });

  it("returns success response when pipeline completes", async () => {
    runConstructionPipelineMock.mockResolvedValue({
      blockedEdges: 120,
    });

    const { handler } = await import(
      "../amplify/functions/construction-pipeline/handler"
    );

    const result = await handler();

    expect(runConstructionPipelineMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      ok: true,
      message: "Construction pipeline completed.",
      result: {
        blockedEdges: 120,
      },
    });
  });

  it("throws when pipeline fails", async () => {
    const error = new Error("pipeline failed");
    runConstructionPipelineMock.mockRejectedValue(error);

    const { handler } = await import(
      "../amplify/functions/construction-pipeline/handler"
    );

    await expect(handler()).rejects.toThrow("pipeline failed");
    expect(runConstructionPipelineMock).toHaveBeenCalledTimes(1);
  });
});