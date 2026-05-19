import { CheckCircle2, Sliders, Menu, Eye } from "lucide-react";

import { motion } from "framer-motion";
import { Navbar } from "../components/nav-bar";
import { MobileMenu } from "../components/hamburger-menu";
import { useState } from "react";

interface SensoryProfileProps {
  onStart: () => void;
  hasSavedResult: boolean;
  onSeeResult: () => void;
}

export function SensoryProfile({
  onStart,
  hasSavedResult,
  onSeeResult,
}: SensoryProfileProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="w-full max-w-3xl mx-auto font-sans text-[#101828]">
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <Navbar
        className="left-1/2 -translate-x-1/2 top-8 w-auto hidden lg:flex"
        showLogo={false}
      />

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-20 flex items-center px-5 py-4">
        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-4 bg-white/60 backdrop-blur-xl rounded-full border border-white/40 text-[#1E2939] shadow-sm cursor-pointer"
        >
          <Menu size={20} className="text-[#5A9A8E]" />
        </button>
      </header>

      {/* Title Position */}
      <main className="flex-1 overflow-y-auto pt-4 md:pt-35 pb-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto"
        >
          {/* Title Section */}
          <div className="text-left mb-8 md:mb-12">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-2 text-[#1E2939]">
              Sensory Profile
            </h1>
            <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] opacity-60 text-[#5A9A8E]">
              DISCOVER HOW YOU EXPERIENCE THE CITY SOUNDS
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {/* Feature Container */}
            <div className="rounded-2xl border bg-white/40 border-white/50 backdrop-blur-3xl px-6 md:px-8 py-6 space-y-6 mb-8">
              {/* Personalized Profile */}
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 mt-0.5 flex items-center justify-center text-[#5A9A8E] shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[14px] md:text-[15px] text-[#1E2939]">
                    Personalized Profile
                  </h3>
                  <p className="text-[11px] md:text-[12px] opacity-60 text-[#1E2939] leading-relaxed">
                    Understand your sensitivity type and what it means.
                  </p>
                </div>
              </div>

              {/* Divider line between the two features */}
              <div className="h-[1px] bg-[#134E48]/10 w-full" />

              {/* Smart Filter Recommendations */}
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 mt-0.5 flex items-center justify-center text-[#5A9A8E] shrink-0">
                  <Sliders size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[14px] md:text-[15px] text-[#1E2939]">
                    Smart Filter Recommendations
                  </h3>
                  <p className="text-[11px] md:text-[12px] opacity-60 text-[#1E2939] leading-relaxed">
                    Suggested settings tailored to your needs.
                  </p>
                </div>
              </div>
            </div>

            {/* Metadata Specs Panel */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="flex flex-col items-center justify-center p-5 rounded-2xl border bg-white/40 border-white/50 backdrop-blur-3xl text-center">
                <span className="text-2xl font-bold text-[#5A9A8E]">6</span>
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-50 mt-1 text-[#1E2939]">
                  Questions
                </span>
              </div>

              <div className="flex flex-col items-center justify-center p-5 rounded-2xl border bg-white/40 border-white/50 backdrop-blur-3xl text-center">
                <span className="text-2xl font-bold text-[#5A9A8E]">5 min</span>
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-50 mt-1 text-[#1E2939]">
                  Completion Time
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-2 md:px-0">
            <div
              className={`w-full grid gap-3 mb-4 transition-all duration-300 ${
                hasSavedResult ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
              }`}
            >
              {/* Conditional Secondary Action Button */}
              {hasSavedResult && (
                <button
                  type="button"
                  onClick={onStart}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white border border-[#5A9A8E] px-6 py-4 text-xs md:text-sm font-bold text-[#5A9A8E] shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {hasSavedResult ? "Retake Quiz" : "Start Self Discovery"}
                </button>
              )}
              {/* Primary Action Button */}
              <button
                type="button"
                onClick={onSeeResult}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#5A9A8E] px-6 py-4 text-xs md:text-sm font-bold text-white shadow-md hover:bg-[#5A9A8E]/90 transition-colors cursor-pointer"
              >
                <Eye size={15} />
                See Previous Result
              </button>
            </div>

            {/* Privacy Notice Footnote */}
            <p className="text-[11px] text-center pt-1 font-medium text-[#134E48] opacity-80">
              <strong className="font-bold">Your Privacy Matters:</strong> All
              analytical responses are evaluated locally on-device.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
