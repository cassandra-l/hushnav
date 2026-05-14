import { useState } from "react";
import QuizIntro from "./quiz-intro";
import SensitivityQuiz from "./sensitivity-quiz";
import SensitivityResults from "./sensitivity-results";
import { calculateSensitivityResult, quizQuestions } from "./quiz-data";
import type { QuizAnswers, QuizStep, SensitivityResult } from "./types";
import { Navbar } from "../nav-bar";
import { MobileMenu } from "../hamburger-menu";
import { Menu } from "lucide-react";
import { motion } from "framer-motion";

export default function SelfDiscoveryPage() {
  const [step, setStep] = useState<QuizStep>("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [result, setResult] = useState<SensitivityResult | null>(null);

  // Mobile menu state logic
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function handleStartQuiz() {
    setStep("quiz");
  }

  function handleSelectAnswer(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  function handleNextQuestion() {
    const isLast = currentQuestionIndex === quizQuestions.length - 1;
    if (isLast) {
      setResult(calculateSensitivityResult(answers));
      setStep("results");
      return;
    }
    setCurrentQuestionIndex((prev) => prev + 1);
  }

  function handleRetakeQuiz() {
    setAnswers({});
    setResult(null);
    setCurrentQuestionIndex(0);
    setStep("quiz");
  }

  function handleCloseQuiz() {
    setAnswers({});
    setResult(null);
    setCurrentQuestionIndex(0);
    setStep("intro");
  }

  return (
    <main className="min-h-screen bg-[#EAF5F2] flex flex-col font-sans">
      {/* Mobile Menu & Header */}
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <header className="lg:hidden sticky top-0 z-20 flex items-center border-b border-slate-200 bg-white px-5 py-4">
        <button
          className="p-4 bg-white/40 backdrop-blur-md rounded-full border border-white/20 text-[#1E2939] shadow-sm cursor-pointer"
          onClick={() => setIsMenuOpen(true)}
        >
          <Menu size={20} />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-[#1e293b] mr-10">
          Sensory Profile
        </h1>
      </header>

      {/* Desktop Navbar */}
      <Navbar
        showLogo={false}
        className="hidden lg:flex left-1/2 -translate-x-1/2"
      />

      {/* Entrance animation */}
      <div className="flex-1 flex items-center justify-center p-6 pt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-[1200px] w-full flex flex-col items-center"
        >
          {step === "intro" && (
            <QuizIntro onStart={handleStartQuiz} onBack={handleCloseQuiz} />
          )}

          {step === "quiz" && (
            <SensitivityQuiz
              answers={answers}
              currentQuestionIndex={currentQuestionIndex}
              onSelectAnswer={handleSelectAnswer}
              onNext={handleNextQuestion}
              onClose={handleCloseQuiz}
            />
          )}

          {step === "results" && result && (
            <SensitivityResults result={result} onRetake={handleRetakeQuiz} />
          )}
        </motion.div>
      </div>
    </main>
  );
}
