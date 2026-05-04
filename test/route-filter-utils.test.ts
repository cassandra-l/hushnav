import { describe, expect, it } from "vitest";
import {
  DEFAULT_SAFE_SPACE_TYPES,
  parseSelectedSafeSpaceTypes,
  sensitivityToAvoidMode,
} from "../src/route-filter-utils";

describe("route filter utilities", () => {
  it("maps sensitivity preferences to backend avoid modes", () => {
    expect(sensitivityToAvoidMode("standard")).toBe("both");
    expect(sensitivityToAvoidMode("mechanical")).toBe("construction");
    expect(sensitivityToAvoidMode("social")).toBe("crowd");
    expect(sensitivityToAvoidMode(null)).toBe("both");
    expect(sensitivityToAvoidMode("unknown")).toBe("both");
  });

  it("returns default safe space types when stored value is missing", () => {
    expect(parseSelectedSafeSpaceTypes(null)).toEqual(DEFAULT_SAFE_SPACE_TYPES);
  });

  it("parses selected safe space types from JSON", () => {
    expect(parseSelectedSafeSpaceTypes(JSON.stringify(["museum", "church"]))).toEqual([
      "museum",
      "church",
    ]);
  });

  it("filters invalid safe space types", () => {
    expect(
      parseSelectedSafeSpaceTypes(
        JSON.stringify(["museum", "invalid", "church"]),
      ),
    ).toEqual(["museum", "church"]);
  });

  it("returns defaults when JSON is invalid", () => {
    expect(parseSelectedSafeSpaceTypes("not-json")).toEqual(
      DEFAULT_SAFE_SPACE_TYPES,
    );
  });

  it("returns defaults when no valid safe space types are selected", () => {
    expect(parseSelectedSafeSpaceTypes(JSON.stringify(["invalid"]))).toEqual(
      DEFAULT_SAFE_SPACE_TYPES,
    );
  });
});