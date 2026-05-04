import { describe, expect, it } from "vitest";
import {
  filterSafeSpacesByTypes,
  getOrderedUniqueStopIds,
} from "../amplify/navigation/safeSpaceUtils";

const safeSpaces = [
  {
    id: 1,
    name: "Flagstaff Gardens",
    subTheme: "Informal Outdoor Facility (Park/Garden/Reserve)",
    type: "park",
    description: "A calm outdoor space along your route.",
    lat: -37.8101,
    lng: 144.9551,
  },
  {
    id: 2,
    name: "State Library Victoria",
    subTheme: "Library",
    type: "library",
    description: "A quiet reading space along your route.",
    lat: -37.8100,
    lng: 144.9643,
  },
  {
    id: 3,
    name: "ACMI",
    subTheme: "Art Gallery/Museum",
    type: "museum",
    description: "A quieter cultural space along your route.",
    lat: -37.8176,
    lng: 144.9690,
  },
  {
    id: 4,
    name: "St Francis Church",
    subTheme: "Church",
    type: "church",
    description: "A peaceful indoor space along your route.",
    lat: -37.8147,
    lng: 144.9680,
  },
] as const;

describe("safe space stopover utilities", () => {
  it("returns an empty list when no stopover is selected", () => {
    expect(getOrderedUniqueStopIds(undefined, undefined)).toEqual([]);
  });

  it("uses the old single stopover field when multi-stop field is missing", () => {
    expect(getOrderedUniqueStopIds(undefined, 23)).toEqual([23]);
  });

  it("uses stopSafeSpaceIds when multi-stop field is provided", () => {
    expect(getOrderedUniqueStopIds([10, 20, 30], 99)).toEqual([10, 20, 30]);
  });

  it("removes duplicate stopover IDs while preserving user selection order", () => {
    expect(getOrderedUniqueStopIds([10, 20, 10, 30, 20], undefined)).toEqual([
      10,
      20,
      30,
    ]);
  });
});

describe("safe space type filtering", () => {
  it("returns all safe spaces when no filter is provided", () => {
    expect(filterSafeSpacesByTypes([...safeSpaces], undefined)).toHaveLength(4);
  });

  it("returns all safe spaces when filter list is empty", () => {
    expect(filterSafeSpacesByTypes([...safeSpaces], [])).toHaveLength(4);
  });

  it("filters safe spaces by a single selected type", () => {
    expect(filterSafeSpacesByTypes([...safeSpaces], ["museum"])).toEqual([
      safeSpaces[2],
    ]);
  });

  it("filters safe spaces by multiple selected types", () => {
    expect(filterSafeSpacesByTypes([...safeSpaces], ["museum", "church"])).toEqual([
      safeSpaces[2],
      safeSpaces[3],
    ]);
  });

  it("returns an empty list when no safe space matches the selected type", () => {
    expect(filterSafeSpacesByTypes([...safeSpaces], ["synagogue"])).toEqual([]);
  });
});