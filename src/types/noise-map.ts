export type CrowdMapFeature = {
  type: "Feature";
  properties: {
    crowdCount: number | null;
    isHighCrowd: boolean;
    crowdCategory: "high" | "non-high";
  };
  geometry: GeoJSON.LineString | GeoJSON.MultiLineString;
};

export type CrowdMapFeatureCollection = {
  type: "FeatureCollection";
  features: CrowdMapFeature[];
};