import { Check, Trophy } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onViewBadges: () => void;
}

export function ReportSuccess(props: Props) {
  if (!props.isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-md px-7">
      <div className="relative w-full flex flex-col items-center max-w-md rounded-3xl bg-white/70 border border-white/80 p-6 shadow-2xl">
        {/* Check Icon */}
        <div className="flex justify-center items-center mb-2 border border-white/60 bg-[#7DB0A6] w-24 h-24 rounded-full text-white">
          <Check size={48} strokeWidth={3} />
        </div>
        {/* Title and description  */}
        <div className="flex flex-col items-center ">
          <h2 className="text-[24px] font-medium text-[#1E2939]">
            Report Successful!
          </h2>
          <div className="mt-3 text-sm leading-6 text-[#4A5565] text-center">
            Thank you for submitting your report. <br />
            Your report will help improve the HushNav community.
          </div>
        </div>
        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full">
          {/* Done Button */}
          <button
            className="cursor-pointer mt-6 w-full rounded-full bg-[#7DB0A6] px-4 py-3 text-md font-medium text-white shadow-lg transition hover:opacity-95"
            onClick={props.onClose}
          >
            Done
          </button>
          {/* View Badges Button */}
          <div className="flex items-center justify-center gap-2 cursor-pointer w-full rounded-full bg-white px-4 py-3 text-md font-medium text-[364153] shadow-lg transition hover:opacity-80">
            <Trophy size={24} />
            <button onClick={props.onViewBadges}>View Badges</button>
          </div>
        </div>
      </div>
    </div>
  );
}
