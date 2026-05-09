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
  ArrowUp,
  ArrowDown,
  Plus,
  Check,
  Trash2,
} from "lucide-react";
import type { SafeSpace } from "../types/route";

// Props for the safe space stopover panel.
// This version supports multiple ordered stopovers and reordering.
type SafeSpaceStopoverPanelProps = {
  safeSpaces: SafeSpace[];
  selectedStops: SafeSpace[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onAddStop: (safeSpace: SafeSpace) => void;
  onRemoveStop: (safeSpaceId: number) => void;
  onMoveStopUp: (safeSpaceId: number) => void;
  onMoveStopDown: (safeSpaceId: number) => void;
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
  selectedStops,
  isOpen,
  onToggleOpen,
  onAddStop,
  onRemoveStop,
  onMoveStopUp,
  onMoveStopDown,
}: SafeSpaceStopoverPanelProps) {
  // Stores the safe space Emily clicked so she can view details before adding it.
  const [selectedSafeSpace, setSelectedSafeSpace] = useState<SafeSpace | null>(
    null,
  );

  if (safeSpaces.length === 0 && selectedStops.length === 0) {
    return null;
  }

  const selectedStopIds = new Set(selectedStops.map((stop) => stop.id));

  return (
    <>
      <div className="border-t border-[#E8EEEC] px-5 py-4">
        {/* Ordered stopover list shown after Emily adds one or more safe spaces. */}
        {selectedStops.length > 0 && (
          <div className="mb-4 space-y-3">
            {selectedStops.map((stop, index) => {
              const isFirstStop = index === 0;
              const isLastStop = index === selectedStops.length - 1;

              return (
                <div
                  key={stop.id}
                  className="rounded-2xl border border-[#5A9A8E]/40 bg-[#5A9A8E]/10 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSafeSpace(stop);
                      }}
                      className="flex min-w-0 flex-1 items-start gap-3 text-left"
                      aria-label={`View details for ${stop.name}`}
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white/90 bg-white/80 shadow-sm">
                        {renderSafeSpaceIcon(stop.type)}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#5A9A8E]">
                          Stop {index + 1}
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#1E2939]">
                          {stop.name}
                        </p>

                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6A7282]">
                          {stop.description}
                        </p>
                      </div>
                    </button>

                    <div className="flex shrink-0 flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => onMoveStopUp(stop.id)}
                        disabled={isFirstStop}
                        className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#5A9A8E] shadow-sm hover:bg-[#F4F7F6] disabled:cursor-not-allowed disabled:opacity-35"
                        aria-label={`Move ${stop.name} up`}
                        title="Move stop up"
                      >
                        <ArrowUp size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onMoveStopDown(stop.id)}
                        disabled={isLastStop}
                        className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#5A9A8E] shadow-sm hover:bg-[#F4F7F6] disabled:cursor-not-allowed disabled:opacity-35"
                        aria-label={`Move ${stop.name} down`}
                        title="Move stop down"
                      >
                        <ArrowDown size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onRemoveStop(stop.id)}
                        className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#6A7282] shadow-sm hover:bg-[#F4F7F6]"
                        aria-label={`Remove ${stop.name} from route`}
                        title="Remove stop"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

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

        {/* Expanded safe space list. Click any item to view information and add it. */}
        {isOpen && (
          <div className="mt-4 space-y-3">
            {safeSpaces.map((safeSpace) => {
              const isAlreadySelected = selectedStopIds.has(safeSpace.id);

              return (
                <div
                  key={safeSpace.id}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-3 transition ${
                    isAlreadySelected
                      ? "border-[#5A9A8E]/40 bg-[#5A9A8E]/10"
                      : "border-transparent bg-white shadow-sm hover:border-[#5A9A8E]/40"
                  }`}
                >
                  {/* Left Side: Icon and Details */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white/90 bg-white/80 shadow-sm">
                      {renderSafeSpaceIcon(safeSpace.type)}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1E2939] truncate">
                        {safeSpace.name}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-[#5A9A8E]">
                        {safeSpace.subTheme}
                      </p>
                      <p className="mt-1 line-clamp-1 text-xs leading-4 text-[#6A7282]">
                        {safeSpace.description}
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Action Button */}
                  {isAlreadySelected ? (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5A9A8E] text-white">
                      <Check size={16} />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAddStop(safeSpace)}
                      className="cursor-pointer flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7DB0A6] text-white shadow-sm transition-transform hover:scale-110 active:scale-95"
                      aria-label={`Add ${safeSpace.name} to route`}
                    >
                      <Plus size={18} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedSafeSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4 sm:px-5">
          <div className="relative max-h-[68vh] w-full max-w-[300px] overflow-y-auto rounded-[24px] border border-white bg-white p-4 shadow-2xl sm:max-h-[82vh] sm:max-w-[340px] sm:rounded-[28px] sm:p-5">
            <button
              type="button"
              onClick={() => setSelectedSafeSpace(null)}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#F4F7F6] text-[#6A7282] sm:right-4 sm:top-4 sm:h-8 sm:w-8"
              aria-label="Close safe space details"
            >
              <X size={15} />
            </button>

            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/90 bg-white/80 shadow-sm sm:mb-4 sm:h-10 sm:w-10">
              {renderSafeSpaceIcon(selectedSafeSpace.type)}
            </div>

            <h3 className="pr-8 text-base font-semibold text-[#1E2939] sm:pr-10 sm:text-lg">
              {selectedSafeSpace.name}
            </h3>

            <p className="mt-2 text-sm leading-5 text-[#4A5565] sm:leading-6">
              {selectedSafeSpace.description}
            </p>

            <div className="mt-4 rounded-2xl bg-[#F8FBFA] p-3 sm:p-4">
              <p className="text-xs text-[#6A7282]">Noise Level</p>
              <p className="mt-1 text-sm font-medium text-[#5A9A8E] sm:text-base">
                Quiet
              </p>
              <p className="mt-1 text-xs text-[#6A7282]">
                Very peaceful environment
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3">
              {selectedStopIds.has(selectedSafeSpace.id) ? (
                <button
                  type="button"
                  onClick={() => {
                    onRemoveStop(selectedSafeSpace.id);
                    setSelectedSafeSpace(null);
                  }}
                  className="rounded-2xl bg-white py-2.5 text-sm font-medium text-[#1E2939] shadow-sm ring-1 ring-[#E8EEEC] sm:py-3"
                >
                  Remove Stop
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onAddStop(selectedSafeSpace);
                    setSelectedSafeSpace(null);
                  }}
                  className="rounded-2xl bg-[#7DB0A6] py-2.5 text-sm font-medium text-white shadow-sm sm:py-3"
                >
                  Add Stop
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedSafeSpace(null)}
                className="rounded-2xl bg-white py-2.5 text-sm font-medium text-[#1E2939] shadow-sm ring-1 ring-[#E8EEEC] sm:py-3"
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
