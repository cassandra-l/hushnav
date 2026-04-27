import { BreathingExercise } from "./breathing-exercise";
import { XButton } from "./components/x-button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function SupportPage() {
  const navigate = useNavigate();
  const [showExercise, setShowExercise] = useState(false);

  const handleClose = () => {
    // This returns the user to their previous page
    navigate(-1);
  };

  if (showExercise) {
    return <BreathingExercise onClose={() => setShowExercise(false)} />;
  }

  return (
    // creating a full screen container that centers the content in the middle.
    <div className="flex min-h-screen items-center justify-center p-4 font-sans">
      <XButton onClose={handleClose} />
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
            onClick={() => setShowExercise(true)}
            className="mt-4 w-full rounded-2xl bg-[#5A9A8E] py-4 text-lg font-medium text-[#FFFFFF] shadow-lg shadow-[#5A9A8E]/20 transition-all hover:bg-[#4d857a] active:scale-95"
          >
            Start Breathing Exercise
          </button>
        </div>
      </div>
    </div>
  );
}
