import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Check, ArrowLeft } from "lucide-react";
import type { AchievementsState } from "./achievements-store";
import { BADGE_DEFINITIONS } from "./achievement-badges";
import {
  loadAchievementsState,
  subscribeToAchievementsUpdates,
} from "./achievements-store";
import { Navbar } from "./components/nav-bar";
import { motion } from "framer-motion";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function AchievementSummaryPage() {
  const navigate = useNavigate();
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

  return (
    <main className="min-h-screen w-full pb-12 lg:overflow-hidden lg:h-screen">
      <div
        className="fixed inset-0 -z-10 bg-linear-to-b from-[#ffffff] via-[#d5e8e5] to-[#cfe3df]"
        aria-hidden="true"
      />
      <Navbar
        className="left-1/2 -translate-x-1/2 top-8 w-auto hidden lg:flex"
        showLogo={false}
      />

      {/* Header - Mobile Only */}
      <header className="lg:hidden sticky top-0 z-20 flex items-center border-b border-slate-200 bg-white px-5 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-[#1e293b] mr-10">
          Achievements
        </h1>
      </header>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className=" w-full"
      >
        <div className="mx-auto max-w-[450px] px-5 pt-6 sm:mt-20 lg:max-w-6xl lg:px-8 lg:pt-10">
          {/* Mobile Layout */}
          <div className="lg:hidden">
            {/* Level Card */}
            <section className="mb-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <div className="mb-1 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                Current Level
              </div>
              <h2 className="mb-6 text-2xl font-bold text-slate-800">
                {levelSteps[activeLevelIndex]?.name}
              </h2>

              <div className="flex items-center justify-between px-1">
                {levelSteps.map((step, idx) => {
                  const isDone = idx < prefixUnlocked;
                  const isCurrent = idx === activeLevelIndex;
                  const isLocked = totalCollectedBadges < step.minBadges;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedLevelIndex(idx)}
                      className="relative"
                      aria-label={`View details for ${step.name}`}
                    >
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all
                      ${isDone || isCurrent ? "border-[#7CA9A0] bg-[#f0f7f6]" : "border-slate-100 bg-slate-50"}`}
                      >
                        <span
                          className={`text-xl ${isLocked ? "grayscale opacity-40" : ""}`}
                        >
                          {step.emoji}
                        </span>
                      </div>
                      {isDone && (
                        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#7CA9A0] text-white ring-2 ring-white">
                          <Check size={10} strokeWidth={4} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Badge totals */}
            <section className="mb-8 grid grid-cols-2 gap-3">
              <article className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-100">
                <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.02em] text-slate-400">
                  Total Badges Unlocked
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-700">
                  {totalCollectedBadges}
                </p>
              </article>

              <article className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-100">
                <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.02em] text-slate-400">
                  Total Badges Locked
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-700">
                  {totalLockedBadges}
                </p>
              </article>
            </section>

            {/* Section Header */}
            <div className="mb-4 flex items-center justify-between px-1">
              <h3 className="text-lg font-bold text-slate-800">
                Badges Earned
              </h3>
              <Link
                to="/achievements/badges"
                className="flex items-center text-sm font-medium text-[#5A9A8E] hover:opacity-80"
              >
                See All
                <ChevronRight size={16} className="ml-0.5" strokeWidth={2} />
              </Link>
            </div>

            {/* Categories List */}
            <div className="space-y-4">
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
                    className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
                  >
                    <div className="flex gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-2xl ring-1 ring-slate-100">
                        {cat.emoji}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-700">
                            {cat.title}
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            {unlocked}/{total}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#7CA9A0] transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        {/* Milestone Checkmarks */}
                        <div className="mt-3 flex gap-2.5">
                          {Array.from({ length: total }).map((_, idx) => {
                            const active = idx < unlocked;
                            return (
                              <div
                                key={idx}
                                className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all
                              ${active ? "border-[#7CA9A0] bg-[#f0f7f6]" : "border-slate-100 bg-white"}`}
                              >
                                {active ? (
                                  <Check
                                    size={14}
                                    className="text-[#7CA9A0]"
                                    strokeWidth={3}
                                  />
                                ) : (
                                  <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex lg:gap-10 lg:items-start lg:justify-center">
            {/* Left Column */}
            <div className="w-100 shrink-0">
              {/* Level Card */}
              <section className="mb-6 rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-100">
                <div className="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  Current Level
                </div>
                <h2 className="mb-8 text-[28px] font-bold leading-tight text-slate-800">
                  {levelSteps[activeLevelIndex]?.name}
                </h2>

                {/* Level Icons  */}
                <div className="flex items-center justify-between">
                  {levelSteps.map((step, idx) => {
                    const isDone = idx < prefixUnlocked;
                    const isCurrent = idx === activeLevelIndex;
                    const isLocked = totalCollectedBadges < step.minBadges;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedLevelIndex(idx)}
                        className="relative shrink-0"
                      >
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all
                ${isDone || isCurrent ? "border-[#7CA9A0] bg-[#f0f7f6]" : "border-slate-100 bg-slate-50"}`}
                        >
                          <span
                            className={`text-xl ${isLocked ? "grayscale opacity-40" : ""}`}
                          >
                            {step.emoji}
                          </span>
                        </div>
                        {isDone && (
                          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#7CA9A0] text-white ring-2 ring-white">
                            <Check size={9} strokeWidth={4} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Badge totals */}
              <section className="grid grid-cols-2 gap-3">
                <article className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-100">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Total Badges Unlocked
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-700">
                    {totalCollectedBadges}
                  </p>
                </article>

                <article className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-100">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Total Badges Locked
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-700">
                    {totalLockedBadges}
                  </p>
                </article>
              </section>
            </div>

            {/* Right Column */}
            <div className="flex-1 min-w-0 max-w-4xl">
              <div className="mb-6 flex items-center justify-between px-1">
                <h3 className="text-xl font-bold text-slate-800">
                  Badges Earned
                </h3>
                <Link
                  to="/achievements/badges"
                  className="flex items-center text-sm font-medium text-[#5A9A8E] hover:opacity-80"
                >
                  See All
                  <ChevronRight size={16} className="ml-1" strokeWidth={2} />
                </Link>
              </div>

              <div className="space-y-4">
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
                      className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
                    >
                      <div className="flex gap-6 items-start ">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-3xl ring-1 ring-slate-100">
                          {cat.emoji}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-lg font-bold text-slate-700 truncate">
                              {cat.title}
                            </span>
                            <span className="text-xs font-bold text-slate-400 shrink-0 bg-slate-50 px-2 py-1 rounded-md">
                              {unlocked} / {total}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="h-2.5 w-full rounded-full bg-slate-100 mb-5">
                            <div
                              className="h-full rounded-full bg-[#7CA9A0] transition-all duration-1000 shadow-sm"
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          {/* Milestone Checkmarks */}
                          <div className="flex flex-wrap gap-3">
                            {Array.from({ length: total }).map((_, idx) => {
                              const active = idx < unlocked;
                              return (
                                <div
                                  key={idx}
                                  className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all shrink-0
                        ${active ? "border-[#7CA9A0] bg-[#f0f7f6]" : "border-slate-100 bg-white"}`}
                                >
                                  {active ? (
                                    <Check
                                      size={16}
                                      className="text-[#7CA9A0]"
                                      strokeWidth={3}
                                    />
                                  ) : (
                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {selectedLevelIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] px-8"
          onClick={() => setSelectedLevelIndex(null)}
        >
          <div
            className="w-full max-w-[340px] rounded-[32px] bg-white px-6 pb-8 pt-10 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Level Emoji Circle */}
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#E8EDF1] text-4xl shadow-inner">
              <span
                className={
                  totalCollectedBadges >=
                  levelSteps[selectedLevelIndex].minBadges
                    ? ""
                    : "grayscale opacity-50"
                }
              >
                {levelSteps[selectedLevelIndex].emoji}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-center text-2xl font-bold tracking-tight text-[#0f172a]">
              {levelSteps[selectedLevelIndex].name}
            </h3>

            {/* Requirement Description */}
            <p className="mt-1 text-center text-[15px] font-medium text-slate-500">
              {selectedLevelIndex === 0
                ? "This is your starting level"
                : `Collect ${levelSteps[selectedLevelIndex].minBadges} badges to reach this level`}
            </p>

            {/* Dynamic Status Box */}
            <div className="mt-8 rounded-[20px] bg-[#f8fafb] px-4 py-4 text-center text-[13px] font-medium text-slate-500 ring-1 ring-slate-100 whitespace-pre-line">
              {totalCollectedBadges >=
              levelSteps[selectedLevelIndex].minBadges ? (
                <span className="text-[#7CA9A0]">
                  {selectedLevelIndex === 0
                    ? "You start here!\nKeep earning badges to level up!"
                    : "You have reached this level!"}
                </span>
              ) : (
                <span>
                  You need{" "}
                  <span className="font-bold text-slate-700">
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

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedLevelIndex(null)}
              className="mt-8 w-full rounded-full bg-[#84B0A7] py-3.5 text-[16px] font-bold text-white shadow-lg shadow-teal-900/10 active:scale-[0.98] transition-transform"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
