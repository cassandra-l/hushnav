import type { AvoidMode, SafeSpaceType } from "./types/route";

export const DEFAULT_SAFE_SPACE_TYPES: SafeSpaceType[] = [
  "park",
  "library",
  "museum",
  "church",
  "synagogue",
];

export function sensitivityToAvoidMode(value: string | null): AvoidMode {
  switch (value) {
    case "mechanical":
      return "construction";
    case "social":
      return "crowd";
    case "standard":
    default:
      return "both";
  }
}

export function parseSelectedSafeSpaceTypes(
  raw: string | null,
): SafeSpaceType[] {
  if (!raw) return DEFAULT_SAFE_SPACE_TYPES;

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return DEFAULT_SAFE_SPACE_TYPES;
    }

    const filtered = parsed.filter((item): item is SafeSpaceType =>
      DEFAULT_SAFE_SPACE_TYPES.includes(item as SafeSpaceType),
    );

    return filtered.length > 0 ? filtered : DEFAULT_SAFE_SPACE_TYPES;
  } catch {
    return DEFAULT_SAFE_SPACE_TYPES;
  }
}