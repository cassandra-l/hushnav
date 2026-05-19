import { quizQuestions } from "./quiz-data";
import type { QuizAnswers } from "../types/quiz";
import { XButton } from "../components/x-button";

type SensitivityQuizProps = {
  answers: QuizAnswers;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: React.Dispatch<React.SetStateAction<number>>;
  onSelectAnswer: (questionId: string, value: number) => void;
  onNext: () => void;
  onClose: () => void;
};

export default function SensitivityQuiz({
  answers,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  onSelectAnswer,
  onNext,
  onClose,
}: SensitivityQuizProps) {
  const currentQuestion = quizQuestions[currentQuestionIndex];
  const selectedValue = answers[currentQuestion.id];
  const isLastQuestion = currentQuestionIndex === quizQuestions.length - 1;

  const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;

  function handlePreviousQuestion() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }

  function handleContinue() {
    if (isLastQuestion) {
      onNext();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto font-sans text-[#101828]">
      <XButton onClose={onClose} />
      {/* <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <Navbar
        className="left-1/2 -translate-x-1/2 top-8 w-auto hidden lg:flex"
        showLogo={false}
      /> */}

      {/* Hamburger Menu */}
      {/* <header className="lg:hidden sticky top-0 z-20 flex items-center px-5 py-4">
        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-4 bg-white/60 backdrop-blur-xl rounded-full border border-white/40 text-[#1E2939] shadow-sm cursor-pointer"
        >
          <Menu size={20} className="text-[#5A9A8E]" />
        </button>
      </header> */}

      <main className="px-6 pb-12 pt-4 lg:pt-32">
        <div className="w-full bg-white/50 border border-white/80 backdrop-blur-3xl px-6 md:px-8 py-7 mt-30 lg:mt-0 rounded-[28px] shadow-xl shadow-slate-100/20 mb-6">
          {/* Section Breaking Escapement Links */}
          {/* <div className="flex items-center justify-between mb-6"> */}
          {/* <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
              Back to Intro
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/80 border border-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              aria-label="Close quiz"
            >
              <X size={14} />
            </button> */}
          {/* </div> */}

          {/* Progress Tracker */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-end items-end">
              <span className="text-xs font-bold text-slate-400">
                Question {currentQuestionIndex + 1}{" "}
                <span className="font-medium text-slate-300">/</span>{" "}
                {quizQuestions.length}
              </span>
            </div>
            <div className="h-1.5 w-full bg-gray-100/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#5A9A8E] transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Current Question Context */}
          <div className="mb-6 min-h-[52px] flex items-center">
            <h3 className="text-base md:text-[17px] font-bold leading-snug text-[#1E2939]">
              {currentQuestion.question}
            </h3>
          </div>

          {/* Selection Option*/}
          <div className="space-y-2.5">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedValue === option.value;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    onSelectAnswer(currentQuestion.id, option.value)
                  }
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-200 border text-left cursor-pointer ${
                    isSelected
                      ? "bg-[#EAF5F2] border-[#5A9A8E] text-[#134E48] font-semibold shadow-xs"
                      : "bg-white/80 border-white/40 hover:bg-white hover:border-slate-200 text-[#1E2939]"
                  }`}
                >
                  <span className="text-[14px] md:text-[15px] pr-4">
                    {option.label}
                  </span>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "border-[#5A9A8E] bg-[#5A9A8E]"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="grid grid-cols-2 gap-4 px-2 md:px-0">
          <button
            type="button"
            disabled={currentQuestionIndex === 0}
            onClick={handlePreviousQuestion}
            className="w-full py-4 bg-white border border-[#5A9A8E] hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white/80 text-[#5A9A8E] font-semibold text-xs md:text-sm rounded-2xl transition-colors cursor-pointer disabled:cursor-not-allowed text-center shadow-md shadow-slate-100/10"
          >
            Previous Question
          </button>

          <button
            type="button"
            disabled={!selectedValue}
            onClick={handleContinue}
            className="w-full py-4 bg-[#5A9A8E] disabled:bg-gray-200/80 text-white font-bold text-xs md:text-sm rounded-2xl shadow-md hover:bg-[#5A9A8E]/90 disabled:cursor-not-allowed disabled:text-gray-400 transition-colors text-center cursor-pointer"
          >
            {isLastQuestion ? "View Results" : "Continue"}
          </button>
        </div>
      </main>
    </div>
  );
}
