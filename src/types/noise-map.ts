export type NoiseMapFeature = {
  type: "Feature";
  properties: {
    edgeId: number;
    noiseDb: number | null;
    isHighNoise: boolean;
    noiseCategory: "high" | "non-high";
  };
  geometry: GeoJSON.LineString | GeoJSON.MultiLineString;
};

export type NoiseMapFeatureCollection = {
  type: "FeatureCollection";
  features: NoiseMapFeature[];
};