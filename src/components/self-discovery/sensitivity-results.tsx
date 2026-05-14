import { Download, RotateCcw, SlidersHorizontal } from "lucide-react";
import type { SensitivityResult } from "./types";

type SensitivityResultsProps = {
  result: SensitivityResult;
  onRetake: () => void;
};

export default function SensitivityResults({ result, onRetake }: SensitivityResultsProps) {
  return (
    <div className="min-h-screen bg-[#EAF5F2] px-5 py-8 text-slate-800">
      <div className="mx-auto max-w-md">
        {/* Result icon */}
        <div className="mb-6 mt-4 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#5A9A8E] shadow-xl">
            <SlidersHorizontal className="h-11 w-11 text-white" />
          </div>
        </div>

        {/* Results card */}
        <section className="rounded-[28px] bg-white/95 p-6 shadow-2xl">
          <h1 className="mb-2 text-2xl font-semibold leading-tight text-slate-800">{result.title}</h1>

          <p className="mb-6 text-sm leading-relaxed text-slate-600">{result.description}</p>

          <h2 className="mb-3 text-base font-semibold text-slate-800">Your possible sensitivity patterns:</h2>

          <div className="space-y-3">
            {result.categories.map((category) => (
              <div key={category.label} className="rounded-2xl border border-[#B9DCD6] bg-[#F6FBFA] p-4">
                <p className="text-sm font-semibold text-slate-800">{category.label}</p>
                <p className="mt-1 text-sm leading-snug text-slate-600">{category.description}</p>
              </div>
            ))}
          </div>

          {/* Disclaimer to avoid presenting this as medical advice */}
          <div className="mt-5 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm leading-relaxed text-slate-700">
            <strong>Important:</strong> This assessment is for informational purposes only and is not a medical diagnosis.
            If you experience significant distress from noise or crowded environments, please consider speaking with a
            healthcare professional.
          </div>
        </section>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-[#5A9A8E] shadow-md"
          >
            <Download className="h-4 w-4" />
            Download
          </button>

          <button
            type="button"
            onClick={onRetake}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-[#5A9A8E] shadow-md"
          >
            <RotateCcw className="h-4 w-4" />
            Retake
          </button>
        </div>
      </div>
    </div>
  );
}