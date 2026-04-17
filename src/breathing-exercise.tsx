import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { XButton } from "./components/x-button";
import { AnimatePresence, motion } from "framer-motion";

// breathing exercise component that is 4 secs inhale and 6 secs exhale, with a circular progress indicator and text instructions
interface BreathingExerciseProps {
  onClose?: () => void;
}

// defining the phrases of the breathing exercise
type Phase = "In" | "Out";

export function BreathingExercise({ onClose }: BreathingExerciseProps) {
  const navigate = useNavigate();

  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }

    navigate("-1");
  };

  // tracking whether the user is currently inhaling or exhaling
  const [phase, setPhase] = useState<Phase>("In");
  // countdown for the current phase
  const [timeLeft, setTimeLeft] = useState(4);

  // timer logic - runs every second to update the countdown + switch phase
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        // when the countdown reaches 0, switch to the next phase and reset the timer
        if (prev <= 1) {
          const nextPhase = phase === "In" ? "Out" : "In";
          setPhase(nextPhase);
          // reseting the timer based on the phase - 4 secs for inhale, 6 secs for exhale
          return nextPhase === "In" ? 4 : 6;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  return (
    // full screen overlay with centered content, circular progress indicator, and instructions
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#E6F2EF] p-6 font-sans text-[#1E2939]">
      {/* Circular progress indicator */}
      <style>{`
        @keyframes drain {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: 565.48; }
        }
        .animate-drain {
          animation: drain linear infinite;
          stroke-dasharray: 565.48;
        }
      `}</style>

      {/* Close button */}
      <XButton onClose={handleClose} />

      {/* container for the breathing exercise */}
      <div className="relative flex min-h-screen flex-col items-center justify-center">
        {/* circular progress indicator */}
        <div className="relative flex items-center justify-center">
          {/* The breathing circle background */}
          <motion.div
            key={`breathing-circle-${phase}`}
            className="absolute rounded-full"
            style={{
              width: "220px",
              height: "220px",
              background:
                "radial-gradient(circle, rgba(125, 176, 166, 0.4) 0%, rgba(125, 176, 166, 0.2) 50%,rgba(125, 176, 166, 0) 80%)",
            }}
            initial={{ scale: phase === "In" ? 0.82 : 1.25 }}
            animate={{ scale: phase === "In" ? 1.25 : 0.82 }}
            transition={{
              duration: phase === "In" ? 4 : 6,
              ease: "linear",
            }}
          />
          {/* SVG for the circular timer indicator */}
          <svg className="-rotate-90" width="240" height="240">
            <circle
              cx="120"
              cy="120"
              r="90"
              className="stroke-white/30"
              strokeWidth="8"
              fill="transparent"
            />

            {/* animated circle that resets using key={phase} */}
            <circle
              key={phase}
              cx="120"
              cy="120"
              r="90"
              stroke="#7DB0A6"
              strokeWidth="8"
              fill="transparent"
              strokeLinecap="round"
              className="animate-drain"
              style={{ animationDuration: phase === "In" ? "4s" : "6s" }}
            />
          </svg>
          {/* centering the text that displays for the countdown */}
          <div className="absolute flex flex-col items-center">
            <span className="text-[60px] leading-none tracking-tighter">
              {timeLeft}
            </span>
            <span className="text-[12px]">seconds</span>
          </div>
        </div>
        {/* instructions for the breathing exercise */}
        <div className="relative flex h-25 items-center justify-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="absolute"
            >
              <h1 className="whitespace-nowrap text-4xl font-medium tracking-tight text-gray-800">
                {phase === "In" ? "Breathe In" : "Breathe Out"}
              </h1>
              <p className="mt-2 whitespace-nowrap text-[14px] text-[#4b5563]">
                {phase === "In"
                  ? "Inhale slowly through your nose"
                  : "Exhale slowly through your mouth"}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
