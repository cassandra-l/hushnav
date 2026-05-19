import { useNavigate, useLocation } from "react-router-dom";
import { BreathingExercise } from "./breathing-exercise";
import { useEffect, useState } from "react";
import type { BadgeDefinition } from "./achievement-badges";
import { BadgeUnlockedPopup } from "./components/badge-unlocked-popup";
import { motion } from "framer-motion";
import {
  peekNextPendingBadgePopup,
  shiftPendingBadgePopupQueue,
  incrementBreathingUses,
  subscribeToAchievementsUpdates,
} from "./achievements-store";
import { Navbar } from "./components/nav-bar";
import { Menu } from "lucide-react";
import { MobileMenu } from "./components/hamburger-menu";

export function SupportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showExercise, setShowExercise] = useState(false);
  const [newBadgePopup, setNewBadgePopup] = useState<BadgeDefinition | null>(
    null,
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const tryShowNewBadge = () => {
      if (showExercise) return;

      setNewBadgePopup((current) => {
        if (current) return current;
        return peekNextPendingBadgePopup();
      });
    };

    tryShowNewBadge();
    return subscribeToAchievementsUpdates(tryShowNewBadge);
  }, [showExercise]);

  if (showExercise) {
    return (
      <BreathingExercise
        onClose={() => {
          setShowExercise(false);
        }}
      />
    );
  }

  const steps = [
    {
      duration: "4s",
      label: "Inhale",
      desc: "Breathe in quietly through your nose, expanding your diaphragm.",
    },
    {
      duration: "6s",
      label: "Exhale",
      desc: "Release slowly through your mouth, emptying your lungs fully.",
    },
  ];

  return (
    <div className="flex flex-col h-dvh overflow-hidden font-sans text-[#101828]">
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* Global Background Layer Canvas */}
      <div
        className="fixed inset-0 -z-10 bg-linear-to-b from-[#ffffff] via-[#d5e8e5] to-[#cfe3df]"
        aria-hidden="true"
      />

      {/* Global Desktop Floating Navigation Bar */}
      <Navbar
        className="left-1/2 -translate-x-1/2 top-8 w-auto hidden lg:flex"
        showLogo={false}
      />

      {/* Mobile Responsive Header */}
      <header className="lg:hidden sticky top-0 z-20 flex items-center px-5 py-4">
        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-4 bg-white/60 backdrop-blur-xl rounded-full border border-white/40 text-[#1E2939] shadow-sm"
        >
          <Menu size={20} className="text-[#5A9A8E]" />
        </button>
      </header>

      {/* Core View Container Layout */}
      <main className="flex-1 overflow-y-auto pt-6 md:pt-35 pb-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto"
        >
          {/* Header Block cloned from Soundscape layout structure typography */}
          <div className="text-left mb-8 md:mb-12">
            <h1 className="text-5xl md:text-6xl font-medium tracking-tight mb-2 text-[#1E2939]">
              Breath Work
            </h1>
            <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] opacity-60 text-[#5A9A8E]">
              REGULATE YOUR NERVOUS SYSTEM WITH GUIDED EXERCISE
            </p>
          </div>

          {/* Activity Glassmorphic Content Panel Box */}
          <div className="p-6 md:p-8 rounded-2xl bg-white/40 border border-white/50 backdrop-blur-3xl shadow-sm text-left space-y-6">
            {/* Upper Context Block with Expanded Informative Copy */}
            <div className="space-y-4">
              <div className="space-y-3 text-[14px] md:text-[15px] leading-relaxed font-medium text-[#1E2939]/80">
                <p>
                  This guided breathing exercise uses a deep pacing rhythm
                  designed to actively signals your heart and brain to slow
                  down. This helps tone down overstimulation and leads you to
                  re-establish your calm center.
                </p>
              </div>
            </div>

            {/* Separator Divider Line */}
            <div className="h-[1px] w-full bg-[#1E2939]/5" />

            {/* Clear Two-Step Breathing Rhythm Timeline */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-[0.15em] text-[#1E2939]/40 mb-1">
                The Exercise Cadence
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex flex-row md:flex-col items-center md:items-start gap-4 p-4 rounded-xl bg-white/50 border border-white/80 shadow-xs transition-all"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5A9A8E]/10 text-[#5A9A8E] font-mono text-xs font-black">
                      {step.duration}
                    </div>
                    <div>
                      <h4 className="text-[14px] font-black text-[#1E2939]">
                        {step.label}
                      </h4>
                      <p className="text-[11px] md:text-[12px] font-medium text-[#1E2939]/60 leading-tight mt-0.5">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Trigger Button mounted outside the container */}
          <button
            className="mt-4 w-full rounded-2xl bg-[#5A9A8E] py-4 text-sm font-bold text-white shadow-md hover:opacity-85 transition-all active:scale-[0.99] cursor-pointer"
            onClick={() => {
              incrementBreathingUses(1);

              navigate("/breathing-exercise", {
                state: { fromMap: location.state?.fromMap },
              });
            }}
          >
            Start Breathing Exercise
          </button>
        </motion.div>
      </main>

      {/* Achievements Popup Queue Banner Layer */}
      {newBadgePopup && (
        <BadgeUnlockedPopup
          key={newBadgePopup.id}
          badge={newBadgePopup}
          onClose={() => {
            shiftPendingBadgePopupQueue();
            setNewBadgePopup(peekNextPendingBadgePopup());
          }}
        />
      )}
    </div>
  );
}
