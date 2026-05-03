import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  incrementNoiseReports,
  incrementRoutesPlanned,
  loadAchievementsState,
  peekNextPendingBadgePopup,
  shiftPendingBadgePopupQueue,
  subscribeToAchievementsUpdates,
} from "../src/achievements-store";

describe("achievements-store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads default state when storage is empty", () => {
    expect(loadAchievementsState()).toEqual({
      routesPlanned: 0,
      safeSpacesVisited: 0,
      noiseReports: 0,
      breathingUses: 0,
    });
  });

  it("increments counters and persists to localStorage", () => {
    incrementRoutesPlanned();
    incrementRoutesPlanned(2);
    incrementNoiseReports();

    expect(loadAchievementsState()).toEqual({
      routesPlanned: 3,
      safeSpacesVisited: 0,
      noiseReports: 1,
      breathingUses: 0,
    });
  });

  it("queues newly unlocked badges and shifts queue", () => {
    incrementRoutesPlanned();

    const queued = peekNextPendingBadgePopup();
    expect(queued?.id).toBe("path-starter");

    shiftPendingBadgePopupQueue();
    expect(peekNextPendingBadgePopup()).toBeNull();
  });

  it("subscribes and unsubscribes from updates", () => {
    const handler = vi.fn();
    const unsubscribe = subscribeToAchievementsUpdates(handler);

    incrementRoutesPlanned();
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();
    incrementRoutesPlanned();
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
