import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { SensoryProfile } from "./sensory-profile";
import SensitivityQuiz from "./quiz-UI";
import SensitivityResults from "./sensory-result";
import type { QuizAnswers, QuizStep, SensitivityResult } from "../types/quiz";
import { calculateSensitivityResult } from "./quiz-data";

const LOCAL_STORAGE_RESULT_KEY = "hushnav:sensoryProfileResult";

export default function SensoryProfilePage() {
  const [step, setStep] = useState<QuizStep>("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});

  // Dynamic initializers to catch storage on load
  const [result, setResult] = useState<SensitivityResult | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_RESULT_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved sensory result", e);
        return null;
      }
    }
    return null;
  });

  const [hasSavedResult, setHasSavedResult] = useState<boolean>(() => {
    return localStorage.getItem(LOCAL_STORAGE_RESULT_KEY) !== null;
  });

  const handleQuizComplete = (finalAnswers: QuizAnswers) => {
    const calculatedResult = calculateSensitivityResult(finalAnswers);
    setResult(calculatedResult);
    localStorage.setItem(
      LOCAL_STORAGE_RESULT_KEY,
      JSON.stringify(calculatedResult),
    );
    setHasSavedResult(true);
    setStep("results");
  };

  function handleSelectAnswer(questionId: string, value: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleCloseQuiz() {
    setStep("intro");
    setCurrentQuestionIndex(0);
    setAnswers({});
  }

  const pageBackgroundClass =
    step === "intro"
      ? "bg-linear-to-b from-[#ffffff] via-[#d5e8e5] to-[#cfe3df]"
      : "bg-[#E6F2EF]";

  // const slideVariants = {
  //   initial: { x: "100vw", opacity: 0 },
  //   animate: { x: 0, opacity: 1 },
  //   exit: { x: "-100vw", opacity: 0 },
  // };

  // const springTransition = {
  //   type: "spring",
  //   damping: 25,
  //   stiffness: 120,
  // } as const;

  return (
    <div
      className={`min-h-screen ${pageBackgroundClass} transition-colors duration-500 overflow-hidden relative flex flex-col`}
    >
      <AnimatePresence mode="popLayout">
        {/* Intro Layout */}
        {step === "intro" && (
          // <motion.div
          //   key="intro"
          //   variants={slideVariants}
          //   initial={false} // Prevents snapping layout translations on component mount load
          //   animate="animate"
          //   exit="exit"
          //   transition={springTransition}
          //   className="w-full flex-1 flex flex-col"
          // >
          <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
            {/* Feed the layout properties straight into your component */}
            <SensoryProfile
              onStart={() => setStep("quiz")}
              hasSavedResult={hasSavedResult}
              onSeeResult={() => setStep("results")}
            />
          </div>
          // </motion.div>
        )}

        {/* Question Panel */}
        {step === "quiz" && (
          // <motion.div
          //   key="quiz"
          //   variants={slideVariants}
          //   initial="initial"
          //   animate="animate"
          //   exit="exit"
          //   transition={springTransition}
          //   className="w-full"
          // >
          <SensitivityQuiz
            key={currentQuestionIndex === 0 ? "fresh-quiz" : "active-quiz"}
            answers={answers}
            currentQuestionIndex={currentQuestionIndex}
            setCurrentQuestionIndex={setCurrentQuestionIndex}
            onSelectAnswer={handleSelectAnswer}
            onNext={() => handleQuizComplete(answers)}
            onClose={handleCloseQuiz}
          />
          // </motion.div>
        )}

        {/* Result Panel */}
        {step === "results" && (
          // <motion.div
          //   key="results"
          //   variants={slideVariants}
          //   initial="initial"
          //   animate="animate"
          //   exit="exit"
          //   transition={springTransition}
          //   className="w-full"
          // >
          <SensitivityResults
            result={result!}
            onRetake={() => {
              // Clear active attempt only
              // Preserve previous completed result
              setAnswers({});
              setCurrentQuestionIndex(0);

              // Small ordering improvement
              requestAnimationFrame(() => {
                setStep("quiz");
              });
            }}
            onClose={() => setStep("intro")}
          />
          // </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
