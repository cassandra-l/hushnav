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

  onViewSafeSpace: (safeSpace: SafeSpace) => void;
};

// Google Maps-style route preview bottom sheet.
// Preview mode shows filters and Start.
// Navigation mode removes filters and only keeps Exit.
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
  onViewSafeSpace,
}: RoutePreviewPanelProps) {
  const totalLength = routeData.route.totalLength;

  return (
    <section className="absolute bottom-3 left-3 right-3 z-10 lg:hidden">
      <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/95 shadow-xl backdrop-blur-sm">
        <div className="max-h-[36vh] overflow-y-auto overscroll-contain">
          <div className="px-5 pb-3 pt-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[#1E2939]">
                  Quiet Route
                </h2>
                <p className="text-xs text-[#6A7282]">
                  Your route avoids high noise and crowd levels where possible.
                </p>
              </div>

              {!isNavigationActive && (
                <button
                  type="button"
                  onClick={onOpenFilters}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7DB0A6] text-white shadow-sm"
                  aria-label="Open route filters"
                >
                  <SlidersVertical size={18} className="text-white" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 rounded-2xl border border-[#E8EEEC] bg-white text-center">
              <div className="border-r border-[#E8EEEC] px-3 py-3">
                <p className="text-[11px] text-[#6A7282]">Noise Level</p>
                <p className="text-sm font-semibold text-[#5A9A8E]">Quiet</p>
              </div>

              <div className="border-r border-[#E8EEEC] px-3 py-3">
                <p className="text-[11px] text-[#6A7282]">Distance</p>
                <p className="text-sm font-semibold text-[#1E2939]">
                  {formatRouteLength(totalLength)}
                </p>
              </div>

              <div className="px-3 py-3">
                <p className="text-[11px] text-[#6A7282]">Duration</p>
                <p className="text-sm font-semibold text-[#1E2939]">
                  {estimateWalkingMinutes(totalLength)} min
                </p>
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
            onViewSafeSpace={onViewSafeSpace}
          />
        </div>
      </div>
    </section>
  );
}