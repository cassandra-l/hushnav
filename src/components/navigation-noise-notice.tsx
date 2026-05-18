import { AlertTriangle, X } from "lucide-react";

type NavigationNoiseNoticeProps = {
  distanceMeters: number;
  noiseLevel: number | null;
  onDismiss: () => void;
};

function formatNoticeDistance(distanceMeters: number) {
  if (distanceMeters < 1000) {
    return `${Math.max(1, Math.round(distanceMeters))} meters ahead`;
  }

  return `${(distanceMeters / 1000).toFixed(1)} kilometers ahead`;
}

export function NavigationNoiseNotice({
  distanceMeters,
  noiseLevel,
  onDismiss,
}: NavigationNoiseNoticeProps) {
  const noiseText =
    noiseLevel !== null ? `${Math.round(noiseLevel)} dB reported` : "Reported high noise";

  return (
    <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-[#F0C8BB] bg-white/95 p-3 shadow-xl backdrop-blur-md">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C7785A]/15 text-[#B65F43]">
          <AlertTriangle size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#1E2939]">
            There is a high-noise area {formatNoticeDistance(distanceMeters)}
          </p>
          <p className="mt-1 text-xs text-[#4A5565]">{noiseText}</p>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6A7282] hover:bg-[#F4F6F5] hover:text-[#1E2939]"
          aria-label="Dismiss noise notice"
        >
          <X size={17} />
        </button>
      </div>
    </div>
  );
}
