import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AchievementsState } from "./achievements-store";
import {
  loadAchievementsState,
  subscribeToAchievementsUpdates,
} from "./achievements-store";

type LevelStep = {
  name: string;
  requirement: (s: AchievementsState) => boolean;
  emoji: string;
};

type BadgeDef = {
  id: string;
  title: string;
  emoji: string;
  total: number;
  getCurrent: (s: AchievementsState) => number;
};

const BADGE_SHOW_STEPS = 5;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getBadgeProgress(currentValue: number, totalValue: number) {
  const safeTotal = totalValue <= 0 ? 1 : totalValue;
  const cappedCurrent = clamp(currentValue, 0, safeTotal);
  const percent = (cappedCurrent / safeTotal) * 100;
  const doneSteps = Math.floor(
    (cappedCurrent / safeTotal) * BADGE_SHOW_STEPS,
  );
  return { cappedCurrent, safeTotal, percent, doneSteps };
}

export function AchievementSummaryPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<AchievementsState>(() =>
    loadAchievementsState(),
  );

  useEffect(() => {
    setState(loadAchievementsState());
    return subscribeToAchievementsUpdates(() => {
      setState(loadAchievementsState());
    });
  }, []);

  const levelSteps: LevelStep[] = useMemo(
    () => [
      {
        name: "Quiet Path Explorer",
        emoji: "🌿",
        requirement: (s) => s.routesPlanned >= 1,
      },
      {
        name: "Calm Route Builder",
        emoji: "🌱",
        requirement: (s) => s.safeSpacesVisited >= 1,
      },
      {
        name: "Breathway Navigator",
        emoji: "😌",
        requirement: (s) => s.breathingUses >= 1,
      },
      {
        name: "Noise-Wise Walker",
        emoji: "🔊",
        requirement: (s) => s.noiseReports >= 1,
      },
      {
        name: "Serenity Master",
        emoji: "⭐",
        requirement: (s) =>
          s.routesPlanned >= 5 &&
          s.safeSpacesVisited >= 5 &&
          s.breathingUses >= 5 &&
          s.noiseReports >= 5,
      },
    ],
    [],
  );

  const prefixUnlocked = useMemo(() => {
    let unlocked = 0;
    for (const step of levelSteps) {
      if (step.requirement(state)) unlocked += 1;
      else break;
    }
    return unlocked; 
  }, [levelSteps, state]);

  const activeLevelIndex = clamp(prefixUnlocked, 0, levelSteps.length - 1);

  const badges: BadgeDef[] = useMemo(
    () => [
      {
        id: "route-first",
        title: "First time routing",
        emoji: "🗺️",
        total: 1,
        getCurrent: (s) => s.routesPlanned,
      },
      {
        id: "route-5",
        title: "Routing 5 times",
        emoji: "🧭",
        total: 5,
        getCurrent: (s) => s.routesPlanned,
      },
      {
        id: "route-10",
        title: "Routing 10 times",
        emoji: "🏁",
        total: 10,
        getCurrent: (s) => s.routesPlanned,
      },
      {
        id: "safe-first",
        title: "Add safe space first time",
        emoji: "🍃",
        total: 1,
        getCurrent: (s) => s.safeSpacesVisited,
      },
      {
        id: "safe-5",
        title: "Add safe space 5 times",
        emoji: "🌳",
        total: 5,
        getCurrent: (s) => s.safeSpacesVisited,
      },
      {
        id: "safe-10",
        title: "Add safe space 10 times",
        emoji: "🌲",
        total: 10,
        getCurrent: (s) => s.safeSpacesVisited,
      },
      {
        id: "breath-first",
        title: "Using the breathing tool for the first time",
        emoji: "🧘",
        total: 1,
        getCurrent: (s) => s.breathingUses,
      },
      {
        id: "breath-5",
        title: "Using the breathing tool 5 times",
        emoji: "🌬️",
        total: 5,
        getCurrent: (s) => s.breathingUses,
      },
      {
        id: "breath-10",
        title: "Using the breathing tool 10 times",
        emoji: "🫧",
        total: 10,
        getCurrent: (s) => s.breathingUses,
      },
      {
        id: "noise-first",
        title: "First noise report",
        emoji: "📣",
        total: 1,
        getCurrent: (s) => s.noiseReports,
      },
      {
        id: "noise-5",
        title: "Reporting noise 5 times",
        emoji: "🎚️",
        total: 5,
        getCurrent: (s) => s.noiseReports,
      },
      {
        id: "noise-10",
        title: "Reporting noise 10 times",
        emoji: "📡",
        total: 10,
        getCurrent: (s) => s.noiseReports,
      },
    ],
    [],
  );

  const stats = useMemo(
    () => [
      { value: state.noiseReports, label: "Noise reports" },
      { value: state.safeSpacesVisited, label: "Safe spaces visited" },
    ],
    [state.noiseReports, state.safeSpacesVisited],
  );

  return (
    <main className="min-h-screen w-full bg-[#D5E8E5] px-4 py-6">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-4 flex items-center justify-center relative">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full border border-[#E8EEEC] bg-[#F7FAF9] text-[#1E2939]"
            aria-label="Go back"
          >
            ←
          </button>
          <h1 className="text-[26px] font-semibold text-[#1E2939]">
            Achievements
          </h1>
        </div>

        <div className="rounded-[24px] bg-white/90 border border-[#E8EEEC] shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col gap-3">
              <div className="text-[12px] font-bold tracking-[0.2em] text-[#6A7282]">
                LEVEL
              </div>
              <div className="text-[28px] font-semibold leading-tight text-[#1E2939]">
                {levelSteps[activeLevelIndex]?.name}
              </div>

              <div className="mt-1 flex items-center justify-between gap-3">
                {levelSteps.map((step, idx) => {
                  const done = idx < activeLevelIndex;
                  const active = idx === activeLevelIndex;
                  return (
                    <div
                      key={step.name}
                      className={[
                        "relative flex items-center justify-center w-14 h-14 rounded-full bg-white",
                        done
                          ? "border-2 border-[#5A9A8E]"
                          : active
                            ? "border-2 border-[#5A9A8E] bg-[#F2F7F4]"
                            : "border border-[#E8EEEC]",
                      ].join(" ")}
                      aria-label={
                        done
                          ? "Completed level step"
                          : active
                            ? "Active level step"
                            : "Locked level step"
                      }
                    >
                      <span
                        className={[
                          "text-[28px] leading-none",
                          done || active ? "text-[#5A9A8E]" : "text-[#A0A7B3]",
                        ].join(" ")}
                      >
                        {step.emoji}
                      </span>
                      {done ? (
                        <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-[#5A9A8E] text-white text-[14px]">
                          ✓
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="grid grid-cols-2 gap-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-[18px] bg-white border border-[#E8EEEC] p-5 text-center"
                >
                  <div className="text-[34px] font-semibold text-[#1E2939]">
                    {s.value}
                  </div>
                  <div className="text-[12px] font-medium text-[#6A7282] mt-1">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[18px] font-semibold text-[#1E2939]">
                Badges earned
              </div>
              <a
                href="#"
                className="text-[14px] font-medium text-[#5A9A8E] hover:underline flex items-center gap-2"
                aria-label="See all badges"
              >
                See all <span aria-hidden="true">›</span>
              </a>
            </div>

            <div className="space-y-4">
              {badges.map((b) => {
                const progress = getBadgeProgress(b.getCurrent(state), b.total);
                return (
                  <div
                    key={b.id}
                    className="rounded-[18px] bg-white border border-[#E8EEEC] p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#F2F7F4] flex items-center justify-center text-[20px]">
                        <span aria-hidden="true">{b.emoji}</span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-baseline justify-between gap-4">
                          <div className="text-[16px] font-semibold text-[#1E2939]">
                            {b.title}
                          </div>
                          <div className="text-[13px] font-medium text-[#6A7282]">
                            {progress.cappedCurrent}/{progress.safeTotal}
                          </div>
                        </div>

                        <div className="mt-3 h-2 w-full rounded-full bg-[#E8EEEC] overflow-hidden">
                          <div
                            className="h-full bg-[#5A9A8E] rounded-full"
                            style={{ width: `${progress.percent}%` }}
                            aria-hidden="true"
                          />
                        </div>

                        <div className="mt-4 flex items-center justify-start gap-2">
                          {Array.from({ length: BADGE_SHOW_STEPS }).map((_, i) => {
                            const done = i < progress.doneSteps;
                            return (
                              <div
                                key={i}
                                className={[
                                  "grid place-items-center w-8 h-8 rounded-full bg-white border",
                                  done
                                    ? "border-[#5A9A8E] text-[#5A9A8E]"
                                    : "border-[#E8EEEC] text-[#C7CDD6]",
                                ].join(" ")}
                                aria-label={
                                  done
                                    ? "Completed badge step"
                                    : "Remaining badge step"
                                }
                              >
                                {done ? (
                                  <span className="text-[14px] font-bold">✓</span>
                                ) : null}
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
    </main>
  );
}

