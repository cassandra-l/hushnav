import {
  getBadgeById,
  getNewlyUnlockedBadges,
  type BadgeDefinition,
} from "./achievement-badges";

export type AchievementsState = {
  routesPlanned: number;
  safeSpacesVisited: number;
  noiseReports: number;
  breathingUses: number;
};

const STORAGE_KEY = "hushnav.achievements.v1";
const UPDATED_EVENT = "achievements:updated";
const PENDING_BADGE_POPUPS_STORAGE_KEY = "hushnav.pendingBadgePopups.v1";

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

type PendingBadgePopup = {
  badgeId: string;
  createdAt: number;
};

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

function loadPendingBadgePopups(): PendingBadgePopup[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(PENDING_BADGE_POPUPS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingBadgePopup[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        typeof item?.badgeId === "string" &&
        typeof item?.createdAt === "number",
    );
  } catch {
    return [];
  }
}

function savePendingBadgePopups(popups: PendingBadgePopup[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(
    PENDING_BADGE_POPUPS_STORAGE_KEY,
    JSON.stringify(popups),
  );
}

function enqueueNewBadgePopups(
  previousState: AchievementsState,
  nextState: AchievementsState,
) {
  const newlyUnlocked = getNewlyUnlockedBadges(previousState, nextState);
  if (newlyUnlocked.length === 0) return;

  const existing = loadPendingBadgePopups();
  const existingIds = new Set(existing.map((item) => item.badgeId));
  const now = Date.now();
  const additions = newlyUnlocked
    .filter((badge) => !existingIds.has(badge.id))
    .map((badge) => ({
      badgeId: badge.id,
      createdAt: now,
    }));

  if (additions.length > 0) {
    savePendingBadgePopups([...existing, ...additions]);
  }
}

function updateAchievements(
  updater: (current: AchievementsState) => AchievementsState,
) {
  const current = loadAchievementsState();
  const next = updater(current);
  enqueueNewBadgePopups(current, next);
  saveAchievementsState(next);
}

export function incrementRoutesPlanned(delta = 1) {
  updateAchievements((current) => ({
    ...current,
    routesPlanned: current.routesPlanned + delta,
  }));
}

export function incrementSafeSpacesVisited(delta = 1) {
  updateAchievements((current) => ({
    ...current,
    safeSpacesVisited: current.safeSpacesVisited + delta,
  }));
}

export function incrementNoiseReports(delta = 1) {
  updateAchievements((current) => ({
    ...current,
    noiseReports: current.noiseReports + delta,
  }));
}

export function incrementBreathingUses(delta = 1) {
  updateAchievements((current) => ({
    ...current,
    breathingUses: current.breathingUses + delta,
  }));
}

export function subscribeToAchievementsUpdates(handler: () => void) {
  if (!isBrowser()) return () => undefined;
  const listener = () => handler();
  window.addEventListener(UPDATED_EVENT, listener);
  return () => window.removeEventListener(UPDATED_EVENT, listener);
}

/** Read the next pending badge without mutating the queue (safe inside setState). */
export function peekNextPendingBadgePopup(): BadgeDefinition | null {
  if (!isBrowser()) return null;

  const pending = loadPendingBadgePopups();
  if (pending.length === 0) return null;

  return getBadgeById(pending[0].badgeId) ?? null;
}

/** Remove the front of the queue after the user dismisses the current toast. */
export function shiftPendingBadgePopupQueue(): void {
  if (!isBrowser()) return;

  const pending = loadPendingBadgePopups();
  if (pending.length === 0) return;

  pending.shift();
  savePendingBadgePopups(pending);
}

