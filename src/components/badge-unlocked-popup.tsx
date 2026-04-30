import type { BadgeDefinition } from "../achievement-badges";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

type BadgeUnlockedPopupProps = {
  badge: BadgeDefinition;
  onClose: () => void;
};

export function BadgeUnlockedPopup({ badge, onClose }: BadgeUnlockedPopupProps) {
  const navigate = useNavigate();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-8 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[340px] rounded-[32px] bg-white px-6 pb-8 pt-10 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close badge popup"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={18} />
        </button>

        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#E8EDF1] text-4xl shadow-inner">
          <span>{badge.emoji}</span>
        </div>

        <h3 className="text-center text-2xl font-bold tracking-tight text-[#0f172a]">
          {badge.title}
        </h3>

        <p className="mt-1 text-center text-[15px] font-medium text-slate-500">
          {badge.requirementLabel}
        </p>

        <div className="mt-8 rounded-[20px] bg-[#f8fafb] px-4 py-4 text-center text-[13px] font-medium text-[#7CA9A0] ring-1 ring-slate-100">
          You unlocked a new badge!
        </div>

        <button
          type="button"
          onClick={() => navigate("/achievements/badges")}
          className="mt-8 w-full rounded-full bg-[#84B0A7] py-3.5 text-[16px] font-bold text-white shadow-lg shadow-teal-900/10 transition-transform active:scale-[0.98]"
        >
          View All Badges
        </button>
      </div>
    </div>
  );
}
