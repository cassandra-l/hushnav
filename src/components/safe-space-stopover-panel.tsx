import { useState } from "react";
import {
  MapPin,
  TreePine,
  Book,
  Landmark,
  Church,
  Building2,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import type { SafeSpace } from "../types/route";

type SafeSpaceStopoverPanelProps = {
  safeSpaces: SafeSpace[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onAddStop: (safeSpace: SafeSpace) => void;
};

function renderSafeSpaceIcon(type: SafeSpace["type"]) {
  switch (type) {
    case "park":
      return <TreePine size={16} className="text-[#5A9A8E]" />;
    case "library":
      return <Book size={16} className="text-[#5A9A8E]" />;
    case "museum":
      return <Landmark size={16} className="text-[#5A9A8E]" />;
    case "church":
      return <Church size={16} className="text-[#5A9A8E]" />;
    case "synagogue":
      return <Building2 size={16} className="text-[#5A9A8E]" />;
    default:
      return <MapPin size={16} className="text-[#5A9A8E]" />;
  }
}

export function SafeSpaceStopoverPanel({
  safeSpaces,
  isOpen,
  onToggleOpen,
  onAddStop,
}: SafeSpaceStopoverPanelProps) {
  const [selectedSafeSpace, setSelectedSafeSpace] =
    useState<SafeSpace | null>(null);

  if (safeSpaces.length === 0) {
    return null;
  }

  return (
    <>
      <div className="border-t border-[#E8EEEC] px-5 py-4">
        <button
          type="button"
          onClick={onToggleOpen}
          className="flex w-full items-center justify-between text-left"
        >
          <h3 className="text-sm font-semibold text-[#1E2939]">
            Safe Spaces Along Route
          </h3>

          {isOpen ? (
            <ChevronUp size={18} className="text-[#1E2939]" />
          ) : (
            <ChevronDown size={18} className="text-[#1E2939]" />
          )}
        </button>

        {isOpen && (
          <div className="mt-4 space-y-3">
            {safeSpaces.map((safeSpace) => (
              <button
                key={safeSpace.id}
                type="button"
                onClick={() => setSelectedSafeSpace(safeSpace)}
                className="flex w-full items-start gap-3 rounded-2xl border border-transparent p-2 text-left transition hover:border-[#5A9A8E]/40 hover:bg-[#5A9A8E]/10"
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white/90 bg-white/80 shadow-sm">
                  {renderSafeSpaceIcon(safeSpace.type)}
                </div>

                <div>
                  <p className="text-sm font-medium text-[#1E2939]">
                    {safeSpace.name}
                  </p>

                  <p className="mt-1 text-xs font-medium text-[#5A9A8E]">
                    {safeSpace.subTheme}
                  </p>

                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6A7282]">
                    {safeSpace.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedSafeSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5">
          <div className="relative w-full max-w-sm rounded-[28px] border border-white bg-white p-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedSafeSpace(null)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#F4F7F6] text-[#6A7282]"
              aria-label="Close add stop confirmation"
            >
              <X size={16} />
            </button>

            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/90 bg-white/80 shadow-sm">
              {renderSafeSpaceIcon(selectedSafeSpace.type)}
            </div>

            <h3 className="pr-10 text-lg font-semibold text-[#1E2939]">
              {selectedSafeSpace.name}
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#4A5565]">
              {selectedSafeSpace.description}
            </p>

            <div className="mt-4 rounded-2xl bg-[#F8FBFA] p-4">
              <p className="text-xs text-[#6A7282]">Noise Level</p>
              <p className="mt-1 text-base font-medium text-[#5A9A8E]">
                Quiet
              </p>
              <p className="mt-1 text-xs text-[#6A7282]">
                Very peaceful environment
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  onAddStop(selectedSafeSpace);
                  setSelectedSafeSpace(null);
                }}
                className="rounded-2xl bg-[#7DB0A6] py-3 text-sm font-medium text-white shadow-sm"
              >
                Add Stop
              </button>

              <button
                type="button"
                onClick={() => setSelectedSafeSpace(null)}
                className="rounded-2xl bg-white py-3 text-sm font-medium text-[#1E2939] shadow-sm ring-1 ring-[#E8EEEC]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}