import { Navigation, SlidersVertical } from "lucide-react";
import { SafeSpaceStopoverPanel } from "./safe-space-stopover-panel";
import type { PlanRouteResponse, SafeSpace } from "../types/route";

type RoutePreviewPanelProps = {
  routeData: PlanRouteResponse;
  safeSpaces: SafeSpace[];
  selectedStops: SafeSpace[];
  isSafeSpacesOpen: boolean;
  isNavigationActive: boolean;
  formatRouteLength: (meters: number) => string;
  estimateWalkingMinutes: (meters: number) => number;
  onOpenFilters: () => void;
  onStartNavigation: () => void;
  onExitRoute: () => void;
  onToggleSafeSpaces: () => void;
  onAddStop: (safeSpace: SafeSpace) => void;
  onRemoveStop: (safeSpaceId: number) => void;

  // New reorder handlers
  onMoveStopUp: (safeSpaceId: number) => void;
  onMoveStopDown: (safeSpaceId: number) => void;
};

export function RoutePreviewPanel({
  routeData,
  safeSpaces,
  selectedStops,
  isSafeSpacesOpen,
  isNavigationActive,
  formatRouteLength,
  estimateWalkingMinutes,
  onOpenFilters,
  onStartNavigation,
  onExitRoute,
  onToggleSafeSpaces,
  onAddStop,
  onRemoveStop,
  onMoveStopUp,
  onMoveStopDown,
}: RoutePreviewPanelProps) {
  const totalLength = routeData.route.totalLength;

  return (
    <section className="absolute bottom-3 left-3 right-3 z-10 lg:hidden">
      <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/95 shadow-xl backdrop-blur-sm">
        <div className="max-h-[36vh] overflow-y-auto overscroll-contain">
          <div className="px-5 pb-3 pt-4">
            {/* Stats Row */}
            <div className="grid grid-cols-4 bg-white text-center items-center">
              {/* Noise Level */}
              <div className="border-r border-[#E8EEEC] px-2 py-3">
                <p className="text-[10px] uppercase font-bold text-[#6A7282]">
                  Noise
                </p>
                <p className="text-sm font-semibold text-[#5A9A8E]">Quiet</p>
              </div>

              {/* Distance */}
              <div className="border-r border-[#E8EEEC] px-2 py-3">
                <p className="text-[10px] uppercase font-bold text-[#6A7282]">
                  Dist
                </p>
                <p className="text-sm font-semibold text-[#1E2939]">
                  {formatRouteLength(totalLength)}
                </p>
              </div>

              {/* Duration[cite: 6] */}
              <div className="border-r border-[#E8EEEC] px-2 py-3">
                <p className="text-[10px] uppercase font-bold text-[#6A7282]">
                  Time
                </p>
                <p className="text-sm font-semibold text-[#1E2939]">
                  {estimateWalkingMinutes(totalLength)}m
                </p>
              </div>

              {/* Filter Button (Now inside the grid)[cite: 6] */}
              <div className="flex justify-center items-center">
                {!isNavigationActive && (
                  <button
                    type="button"
                    onClick={onOpenFilters}
                    className="flex items-center justify-center text-[#5A9A8E] border border-[#DCE7E3] bg-[#E8F4F1] h-9 w-9 rounded-full"
                    aria-label="Open route filters"
                  >
                    <SlidersVertical size={20} />
                  </button>
                )}
              </div>
            </div>

            {!isNavigationActive ? (
              <button
                type="button"
                onClick={onStartNavigation}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5A9A8E] py-3 font-medium text-white shadow-sm transition-transform active:scale-[0.98]"
              >
                <Navigation size={17} />
                Start
              </button>
            ) : (
              <button
                type="button"
                onClick={onExitRoute}
                className="mt-3 w-full rounded-2xl bg-[#5A9A8E] py-3 font-medium text-white shadow-sm"
              >
                Exit
              </button>
            )}
          </div>

          <SafeSpaceStopoverPanel
            safeSpaces={safeSpaces}
            selectedStops={selectedStops}
            isOpen={isSafeSpacesOpen}
            onToggleOpen={onToggleSafeSpaces}
            onAddStop={onAddStop}
            onRemoveStop={onRemoveStop}
            onMoveStopUp={onMoveStopUp}
            onMoveStopDown={onMoveStopDown}
          />
        </div>
      </div>
    </section>
  );
}
