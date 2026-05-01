import type { AchievementsState } from "./achievements-store";

export type BadgeCategory = "routes" | "breathing" | "safe-spaces" | "reports";

export type BadgeDefinition = {
  id: string;
  title: string;
  emoji: string;
  category: BadgeCategory;
  requirementLabel: string;
  requirement: (state: AchievementsState) => boolean;
};

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "path-starter",
    title: "First Steps",
    emoji: "🗺️",
    category: "routes",
    requirementLabel: "Complete 1 quiet route",
    requirement: (s) => s.routesPlanned >= 1,
  },
  {
    id: "route-regular",
    title: "Night Owl",
    emoji: "🌙",
    category: "routes",
    requirementLabel: "Complete 5 quiet routes",
    requirement: (s) => s.routesPlanned >= 5,
  },
  {
    id: "neighborhood-navigator",
    title: "Quiet Navigator",
    emoji: "🧭",
    category: "routes",
    requirementLabel: "Complete 10 quiet routes",
    requirement: (s) => s.routesPlanned >= 10,
  },
  {
    id: "breathing-spot-finder",
    title: "Safe Space Explorer",
    emoji: "🏛️",
    category: "safe-spaces",
    requirementLabel: "Visit 1 safe space",
    requirement: (s) => s.safeSpacesVisited >= 1,
  },
  {
    id: "sanctuary-seeker",
    title: "Nature Seeker",
    emoji: "🌳",
    category: "safe-spaces",
    requirementLabel: "Visit 3 safe spaces",
    requirement: (s) => s.safeSpacesVisited >= 3,
  },
  {
    id: "library-lover",
    title: "Library Lover",
    emoji: "📚",
    category: "safe-spaces",
    requirementLabel: "Visit 5 safe spaces",
    requirement: (s) => s.safeSpacesVisited >= 5,
  },
  {
    id: "one-minute-calm",
    title: "Calm Master",
    emoji: "🧘",
    category: "breathing",
    requirementLabel: "Use breathing tool 1 time",
    requirement: (s) => s.breathingUses >= 1,
  },
  {
    id: "reset-ritual",
    title: "Early Riser",
    emoji: "🌅",
    category: "breathing",
    requirementLabel: "Use breathing tool 3 times",
    requirement: (s) => s.breathingUses >= 3,
  },
  {
    id: "first-voice",
    title: "First Voice",
    emoji: "📣",
    category: "reports",
    requirementLabel: "Submit 1 report",
    requirement: (s) => s.noiseReports >= 1,
  },
  {
    id: "street-listener",
    title: "Street Listener",
    emoji: "🎧",
    category: "reports",
    requirementLabel: "Submit 3 reports",
    requirement: (s) => s.noiseReports >= 3,
  },
  {
    id: "signal-scout",
    title: "Signal Scout",
    emoji: "📡",
    category: "reports",
    requirementLabel: "Submit 5 reports",
    requirement: (s) => s.noiseReports >= 5,
  },
  {
    id: "community-spotter",
    title: "Community Spotter",
    emoji: "🛰️",
    category: "reports",
    requirementLabel: "Submit 10 reports",
    requirement: (s) => s.noiseReports >= 10,
  },
  {
    id: "city-guardian",
    title: "City Guardian",
    emoji: "🛡️",
    category: "reports",
    requirementLabel: "Submit 20 reports",
    requirement: (s) => s.noiseReports >= 20,
  },
];

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((badge) => badge.id === id);
}

export function getNewlyUnlockedBadges(
  previousState: AchievementsState,
  nextState: AchievementsState,
): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter(
    (badge) => !badge.requirement(previousState) && badge.requirement(nextState),
  );
}
