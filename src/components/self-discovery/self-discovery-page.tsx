import { useState } from "react";
import QuizIntro from "./quiz-intro";
import SensitivityQuiz from "./sensitivity-quiz";
import SensitivityResults from "./sensitivity-results";
import { calculateSensitivityResult, quizQuestions } from "./quiz-data";
import type { QuizAnswers, QuizStep, SensitivityResult } from "./types";

// Import shared navbar so the page matches the rest of HushNav.
import { Navbar } from "../nav-bar";

export default function SelfDiscoveryPage() {
  const [step, setStep] = useState<QuizStep>("intro");

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [answers, setAnswers] = useState<QuizAnswers>({});

  const [result, setResult] = useState<SensitivityResult | null>(null);

  // Starts the quiz flow from the intro screen.
  function handleStartQuiz() {
    setStep("quiz");
  }

  // Saves selected answers locally.
  function handleSelectAnswer(questionId: string, optionId: string) {
    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [questionId]: optionId,
    }));
  }

  // Handles next question navigation and final result calculation.
  function handleNextQuestion() {
    const isLastQuestion =
      currentQuestionIndex === quizQuestions.length - 1;

    if (isLastQuestion) {
      const calculatedResult = calculateSensitivityResult(answers);

      setResult(calculatedResult);
      setStep("results");

      return;
    }

    setCurrentQuestionIndex((previousIndex) => previousIndex + 1);
  }

  // Allows Emily to retake the assessment.
  // Supports AC 6.1.3.
  function handleRetakeQuiz() {
    setAnswers({});
    setResult(null);
    setCurrentQuestionIndex(0);
    setStep("quiz");
  }

  // Resets the flow if the user closes the quiz.
  function handleCloseQuiz() {
    setAnswers({});
    setResult(null);
    setCurrentQuestionIndex(0);
    setStep("intro");
  }

  return (
    <main className="min-h-screen bg-[#EAF5F2]">
      
      {/* Shared HushNav navbar */}
      <Navbar
        showLogo={true}
        className="hidden lg:flex"
      />

      {/* Adds spacing so content does not go underneath navbar */}
      <div className="pt-28">
        {step === "intro" && (
          <QuizIntro
            onStart={handleStartQuiz}
            onBack={handleCloseQuiz}
          />
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
          <SensitivityResults
            result={result}
            onRetake={handleRetakeQuiz}
          />
        )}
      </div>
    </main>
  );
}