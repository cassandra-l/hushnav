import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pause, Play, RefreshCcw } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { XButton } from "./components/x-button";

interface BreathingExerciseProps {
  onClose?: () => void;
}

type Phase = "In" | "Out";

const PREP_SECONDS = 4;
const INHALE_SECONDS = 4;
const EXHALE_SECONDS = 6;
const TOTAL_ROUNDS = 5;

const RADIUS = 106;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function BreathingExercise({ onClose }: BreathingExerciseProps) {
  const navigate = useNavigate();

  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }

    navigate("-1");
  };

  // This controls the 4-second countdown before the actual breathing starts.
  const [isPreparing, setIsPreparing] = useState(true);
  const [prepTimeLeft, setPrepTimeLeft] = useState(PREP_SECONDS);

  const [phase, setPhase] = useState<Phase>("In");
  const [timeLeft, setTimeLeft] = useState(INHALE_SECONDS);
  const [round, setRound] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const phaseDuration = phase === "In" ? INHALE_SECONDS : EXHALE_SECONDS;

  const phaseTitle = isPreparing
    ? "Get Ready"
    : phase === "In"
      ? "Breathe In"
      : "Breathe Out";

  const instructionText = isPreparing
    ? "Your breathing exercise will begin shortly"
    : phase === "In"
      ? "Let the bubble gently expand"
      : "Let the bubble slowly soften";

  const handleRestart = () => {
    setIsPreparing(true);
    setPrepTimeLeft(PREP_SECONDS);
    setPhase("In");
    setTimeLeft(INHALE_SECONDS);
    setRound(1);
    setIsPaused(false);
    setIsComplete(false);
  };

  const handleTogglePause = () => {
    if (isComplete) return;
    setIsPaused((current) => !current);
  };

  // 4-second preparation countdown before the actual breathing exercise starts.
  useEffect(() => {
    if (!isPreparing || isPaused || isComplete) return;

    const prepTimer = window.setInterval(() => {
      setPrepTimeLeft((prev) => {
        if (prev <= 1) {
          setIsPreparing(false);
          setPhase("In");
          setTimeLeft(INHALE_SECONDS);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(prepTimer);
  }, [isPreparing, isPaused, isComplete]);

  // Main breathing timer.
  // This only starts after the preparation countdown has finished.
  useEffect(() => {
    if (isPreparing || isPaused || isComplete) return;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (phase === "In") {
            setPhase("Out");
            return EXHALE_SECONDS;
          }

          if (round >= TOTAL_ROUNDS) {
            setIsComplete(true);
            return 0;
          }

          setRound((currentRound) => currentRound + 1);
          setPhase("In");
          return INHALE_SECONDS;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isPreparing, phase, round, isPaused, isComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#EAF6F3] px-5 py-6 font-sans text-[#1E2939]">
      <style>{`
        @keyframes smooth-ring {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: ${CIRCUMFERENCE};
          }
        }

        .breathing-ring {
          stroke-dasharray: ${CIRCUMFERENCE};
          animation-name: smooth-ring;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }

        .breathing-ring-paused {
          animation-play-state: paused;
        }
      `}</style>

      {/* Calming animated background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-[-120px] top-[-100px] h-96 w-96 rounded-full bg-[#7DB0A6]/20 blur-3xl"
          animate={{ x: [0, 35, 0], y: [0, 25, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute bottom-[-140px] right-[-100px] h-[420px] w-[420px] rounded-full bg-[#D4B896]/20 blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, -25, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/35 blur-3xl"
          animate={{ scale: [1, 1.06, 1], opacity: [0.45, 0.75, 0.45] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-[#DFF0EC]/50" />
      </div>

      <XButton onClose={handleClose} />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center justify-center text-center">
        <div className="relative flex h-[340px] w-[340px] items-center justify-center">
          {/* Layer 1: Outer glow that breathes with the bubble */}
          <motion.div
            className="absolute rounded-full bg-[#7DB0A6]/25 blur-3xl -z-20"
            animate={{
              scale: isPreparing
                ? [0.95, 1.08, 0.95]
                : isComplete
                  ? 1
                  : phase === "In"
                    ? 1.35
                    : 0.85,
              opacity: isPaused ? 0.35 : phase === "In" ? 0.8 : 0.45,
            }}
            transition={{
              duration: isPreparing ? 3 : phaseDuration,
              repeat: isPreparing ? Infinity : 0,
              ease: "easeInOut",
            }}
            style={{
              width: 230,
              height: 230,
            }}
          />

          {/* Layer 2: Main glass bubble */}
          <motion.div
            className="absolute overflow-hidden rounded-full border border-white/80 bg-gradient-to-br from-white/90 via-[#DDF1ED]/85 to-[#7DB0A6]/45 shadow-[0_35px_100px_rgba(90,154,142,0.28)] backdrop-blur-md -z-10"
            animate={{
              scale: isPreparing
                ? [0.95, 1.04, 0.95]
                : isComplete
                  ? 1
                  : phase === "In"
                    ? 1.18
                    : 0.78,
            }}
            transition={{
              duration: isPreparing ? 3 : phaseDuration,
              repeat: isPreparing ? Infinity : 0,
              ease: "easeInOut",
            }}
            style={{
              width: 205,
              height: 205,
            }}
          >
            {/* Bubble highlight */}
            <motion.div
              className="absolute left-9 top-8 h-16 w-24 rounded-full bg-white/60 blur-sm"
              animate={{
                opacity: isPreparing
                  ? [0.5, 0.85, 0.5]
                  : phase === "In"
                    ? 0.85
                    : 0.45,
                scale: isPreparing
                  ? [0.9, 1.1, 0.9]
                  : phase === "In"
                    ? 1.1
                    : 0.85,
              }}
              transition={{
                duration: isPreparing ? 3 : phaseDuration,
                repeat: isPreparing ? Infinity : 0,
                ease: "easeInOut",
              }}
            />

            {/* Soft internal colour movement */}
            <motion.div
              className="absolute bottom-[-35px] left-1/2 h-36 w-44 -translate-x-1/2 rounded-full bg-[#5A9A8E]/25 blur-xl"
              animate={{
                y: isPreparing ? [0, -6, 0] : phase === "In" ? -8 : 12,
                scale: isPreparing
                  ? [0.95, 1.1, 0.95]
                  : phase === "In"
                    ? 1.15
                    : 0.85,
                opacity: isPreparing
                  ? [0.45, 0.7, 0.45]
                  : phase === "In"
                    ? 0.75
                    : 0.45,
              }}
              transition={{
                duration: isPreparing ? 3 : phaseDuration,
                repeat: isPreparing ? Infinity : 0,
                ease: "easeInOut",
              }}
            />

            {/* Small shine dot */}
            <motion.div
              className="absolute right-12 top-12 h-5 w-5 rounded-full bg-white/80"
              animate={{
                opacity: isPreparing
                  ? [0.4, 0.8, 0.4]
                  : phase === "In"
                    ? 0.8
                    : 0.4,
                scale: isPreparing ? [0.8, 1, 0.8] : phase === "In" ? 1 : 0.75,
              }}
              transition={{
                duration: isPreparing ? 3 : phaseDuration,
                repeat: isPreparing ? Infinity : 0,
                ease: "easeInOut",
              }}
            />
          </motion.div>

          {/* Layer 3: Smooth tracking rings */}
          {!isPreparing && !isComplete && (
            <svg
              className="absolute -rotate-90 pointer-events-none z-10"
              width="310"
              height="310"
              viewBox="0 0 310 310"
              aria-hidden="true"
            >
              <circle
                cx="155"
                cy="155"
                r={RADIUS}
                stroke="rgba(255,255,255,0.75)"
                strokeWidth="10"
                fill="transparent"
              />

              <circle
                key={`${phase}-${round}`}
                cx="155"
                cy="155"
                r={RADIUS}
                stroke="#5A9A8E"
                strokeWidth="10"
                fill="transparent"
                strokeLinecap="round"
                className={`breathing-ring ${
                  isPaused ? "breathing-ring-paused" : ""
                }`}
                style={{
                  animationDuration: `${phaseDuration}s`,
                }}
              />
            </svg>
          )}

          {/* Static ring during get-ready countdown */}
          {(isPreparing || isComplete) && (
            <svg
              className="absolute -rotate-90 pointer-events-none z-10"
              width="310"
              height="310"
              viewBox="0 0 310 310"
              aria-hidden="true"
            >
              <circle
                cx="155"
                cy="155"
                r={RADIUS}
                stroke="rgba(255,255,255,0.75)"
                strokeWidth="10"
                fill="transparent"
              />
            </svg>
          )}

          {/* Countdown inside bubble */}
          <div className="absolute flex flex-col items-center justify-center z-20 pointer-events-none">
            <p className="text-6xl font-semibold leading-none tracking-tight text-[#1E2939]">
              {isComplete ? "✓" : isPreparing ? prepTimeLeft : timeLeft}
            </p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#5A9A8E]">
              {isComplete ? "done" : isPreparing ? "ready" : "seconds"}
            </p>
          </div>
        </div>

        <div className="mt-1 min-h-[116px] flex flex-col justify-start w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={isComplete ? "complete" : isPreparing ? "preparing" : phase}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.45 }}
            >
              <h1 className="text-4xl font-semibold tracking-tight text-[#1E2939]">
                {isComplete ? "Nice work" : phaseTitle}
              </h1>

              <p className="mt-3 text-sm leading-6 text-[#4B5563]">
                {isComplete
                  ? "You completed your calming breathing session."
                  : instructionText}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Round tracking row */}
          <div className="mt-3 min-h-[16px] flex items-center justify-center">
            <p
              className={`text-xs font-semibold uppercase tracking-[0.24em] text-[#5A9A8E] transition-opacity duration-300 ${
                !isPreparing && !isComplete
                  ? "opacity-100"
                  : "opacity-0 select-none pointer-events-none"
              }`}
            >
              Round {Math.min(round, TOTAL_ROUNDS)} of {TOTAL_ROUNDS}
            </p>
          </div>
        </div>

        {/* Perfect Symmetrical Balance Control Bar: 
          Both button targets now share the exact layout weight width (w-32) 
          so that their gap center coordinates precisely line up with the page's center axis lines.
        */}
        <div className="mt-4 flex items-center justify-center gap-3 w-full">
          <button
            type="button"
            onClick={handleTogglePause}
            disabled={isComplete}
            className="flex w-32 items-center justify-center gap-2 rounded-2xl bg-[#5A9A8E] py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 h-12"
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
            <span>{isPaused ? "Resume" : "Pause"}</span>
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="flex h-12 w-32 items-center justify-center gap-2 rounded-2xl border border-[#DCE7E3] bg-white/75 text-[#5A9A8E] shadow-sm backdrop-blur-sm transition active:scale-[0.96]"
            aria-label="Restart breathing exercise"
          >
            <RefreshCcw size={15} />
            <span>Redo</span>
          </button>
        </div>

        {/* Centered Instructions Panel Box at the bottom */}
        <div className="mt-7 max-w-sm rounded-3xl border border-white/70 bg-white/55 px-5 py-4 text-center text-sm leading-6 text-[#4B5563] shadow-sm backdrop-blur-md">
          <p>
            Follow the bubble as it grows and shrinks. Breathe in as it expands,
            then slowly breathe out as it becomes smaller.
          </p>
        </div>
      </div>
    </div>
  );
}
