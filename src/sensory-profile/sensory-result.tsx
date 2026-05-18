import { RefreshCw, SlidersVertical } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import type { SensitivityResult } from "../types/quiz";

type SensitivityResultsProps = {
  result: SensitivityResult;
  onRetake: () => void;
};

export default function SensitivityResults({
  result,
  onRetake,
}: SensitivityResultsProps) {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-2xl mx-auto px-6 py-8 md:py-16 font-sans text-[#101828] flex flex-col items-center justify-center min-h-[80vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full text-center flex flex-col items-center space-y-8"
      >
        {/* Profile Headline Callouts */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#5A9A8E]">
            Your Sensory Profile
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#1E2939]">
            {result.title}
          </h1>
          <p className="text-sm md:text-base text-[#1E2939]/70 max-w-xl mx-auto leading-relaxed pt-2">
            {result.description}
          </p>
          {result.intensityMessage && (
            <p className="text-xs font-semibold text-[#5A9A8E] tracking-wide pt-1">
              {result.intensityMessage}
            </p>
          )}
        </div>

        {/* Recommendations */}
        <div className="w-full max-w-md space-y-4 text-left">
          {/* Recommended Filters */}
          <div className="w-full bg-white/40 border border-white/60 backdrop-blur-3xl rounded-2xl px-5 py-4 shadow-sm shadow-slate-100/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E2939]/70 mb-3">
              Recommended Audio Filters
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.recommendedFilters.map((filter, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-[#5A9A8E]/15 border border-[#5A9A8E]/40 text-xs font-medium text-[#2D3142] rounded-full shadow-xs"
                >
                  {filter}
                </span>
              ))}
            </div>
          </div>

          {/* Suggested Safe Spaces */}
          {result.suggestedSpaces && result.suggestedSpaces.length > 0 && (
            <div className="w-full bg-white/40 border border-white/60 backdrop-blur-3xl rounded-2xl px-5 py-4 shadow-sm shadow-slate-100/10">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E2939]/70 mb-3">
                Suggested Low-Decibel Zones
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.suggestedSpaces.map((space, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-[#5A9A8E]/15 border border-[#5A9A8E]/40 text-xs font-medium text-[#2D3142] rounded-full shadow-xs"
                  >
                    {space}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls & Disclaimer Group */}
        <div className="w-full max-w-md ">
          {/* Dual Action Buttons Row Grid */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              type="button"
              onClick={onRetake}
              className="w-full py-4 bg-white border border-[#5A9A8E] hover:bg-gray-50 flex items-center justify-center gap-2 text-[#5A9A8E] font-bold text-xs md:text-sm rounded-2xl transition-all cursor-pointer shadow-md shadow-slate-100/10"
            >
              <RefreshCw size={15} className="text-[#5A9A8E]" />
              Retake Quiz
            </button>

            <button
              type="button"
              onClick={() => navigate("/filter_page")}
              className="w-full py-4 bg-[#5A9A8E] hover:bg-[#5A9A8E]/90 text-white flex items-center justify-center gap-2 font-bold text-xs md:text-sm rounded-2xl transition-all cursor-pointer shadow-md"
            >
              <SlidersVertical size={15} />
              Apply to Filter
            </button>
          </div>

          {/* Medical Disclaimer Footnote Row */}
          <div className="text-[10px] md:text-[11px] font-medium text-[#5A9A8E] text-center px-4 pt-1">
            <p>
              This self-assessment tool is not intended for clinical medical
              diagnostic purposes.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
