import type { FilterPreselection } from "../types/quiz";

export const SAFE_SPACES_STORAGE_KEY = "hushnav:selectedSafeSpaces";
export const SENSITIVITY_STORAGE_KEY = "hushnav:selectedSensitivity";
export const RECOMMENDED_SENSITIVITY_STORAGE_KEY =
  "hushnav-recommended-sensitivity-filter";
export const RECOMMENDED_SAFE_SPACES_STORAGE_KEY =
  "hushnav-recommended-safe-spaces";
export const ROUTE_FILTER_WEIGHTS_STORAGE_KEY = "hushnav-route-filter-weights";

export const DEFAULT_SAFE_SPACE_IDS = [
  "park",
  "library",
  "museum",
  "church",
  "synagogue",
] as const;

export function writeQuizFilterRecommendations(
  preselection: FilterPreselection,
): void {
  localStorage.setItem(
    RECOMMENDED_SENSITIVITY_STORAGE_KEY,
    preselection.sensitivityId,
  );
  localStorage.setItem(
    RECOMMENDED_SAFE_SPACES_STORAGE_KEY,
    JSON.stringify(preselection.safeSpaceIds),
  );
}

export function clearQuizFilterRecommendations(): void {
  localStorage.removeItem(RECOMMENDED_SENSITIVITY_STORAGE_KEY);
  localStorage.removeItem(RECOMMENDED_SAFE_SPACES_STORAGE_KEY);
}

export function hasQuizFilterRecommendations(): boolean {
  return (
    localStorage.getItem(RECOMMENDED_SENSITIVITY_STORAGE_KEY) !== null ||
    localStorage.getItem(RECOMMENDED_SAFE_SPACES_STORAGE_KEY) !== null
  );
}

export function readRecommendedSafeSpaceIds(): string[] | null {
  const raw = localStorage.getItem(RECOMMENDED_SAFE_SPACES_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function readAppliedSafeSpaceIds(): string[] {
  const stored = localStorage.getItem(SAFE_SPACES_STORAGE_KEY);
  if (!stored) return [...DEFAULT_SAFE_SPACE_IDS];

  try {
    const parsed = JSON.parse(stored) as string[];
    return Array.isArray(parsed) ? parsed : [...DEFAULT_SAFE_SPACE_IDS];
  } catch {
    return [...DEFAULT_SAFE_SPACE_IDS];
  }
}

export function readInitialSafeSpaceIds(): string[] {
  return readRecommendedSafeSpaceIds() ?? readAppliedSafeSpaceIds();
}

export function readInitialSensitivityId(): string {
  return (
    localStorage.getItem(RECOMMENDED_SENSITIVITY_STORAGE_KEY) ||
    localStorage.getItem(SENSITIVITY_STORAGE_KEY) ||
    "standard"
  );
}
