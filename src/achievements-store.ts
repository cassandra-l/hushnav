export type AchievementsState = {
  routesPlanned: number;
  safeSpacesVisited: number;
  noiseReports: number;
  breathingUses: number;
};

const STORAGE_KEY = "hushnav.achievements.v1";
const UPDATED_EVENT = "achievements:updated";

const defaultState: AchievementsState = {
  routesPlanned: 0,
  safeSpacesVisited: 0,
  noiseReports: 0,
  breathingUses: 0,
};

function isBrowser() {
  return typeof window !== "undefined";
}

function parseMaybeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function loadAchievementsState(): AchievementsState {
  if (!isBrowser()) return defaultState;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<AchievementsState>;
    return {
      routesPlanned: parseMaybeNumber(parsed.routesPlanned),
      safeSpacesVisited: parseMaybeNumber(parsed.safeSpacesVisited),
      noiseReports: parseMaybeNumber(parsed.noiseReports),
      breathingUses: parseMaybeNumber(parsed.breathingUses),
    };
  } catch {
    return defaultState;
  }
}

export function saveAchievementsState(state: AchievementsState) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(UPDATED_EVENT));
}

export function incrementRoutesPlanned(delta = 1) {
  const current = loadAchievementsState();
  saveAchievementsState({
    ...current,
    routesPlanned: current.routesPlanned + delta,
  });
}

export function incrementSafeSpacesVisited(delta = 1) {
  const current = loadAchievementsState();
  saveAchievementsState({
    ...current,
    safeSpacesVisited: current.safeSpacesVisited + delta,
  });
}

export function incrementNoiseReports(delta = 1) {
  const current = loadAchievementsState();
  saveAchievementsState({
    ...current,
    noiseReports: current.noiseReports + delta,
  });
}

export function incrementBreathingUses(delta = 1) {
  const current = loadAchievementsState();
  saveAchievementsState({
    ...current,
    breathingUses: current.breathingUses + delta,
  });
}

export function subscribeToAchievementsUpdates(handler: () => void) {
  if (!isBrowser()) return () => undefined;
  const listener = () => handler();
  window.addEventListener(UPDATED_EVENT, listener);
  return () => window.removeEventListener(UPDATED_EVENT, listener);
}

