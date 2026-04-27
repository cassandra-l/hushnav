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

// Props for the safe space stopover panel.
// This component handles expanding the safe space list, selecting a safe space,
// confirming Add Stop, displaying the selected stop, and removing the stop.
type SafeSpaceStopoverPanelProps = {
  safeSpaces: SafeSpace[];
  selectedStop: SafeSpace | null;
  isOpen: boolean;
  onToggleOpen: () => void;
  onAddStop: (safeSpace: SafeSpace) => void;
  onRemoveStop: () => void;
};

// Returns the correct Lucide icon for each safe space type.
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

// Main safe space stopover panel component.
export function SafeSpaceStopoverPanel({
  safeSpaces,
  selectedStop,
  isOpen,
  onToggleOpen,
  onAddStop,
  onRemoveStop,
}: SafeSpaceStopoverPanelProps) {
  // Stores the safe space Emily clicked before confirming Add Stop.
  const [selectedSafeSpace, setSelectedSafeSpace] =
    useState<SafeSpace | null>(null);

  // If there are no safe spaces and no selected stop, nothing needs to render.
  if (safeSpaces.length === 0 && !selectedStop) {
    return null;
  }

  return (
    <>
      <div className="border-t border-[#E8EEEC] px-5 py-4">
        {/* Selected stop card shown after Emily adds a safe space stopover. */}
        {selectedStop && (
          <div className="mb-4 rounded-2xl border border-[#5A9A8E]/40 bg-[#5A9A8E]/10 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white/90 bg-white/80 shadow-sm">
                  {renderSafeSpaceIcon(selectedStop.type)}
                </div>

                <div>
                  <p className="text-xs font-medium text-[#5A9A8E]">
                    Next Stop
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#1E2939]">
                    {selectedStop.name}
                  </p>

                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6A7282]">
                    {selectedStop.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onRemoveStop}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#6A7282] shadow-sm hover:bg-[#F4F7F6]"
                aria-label="Remove selected safe space stop"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Expand/collapse button for the safe spaces along route list. */}
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

        {/* Expanded safe space list. Each item can open the confirmation popup. */}
        {isOpen && (
          <div className="mt-4 space-y-3">
            {safeSpaces.map((safeSpace) => {
              const isAlreadySelected = selectedStop?.id === safeSpace.id;

              return (
                <button
                  key={safeSpace.id}
                  type="button"
                  onClick={() => setSelectedSafeSpace(safeSpace)}
                  disabled={isAlreadySelected}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-2 text-left transition ${
                    isAlreadySelected
                      ? "border-[#5A9A8E]/40 bg-[#5A9A8E]/10 opacity-80"
                      : "border-transparent hover:border-[#5A9A8E]/40 hover:bg-[#5A9A8E]/10 hover:scale-[1.01]"
                  }`}
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white/90 bg-white/80 shadow-sm">
                    {renderSafeSpaceIcon(safeSpace.type)}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-[#1E2939]">
                      {safeSpace.name}
                    </p>

                    <p className="mt-1 text-xs font-medium text-[#5A9A8E]">
                      {isAlreadySelected ? "Selected stop" : safeSpace.subTheme}
                    </p>

                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6A7282]">
                      {safeSpace.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation modal shown after Emily selects a safe space from the list. */}
      {selectedSafeSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5">
          <div className="relative w-full max-w-[340px] rounded-[28px] border border-white bg-white p-5 shadow-2xl">
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