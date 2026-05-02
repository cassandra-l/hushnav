import type { BadgeDefinition } from "../achievement-badges";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const AUTO_DISMISS_MS = 3000;

type BadgeUnlockedPopupProps = {
  badge: BadgeDefinition;
  onClose: () => void;
};

export function BadgeUnlockedPopup({ badge, onClose }: BadgeUnlockedPopupProps) {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);
  const onCloseRef = useRef(onClose);
  const exitStartedRef = useRef(false);
  const pendingCloseRef = useRef(false);
  const beginDismissRef = useRef<() => void>(() => {});

  useEffect(() => {
    beginDismissRef.current = () => {
      if (exitStartedRef.current) return;
      exitStartedRef.current = true;
      pendingCloseRef.current = true;
      setIsExiting(true);
    };
  }, []);

  useEffect(() => {
    exitStartedRef.current = false;
    pendingCloseRef.current = false;
  }, [badge.id]);

  useEffect(() => {
    const id = window.setTimeout(() => beginDismissRef.current(), AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [badge.id]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-end overflow-x-hidden p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:p-5"
      aria-live="polite"
    >
      <motion.div
        initial={{ opacity: 0, x: 48 }}
        animate={
          isExiting
            ? {
                opacity: 0,
                x: "calc(100% + 3rem)",
                transition: {
                  opacity: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
                  x: {
                    duration: 0.68,
                    ease: [0.19, 1, 0.28, 1],
                  },
                },
              }
            : {
                opacity: 1,
                x: 0,
                transition: { type: "spring", stiffness: 380, damping: 28 },
              }
        }
        onAnimationComplete={() => {
          if (!pendingCloseRef.current) return;
          pendingCloseRef.current = false;
          onCloseRef.current();
        }}
        className={`flex w-full max-w-[min(20rem,calc(100vw-2rem))] gap-3 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-3 shadow-lg shadow-slate-900/8 ${
          isExiting ? "pointer-events-none" : "pointer-events-auto"
        }`}
        role="status"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8EDF1] text-2xl shadow-inner">
          <span aria-hidden>{badge.emoji}</span>
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7CA9A0]">
            New badge
          </p>
          <p className="truncate text-[15px] font-semibold leading-snug text-[#0f172a]">
            {badge.title}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-slate-500">
            {badge.requirementLabel}
          </p>

          <button
            type="button"
            onClick={() => navigate("/achievements/badges")}
            className="mt-2 text-left text-[13px] font-semibold text-[#5A8F85] underline-offset-2 hover:underline"
          >
            View in Achievements
          </button>
        </div>

        <button
          type="button"
          onClick={() => beginDismissRef.current()}
          aria-label="Dismiss badge notification"
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center self-start rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={18} />
        </button>
      </motion.div>
    </div>
  );
}
