import { describe, expect, it } from "vitest";
import {
  BADGE_DEFINITIONS,
  getBadgeById,
  getNewlyUnlockedBadges,
} from "../src/achievement-badges";
import type { AchievementsState } from "../src/achievements-store";

const baseState: AchievementsState = {
  routesPlanned: 0,
  safeSpacesVisited: 0,
  noiseReports: 0,
  breathingUses: 0,
};

describe("achievement-badges", () => {
  it("finds a badge by id", () => {
    const firstBadge = BADGE_DEFINITIONS[0];
    expect(getBadgeById(firstBadge.id)).toEqual(firstBadge);
  });

  it("returns undefined for unknown badge ids", () => {
    expect(getBadgeById("does-not-exist")).toBeUndefined();
  });

  it("returns only newly unlocked badges", () => {
    const nextState: AchievementsState = {
      ...baseState,
      routesPlanned: 5,
      breathingUses: 1,
    };

    const unlocked = getNewlyUnlockedBadges(baseState, nextState);
    const ids = unlocked.map((badge) => badge.id);

    expect(ids).toContain("path-starter");
    expect(ids).toContain("route-regular");
    expect(ids).toContain("one-minute-calm");
    expect(ids).not.toContain("neighborhood-navigator");
  });

  it("returns no badges when state does not cross requirements", () => {
    const prevState: AchievementsState = {
      ...baseState,
      routesPlanned: 10,
      noiseReports: 5,
    };
    const nextState: AchievementsState = { ...prevState, routesPlanned: 11 };

    expect(getNewlyUnlockedBadges(prevState, nextState)).toEqual([]);
  });
});
