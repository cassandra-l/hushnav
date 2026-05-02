import { BreathingExercise } from "./breathing-exercise";
// import { XButton } from "./components/x-button";
import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
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

export function SupportPage() {
  // const navigate = useNavigate();
  const [showExercise, setShowExercise] = useState(false);
  const [newBadgePopup, setNewBadgePopup] = useState<BadgeDefinition | null>(
    null,
  );

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

  // const handleClose = () => {
  //   // This returns the user to their previous page
  //   navigate(-1);
  // };

  if (showExercise) {
    return <BreathingExercise onClose={() => setShowExercise(false)} />;
  }

  return (
    // creating a full screen container that centers the content in the middle.
    <div className="flex min-h-screen items-center justify-center p-4 font-sans">
      <Navbar
        className="left-1/2 -translate-x-1/2 top-8 w-auto hidden lg:flex"
        showLogo={false}
      />

      {/* <XButton onClose={handleClose} /> */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="max-w-[1200px] w-full flex flex-col items-center"
      >
        {/* card container for the explanation for the breathing exercise */}
        <div className="w-full max-w-sm rounded-[2.5rem] bg-white p-8 shadow-2xl shadow-gray-200/50">
          <div className="flex flex-col items-start gap-4">
            <div className="flex items-center gap-4">
              {/* icon container with svg wind icon inside */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-[#5A9A8E]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12.8 19.6A2 2 0 1 0 14 16H2" />
                  <path d="M17.5 8a2.5 2.5 0 1 1 2 4H2" />
                  <path d="M9.8 4.4A2 2 0 1 1 11 8H2" />
                </svg>
              </div>
              {/* text content for the breathing exercise */}
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  Breathing Techniques
                </h2>
                <p className="text-sm text-slate-500">
                  Calm your mind and reduce stress
                </p>
              </div>
            </div>
            {/* description for the breathing exercise */}
            <p className="mt-2 text-[0.95rem] leading-relaxed text-slate-600">
              Use guided breathing exercises to help manage overstimulation and
              find your calm center.
            </p>
            {/* button to start the breathing exercise */}
            <button
              onClick={() => {
                incrementBreathingUses(1);
                setShowExercise(true);
              }}
              className="mt-4 w-full rounded-full bg-[#7DB0A6] py-4 text-lg font-medium text-[#FFFFFF] shadow-lg shadow-[#7DB0A6]/20 transition hover:opacity-90 cursor-pointer"
            >
              Start Breathing Exercise
            </button>
          </div>
        </div>
      </motion.div>
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
