import {
  ArrowRight,
  CheckCircle2,
  Download,
  RotateCcw,
  Volume2,
} from "lucide-react";
import type { SensitivityResult } from "./types";

type SensitivityResultsProps = {
  result: SensitivityResult;
  onRetake: () => void;
};

export default function SensitivityResults({
  result,
  onRetake,
}: SensitivityResultsProps) {
  function handleDownloadResults() {
    const resultText = [
      "HushNav Sensitivity Profile",
      "",
      result.description,
      "",
      "Detected sensitivity patterns:",
      ...result.categories.map(
        (category) => `- ${category.label}: ${category.description}`,
      ),
      "",
      "Suggested next steps:",
      "- Apply the recommended sensitivity filters in HushNav.",
      "- Prioritise quieter safe spaces such as libraries, parks, and museums.",
      "- Retake the assessment if your preferences or travel needs change.",
      "",
      "Note: This assessment is for informational purposes only and is not a medical diagnosis.",
    ].join("\n");

    const blob = new Blob([resultText], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");

    downloadLink.href = url;
    downloadLink.download = "hushnav-sensitivity-profile.txt";
    downloadLink.click();

    URL.revokeObjectURL(url);
  }

  function handleApplyFilters() {
    alert("Recommended sensitivity filters have been applied.");
  }

  const primaryCategory = result.categories[0];

  return (
    <div className="min-h-[calc(100vh-112px)] bg-[#EAF5F2] px-5 pb-8 pt-4 text-slate-800">
      <div className="mx-auto flex max-w-sm flex-col items-center">
        {/* Top result icon */}
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#5A9A8E] shadow-xl">
          <CheckCircle2 className="h-11 w-11 text-white" />
        </div>

        {/* Main result card */}
        <section className="w-full rounded-[28px] bg-white/95 p-6 shadow-2xl">
          <h1 className="mb-3 text-xl font-semibold leading-tight text-slate-800">
            Misophonia Indicators
          </h1>

          <p className="text-sm leading-relaxed text-slate-600">
            You show signs of selective sound sensitivity, where certain sounds
            trigger strong emotional or physical responses. While you may
            tolerate general noise levels, specific sounds or environments may
            be particularly distressing.
          </p>

          <h2 className="mb-3 mt-6 text-sm font-semibold text-slate-800">
            Recommended Filter Settings
          </h2>

          <p className="mb-3 text-xs text-slate-500">
            Sensitivity Preferences
          </p>

          {/* Recommended filter chips */}
          <div className="flex flex-wrap gap-2">
            {result.categories.map((category) => (
              <span
                key={category.label}
                className="inline-flex items-center gap-2 rounded-full border border-[#8FB8D8] bg-[#EAF4FF] px-3 py-2 text-xs font-medium text-slate-700"
              >
                <Volume2 className="h-3.5 w-3.5 text-[#4B7FA8]" />
                {category.label}
              </span>
            ))}
          </div>

          {/* Small explanation of the strongest category */}
          {primaryCategory && (
            <div className="mt-5 rounded-2xl border border-[#B9DCD6] bg-[#F6FBFA] p-4">
              <p className="text-sm font-semibold text-slate-800">
                Main pattern detected
              </p>
              <p className="mt-1 text-sm leading-snug text-slate-600">
                {primaryCategory.description}
              </p>
            </div>
          )}
        </section>

        {/* Disclaimer card */}
        <div className="mt-4 w-full rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-xs leading-relaxed text-slate-700 shadow-lg">
          <strong>Important:</strong> This assessment is for informational
          purposes only and is not a medical diagnosis. If you experience
          significant distress from noise or crowded environments, please
          consult with a healthcare professional such as an audiologist,
          therapist, or physician.
        </div>

        {/* Apply filters button */}
        <button
          type="button"
          onClick={handleApplyFilters}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5A9A8E] px-6 py-4 text-sm font-semibold text-white shadow-lg transition hover:bg-[#4E8B80]"
        >
          Apply to Filters
          <ArrowRight className="h-4 w-4" />
        </button>

        {/* Download and retake buttons */}
        <div className="mt-3 grid w-full grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleDownloadResults}
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