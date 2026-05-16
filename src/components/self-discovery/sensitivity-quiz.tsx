import { X } from "lucide-react";
import { quizQuestions } from "./quiz-data";
import type { QuizAnswers } from "./types";

type SensitivityQuizProps = {
  answers: QuizAnswers;
  currentQuestionIndex: number;
  onSelectAnswer: (questionId: string, optionId: string) => void;
  onNext: () => void;
  onClose?: () => void;
};

export default function SensitivityQuiz({
  answers,
  currentQuestionIndex,
  onSelectAnswer,
  onNext,
  onClose,
}: SensitivityQuizProps) {
  const currentQuestion = quizQuestions[currentQuestionIndex];
  const selectedAnswer = answers[currentQuestion.id];

  const progressPercentage = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;
  const isLastQuestion = currentQuestionIndex === quizQuestions.length - 1;

  return (
    <div className="min-h-screen bg-[#EAF5F2] px-5 py-8 text-slate-800">
      <div className="mx-auto max-w-md">
        {/* Close button, matching the small top-right button in the Figma */}
        <div className="mb-10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md"
            aria-label="Close quiz"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        <h1 className="mb-8 text-center text-lg font-semibold">Sensitivity Quiz</h1>

        {/* Progress text and bar */}
        <div className="mb-8">
          <div className="mb-3 flex justify-between text-sm text-slate-600">
            <span>
              Question {currentQuestionIndex + 1} of {quizQuestions.length}
            </span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-[#5A9A8E]" style={{ width: `${progressPercentage}%` }} />
          </div>
        </div>

        {/* Main question card */}
        <section className="rounded-[28px] bg-white/95 p-5 shadow-xl">
          <h2 className="mb-5 text-base font-medium leading-snug text-slate-800">{currentQuestion.question}</h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedAnswer === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onSelectAnswer(currentQuestion.id, option.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left text-sm transition ${
                    isSelected
                      ? "border-[#5A9A8E] bg-[#E3F2EF]"
                      : "border-transparent bg-[#F8FBFA] hover:bg-[#EEF7F5]"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      isSelected ? "border-[#5A9A8E] bg-[#5A9A8E]" : "border-slate-300"
                    }`}
                  >
                    {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                  </span>

                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <button
          type="button"
          onClick={onNext}
          disabled={!selectedAnswer}
          className="mt-6 w-full rounded-2xl bg-[#5A9A8E] px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-[#4E8B80] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isLastQuestion ? "View Results" : "Next Question"}
        </button>
      </div>
    </div>
  );
}