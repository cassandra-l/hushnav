import { describe, expect, it } from "vitest";
import {
  geometryToGeoJsonString,
  isActiveStatus,
} from "../amplify/construction/fetchConstruction";

describe("construction helper utilities", () => {
  it("treats only Active status as active construction", () => {
    expect(isActiveStatus("Active")).toBe(true);
    expect(isActiveStatus("Inactive")).toBe(false);
    expect(isActiveStatus("Planned")).toBe(false);
    expect(isActiveStatus(undefined)).toBe(false);
  });

  it("converts standard GeoJSON geometries to JSON strings", () => {
    const pointGeometry = {
      type: "Point",
      coordinates: [144.9631, -37.8136],
    };

    expect(geometryToGeoJsonString(pointGeometry)).toBe(
      JSON.stringify(pointGeometry),
    );
  });

  it("converts GeometryCollection objects to JSON strings", () => {
    const geometryCollection = {
      type: "GeometryCollection",
      geometries: [
        {
          type: "Point",
          coordinates: [144.9631, -37.8136],
        },
      ],
    };

    expect(geometryToGeoJsonString(geometryCollection)).toBe(
      JSON.stringify({
        type: "GeometryCollection",
        geometries: geometryCollection.geometries,
      }),
    );
  });

  it("returns null for missing or empty geometry", () => {
    expect(geometryToGeoJsonString(undefined)).toBeNull();

    expect(
      geometryToGeoJsonString({
        type: "GeometryCollection",
        geometries: [],
      }),
    ).toBeNull();
  });
});