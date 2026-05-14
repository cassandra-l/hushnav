import { useState } from "react";
import QuizIntro from "./quiz-intro";
import SensitivityQuiz from "./sensitivity-quiz";
import SensitivityResults from "./sensitivity-results";
import { calculateSensitivityResult, quizQuestions } from "./quiz-data";
import type { QuizAnswers, QuizStep, SensitivityResult } from "./types";

export default function SelfDiscoveryPage() {
  // Controls which screen is visible: intro, quiz, or results.
  const [step, setStep] = useState<QuizStep>("intro");

  // Tracks which quiz question Emily is currently answering.
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Stores Emily’s selected answers locally.
  // This supports the privacy message because we are not sending answers to a backend.
  const [answers, setAnswers] = useState<QuizAnswers>({});

  // Stores the final calculated result after the quiz is completed.
  const [result, setResult] = useState<SensitivityResult | null>(null);

  function handleStartQuiz() {
    setStep("quiz");
  }

  function handleSelectAnswer(questionId: string, optionId: string) {
    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [questionId]: optionId,
    }));
  }

  function handleNextQuestion() {
    const isLastQuestion = currentQuestionIndex === quizQuestions.length - 1;

    if (isLastQuestion) {
      const calculatedResult = calculateSensitivityResult(answers);
      setResult(calculatedResult);
      setStep("results");
      return;
    }

    setCurrentQuestionIndex((previousIndex) => previousIndex + 1);
  }

  // Supports AC 6.1.3.
  // Emily can retake the assessment, which clears old answers and creates updated results.
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

  if (step === "intro") {
    return <QuizIntro onStart={handleStartQuiz} />;
  }

  if (step === "quiz") {
    return (
      <SensitivityQuiz
        answers={answers}
        currentQuestionIndex={currentQuestionIndex}
        onSelectAnswer={handleSelectAnswer}
        onNext={handleNextQuestion}
        onClose={handleCloseQuiz}
      />
    );
  }

  if (step === "results" && result) {
    return <SensitivityResults result={result} onRetake={handleRetakeQuiz} />;
  }

  return null;
}