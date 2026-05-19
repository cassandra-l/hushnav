import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Check, Menu } from "lucide-react";
import type { AchievementsState } from "./achievements-store";
import { BADGE_DEFINITIONS } from "./achievement-badges";
import {
  loadAchievementsState,
  subscribeToAchievementsUpdates,
} from "./achievements-store";
import { Navbar } from "./components/nav-bar";
import { motion } from "framer-motion";
import { MobileMenu } from "./components/hamburger-menu";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function AchievementSummaryPage() {
  const [state, setState] = useState<AchievementsState>(() =>
    loadAchievementsState(),
  );
  const [selectedLevelIndex, setSelectedLevelIndex] = useState<number | null>(
    null,
  );

  useEffect(() => {
    return subscribeToAchievementsUpdates(() => {
      setState(loadAchievementsState());
    });
  }, []);

  const totalCollectedBadges = useMemo(
    () => BADGE_DEFINITIONS.filter((badge) => badge.requirement(state)).length,
    [state],
  );
  const totalLockedBadges = BADGE_DEFINITIONS.length - totalCollectedBadges;

  const levelSteps = useMemo(
    () => [
      { name: "Quiet Path Explorer", emoji: "🌱", minBadges: 0 },
      { name: "Calm Route Builder", emoji: "🌿", minBadges: 2 },
      { name: "Breathway Navigator", emoji: "🌳", minBadges: 5 },
      { name: "Noise-Wise Walker", emoji: "🏔️", minBadges: 9 },
      { name: "Serenity Master", emoji: "⭐", minBadges: 11 },
    ],
    [],
  );

  const prefixUnlocked = useMemo(() => {
    let unlocked = 0;
    for (const step of levelSteps) {
      if (totalCollectedBadges >= step.minBadges) unlocked += 1;
      else break;
    }
    return unlocked;
  }, [levelSteps, totalCollectedBadges]);

  const activeLevelIndex = clamp(prefixUnlocked - 1, 0, levelSteps.length - 1);

  const categories = useMemo(
    () => [
      { id: "routes", title: "Routes", emoji: "🗺️" },
      { id: "breathing", title: "Breathing", emoji: "🧘" },
      { id: "safe-spaces", title: "Safe Spaces", emoji: "🏛️" },
      { id: "reports", title: "Reports", emoji: "📣" },
    ],
    [],
  );

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex flex-col h-dvh overflow-hidden font-sans text-[#101828]">
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div
        className="fixed inset-0 -z-10 bg-linear-to-b from-[#ffffff] via-[#d5e8e5] to-[#cfe3df]"
        aria-hidden="true"
      />

      <Navbar
        className="left-1/2 -translate-x-1/2 top-8 w-auto hidden lg:flex"
        showLogo={false}
      />

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-20 flex items-center px-5 py-4">
        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-4 bg-white/60 backdrop-blur-xl rounded-full border border-white/40 text-[#1E2939] shadow-sm"
        >
          <Menu size={20} className="text-[#5A9A8E]" />
        </button>
      </header>

      {/* Core Adaptive Main View */}
      <main className="flex-1 overflow-y-auto pt-6 md:pt-35 pb-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          {/* Grid Layout */}
          <div className="flex flex-col lg:flex-row gap-8 lg:items-start lg:justify-center">
            {/* Left Side Column: Achievements Typography & Level Dashboard Cards */}
            <div className="w-full lg:w-[380px] shrink-0 space-y-4">
              {/* Main Typography Header Block */}
              <div className="text-left mb-6 lg:mb-8">
                <h1 className="text-5xl md:text-6xl font-medium tracking-tight mb-2 text-[#1E2939]">
                  Achievements
                </h1>
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] opacity-60 text-[#5A9A8E]">
                  YOUR JOURNEY TOWARD URBAN SERENITY
                </p>
              </div>

              {/* Level Profile Card */}
              <section className="rounded-2xl bg-white/40 border border-white/50 backdrop-blur-3xl p-6 shadow-sm">
                <div className="mb-1 text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-[#1E2939]/50">
                  Current Level
                </div>
                <h2 className="mb-6 text-2xl font-black tracking-tight text-[#1E2939]">
                  {levelSteps[activeLevelIndex]?.name}
                </h2>

                <div className="flex items-center justify-between gap-1">
                  {levelSteps.map((step, idx) => {
                    const isDone = idx < prefixUnlocked;
                    const isCurrent = idx === activeLevelIndex;
                    const isLocked = totalCollectedBadges < step.minBadges;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedLevelIndex(idx)}
                        className="relative shrink-0 transition-transform active:scale-95"
                        aria-label={`View details for ${step.name}`}
                      >
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300
                            ${isDone || isCurrent ? "border-[#7CA9A0] bg-white" : "border-white/40 bg-white/20"}`}
                        >
                          <span
                            className={`text-lg ${isLocked ? "grayscale opacity-30" : ""}`}
                          >
                            {step.emoji}
                          </span>
                        </div>
                        {isDone && (
                          <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#7CA9A0] text-white ring-2 ring-white">
                            <Check size={9} strokeWidth={4} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Badge Stats */}
              <section className="grid grid-cols-2 gap-3">
                <article className="rounded-2xl bg-white/40 border border-white/50 backdrop-blur-3xl p-4 text-center shadow-sm">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#1E2939]/60">
                    Unlocked
                  </p>
                  <p className="mt-1 text-3xl font-black text-[#5A9A8E]">
                    {totalCollectedBadges}
                  </p>
                </article>

                <article className="rounded-2xl bg-white/50 border border-white/70 backdrop-blur-3xl p-4 text-center shadow-sm">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#1E2939]/60">
                    Locked
                  </p>
                  <p className="mt-1 text-3xl font-black text-slate-400">
                    {totalLockedBadges}
                  </p>
                </article>
              </section>
            </div>

            {/* Right Side Column */}
            <div className="flex-1 min-w-0 w-full lg:pt-3">
              {/* Badges Earned Header */}
              <div className="mb-5 md:mb-7 flex items-center justify-between px-2 lg:pt-2">
                <span className="text-[12px] font-mono font-bold uppercase tracking-[0.15em] text-[#1E2939]/50">
                  Badges Earned
                </span>
                <Link
                  to="/achievements/badges"
                  className="flex items-center text-xs font-mono font-bold uppercase tracking-[0.1em] text-[#5A9A8E] hover:opacity-80 transition-opacity"
                >
                  See All
                  <ChevronRight
                    size={14}
                    className="ml-0.5"
                    strokeWidth={2.5}
                  />
                </Link>
              </div>

              {/* Tracking cards */}
              <div className="space-y-3">
                {categories.map((cat) => {
                  const total = BADGE_DEFINITIONS.filter(
                    (b) => b.category === cat.id,
                  ).length;
                  const unlocked = BADGE_DEFINITIONS.filter(
                    (b) => b.category === cat.id && b.requirement(state),
                  ).length;
                  const progress = (unlocked / total) * 100;

                  return (
                    <div
                      key={cat.id}
                      className="p-4 rounded-2xl bg-white/50 border border-white/70 backdrop-blur-3xl shadow-sm"
                    >
                      {/* Top row: Icon, Title and Progress Fraction Counter Text */}
                      <div className=" flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 text-xl border border-white shadow-inner">
                            {cat.emoji}
                          </div>
                          <h3 className="text-[15px] font-black tracking-tight text-[#1E2939]">
                            {cat.title}
                          </h3>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-400">
                          {unlocked} / {total}
                        </span>
                      </div>

                      {/* Continuous progress bar line right below the titles */}
                      <div className="h-1.5 w-full rounded-full bg-black/5 overflow-hidden mb-4">
                        <div
                          className="h-full rounded-full bg-[#7CA9A0] transition-all duration-1000 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      {/* Checkmark sub-nodes directly under the progress bar line */}
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: total }).map((_, idx) => {
                          const active = idx < unlocked;
                          return (
                            <div
                              key={idx}
                              className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-300
                                ${active ? "border-[#7CA9A0] bg-white shadow-xs" : "border-white/60 bg-white/10"}`}
                            >
                              {active ? (
                                <Check
                                  size={12}
                                  className="text-[#7CA9A0]"
                                  strokeWidth={3}
                                />
                              ) : (
                                <div className="h-1 w-1 rounded-full bg-[#1E2939]/10" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Level Modal / Detail Drawer Sheet Dialog */}
      {selectedLevelIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-md px-6"
          onClick={() => setSelectedLevelIndex(null)}
        >
          <div
            className="w-full max-w-[350px] rounded-[28px] bg-white/90 border border-white/80 backdrop-blur-2xl p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-inner text-3xl border border-white">
              <span
                className={
                  totalCollectedBadges >=
                  levelSteps[selectedLevelIndex].minBadges
                    ? ""
                    : "grayscale opacity-30"
                }
              >
                {levelSteps[selectedLevelIndex].emoji}
              </span>
            </div>

            <h3 className="text-center text-xl font-black tracking-tight text-[#1E2939]">
              {levelSteps[selectedLevelIndex].name}
            </h3>

            <p className="mt-1.5 text-center text-[13px] font-medium text-slate-500 leading-normal">
              {selectedLevelIndex === 0
                ? "This is your starting level"
                : `Collect ${levelSteps[selectedLevelIndex].minBadges} badges to reach this level`}
            </p>

            <div className="mt-6 rounded-xl bg-white/50 border border-white/60 p-4 text-center text-xs font-medium text-slate-500 whitespace-pre-line">
              {totalCollectedBadges >=
              levelSteps[selectedLevelIndex].minBadges ? (
                <span className="text-[#5A9A8E] font-bold">
                  {selectedLevelIndex === 0
                    ? "You start here!\nKeep earning badges to level up!"
                    : "You have reached this level!"}
                </span>
              ) : (
                <span>
                  You need{" "}
                  <span className="font-bold text-[#1E2939]">
                    {levelSteps[selectedLevelIndex].minBadges -
                      totalCollectedBadges}
                  </span>{" "}
                  more badge
                  {levelSteps[selectedLevelIndex].minBadges -
                    totalCollectedBadges ===
                  1
                    ? ""
                    : "s"}{" "}
                  to unlock this.
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedLevelIndex(null)}
              className="mt-6 w-full rounded-full bg-[#5A9A8E] py-3 text-sm font-bold text-white shadow-md hover:opacity-95 transition-opacity"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
