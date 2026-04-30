import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { AchievementsState } from "./achievements-store";
import {
  BADGE_DEFINITIONS,
  type BadgeCategory,
  type BadgeDefinition,
} from "./achievement-badges";
import {
  loadAchievementsState,
  subscribeToAchievementsUpdates,
} from "./achievements-store";

type BadgeFilter = "all" | BadgeCategory;

const filterChips: Array<{ id: BadgeFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "routes", label: "Routes" },
  { id: "breathing", label: "Breathing" },
  { id: "safe-spaces", label: "Safe Spaces" },
  { id: "reports", label: "Reports" },
];

function BadgeCard({ title, emoji, isUnlocked }: { title: string; emoji: string; isUnlocked: boolean }) {
  return (
    <article
      className={`
        relative flex aspect-square flex-col items-center justify-center rounded-2xl border transition-all
        ${isUnlocked 
          ? "bg-white border-slate-100 shadow-sm" 
          : "bg-[#edf1f2]/50 border-slate-200/60 opacity-80"}
      `}
    >
      <div className="relative mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50/50">
        {!isUnlocked && (
          <div className="absolute -left-1 -top-1 z-10 text-slate-400">
            <Lock size={14} fill="currentColor" className="text-slate-300" />
          </div>
        )}
        <span className={`text-2xl ${isUnlocked ? "" : "grayscale opacity-30"}`}>
          {emoji}
        </span>
      </div>

      <h3 className="px-2 text-center text-[11px] font-medium leading-tight text-slate-600">
        {title}
      </h3>
    </article>
  );
}

export function AchievementsBadgesPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<AchievementsState>(() => loadAchievementsState());
  const [activeFilter, setActiveFilter] = useState<BadgeFilter>("all");
  const [selectedBadge, setSelectedBadge] = useState<
    (BadgeDefinition & { unlocked: boolean }) | null
  >(null);

  useEffect(() => {
    return subscribeToAchievementsUpdates(() => setState(loadAchievementsState()));
  }, []);

  const filteredCards = useMemo(() => {
    const cards = BADGE_DEFINITIONS.map((b) => ({
      ...b,
      unlocked: b.requirement(state),
    }));
    if (activeFilter === "all") return cards;
    return cards.filter(c => c.category === activeFilter);
  }, [activeFilter, state]);

  const unlocked = filteredCards.filter(c => c.unlocked);
  const locked = filteredCards.filter(c => !c.unlocked);

  return (
    <main className="min-h-screen w-full bg-[#f4f7f8]">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center border-b border-slate-200 bg-white px-5 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-[#1e293b] mr-10">
          All Badges
        </h1>
      </header>

      <div className="mx-auto max-w-[450px] p-5 lg:max-w-6xl lg:px-8 lg:py-8">
        {/* Filter Chips */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-3 no-scrollbar lg:mb-10">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => setActiveFilter(chip.id)}
              className={`
                whitespace-nowrap rounded-full px-5 py-1.5 text-[13px] font-medium transition-all border lg:px-6 lg:py-2 lg:text-sm
                ${activeFilter === chip.id 
                  ? "bg-[#7CA9A0] text-white border-[#7CA9A0] shadow-md shadow-teal-900/10" 
                  : "bg-white text-slate-500 border-slate-200"}
              `}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Unlocked Section */}
        {unlocked.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-5 text-[15px] font-bold text-slate-800 lg:mb-6 lg:text-lg">
              Unlocked ({unlocked.length})
            </h2>
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-5 lg:gap-4 xl:grid-cols-6">
              {unlocked.map(card => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setSelectedBadge(card)}
                  className="text-left"
                >
                  <BadgeCard title={card.title} emoji={card.emoji} isUnlocked={true} />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Locked Section */}
        {locked.length > 0 && (
          <section>
            <h2 className="mb-5 text-[15px] font-bold text-slate-800 lg:mb-6 lg:text-lg">
              Locked ({locked.length})
            </h2>
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-5 lg:gap-4 xl:grid-cols-6">
              {locked.map(card => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setSelectedBadge(card)}
                  className="text-left"
                >
                  <BadgeCard title={card.title} emoji={card.emoji} isUnlocked={false} />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {selectedBadge && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] px-8"
    onClick={() => setSelectedBadge(null)}
  >
    <div
      className="w-full max-w-[340px] rounded-[32px] bg-white px-6 pb-8 pt-10 shadow-xl"
      onClick={(event) => event.stopPropagation()}
    >
      {/* Badge Emoji Circle */}
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#E8EDF1] text-4xl shadow-inner">
        <span className={selectedBadge.unlocked ? "" : "grayscale opacity-50"}>
          {selectedBadge.emoji}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-center text-2xl font-bold tracking-tight text-[#0f172a]">
        {selectedBadge.title}
      </h3>

      {/* Requirement */}
      <p className="mt-1 text-center text-[15px] font-medium text-slate-500">
        {selectedBadge.requirementLabel}
      </p>

      {/* Status Box */}
      <div className="mt-8 rounded-[20px] bg-[#f8fafb] px-4 py-4 text-center text-[13px] font-medium text-slate-400 ring-1 ring-slate-100">
        {selectedBadge.unlocked
          ? "You unlocked this badge!"
          : "Keep exploring to unlock this badge!"}
      </div>

      {/* Close Button */}
      <button
        type="button"
        onClick={() => setSelectedBadge(null)}
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