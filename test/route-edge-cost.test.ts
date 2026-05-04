import { describe, expect, it } from "vitest";
import {
  computeEdgeCost,
  crowdCountToPenaltyDefault,
  crowdCountToPenaltyStrong,
} from "../amplify/navigation/route";

const baseEdge = {
  edgeId: 1,
  from: 10,
  to: 20,
  length: 100,
  defaultCost: 100,
  noiseDb: 50,
  crowdCount: 100,
  isHighCrowd: false,
};

describe("route edge cost calculation", () => {
  it("maps crowd count to default crowd penalty", () => {
    expect(crowdCountToPenaltyDefault(0)).toBe(0);
    expect(crowdCountToPenaltyDefault(19)).toBe(0);
    expect(crowdCountToPenaltyDefault(20)).toBe(0.05);
    expect(crowdCountToPenaltyDefault(50)).toBe(0.1);
    expect(crowdCountToPenaltyDefault(100)).toBe(0.2);
    expect(crowdCountToPenaltyDefault(200)).toBe(0.35);
  });

  it("maps crowd count to strong crowd penalty", () => {
    expect(crowdCountToPenaltyStrong(0)).toBe(0);
    expect(crowdCountToPenaltyStrong(19)).toBe(0);
    expect(crowdCountToPenaltyStrong(20)).toBe(0.1);
    expect(crowdCountToPenaltyStrong(50)).toBe(0.3);
    expect(crowdCountToPenaltyStrong(100)).toBe(0.6);
    expect(crowdCountToPenaltyStrong(200)).toBe(0.9);
  });

  it("uses default cost when noise data is missing", () => {
    const edge = {
      ...baseEdge,
      noiseDb: null,
      defaultCost: 123,
    };

    expect(computeEdgeCost(edge, "crowd")).toBe(123);
  });

  it("uses edge length when noise and default cost are missing", () => {
    const edge = {
      ...baseEdge,
      noiseDb: null,
      defaultCost: null,
    };

    expect(computeEdgeCost(edge, "crowd")).toBe(100);
  });

  it("applies noise only in construction mode", () => {
    const edge = {
      ...baseEdge,
      length: 100,
      noiseDb: 50,
      crowdCount: 200,
      isHighCrowd: true,
    };

    // 100 * (1 + 0.5) = 150
    expect(computeEdgeCost(edge, "construction")).toBe(150);
  });

  it("applies noise and normal crowd penalty in both mode", () => {
    const edge = {
      ...baseEdge,
      length: 100,
      noiseDb: 50,
      crowdCount: 100,
      isHighCrowd: false,
    };

    // noisePenalty = 0.5
    // default crowd penalty for 100 = 0.2
    // 100 * (1 + 0.5 + 0.2) = 170
    expect(computeEdgeCost(edge, "both")).toBe(170);
  });

  it("applies stronger crowd penalty in crowd mode", () => {
    const edge = {
      ...baseEdge,
      length: 100,
      noiseDb: 50,
      crowdCount: 100,
      isHighCrowd: false,
    };

    // noisePenalty = 0.5
    // strong crowd penalty for 100 = 0.6
    // strongCrowdWeight = 6
    // 100 * (1 + 0.5 + 6 * 0.6) = 510
    expect(computeEdgeCost(edge, "crowd")).toBeCloseTo(510);
  });

  it("adds extra penalty for high crowd edges in crowd mode", () => {
    const edge = {
      ...baseEdge,
      length: 100,
      noiseDb: 50,
      crowdCount: 100,
      isHighCrowd: true,
    };

    // base strong crowd penalty = 0.6
    // extraHighCrowdPenalty = 0.5
    // total crowd penalty = 1.1
    // 100 * (1 + 0.5 + 6 * 1.1) = 810
    expect(computeEdgeCost(edge, "crowd")).toBeCloseTo(810);
  });

  it("uses zero crowd penalty when crowd count is missing", () => {
    const edge = {
      ...baseEdge,
      length: 100,
      noiseDb: 50,
      crowdCount: null,
      isHighCrowd: false,
    };

    // both mode: 100 * (1 + 0.5 + 0) = 150
    expect(computeEdgeCost(edge, "both")).toBe(150);

    // crowd mode: 100 * (1 + 0.5 + 0) = 150
    expect(computeEdgeCost(edge, "crowd")).toBe(150);
  });
});