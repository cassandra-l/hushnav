import { useState } from "react";
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

  // Reorder handlers used by the safe-space stopover panel.
  onMoveStopUp: (safeSpaceId: number) => void;
  onMoveStopDown: (safeSpaceId: number) => void;
};

type SheetPosition = "collapsed" | "preview" | "expanded";

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

  // Mobile sheet state:
  // collapsed = only stats row
  // preview = stats row + Start/Exit button
  // expanded = full panel including safe-space stop cards
  const [sheetPosition, setSheetPosition] = useState<SheetPosition>("preview");
  const [dragStartY, setDragStartY] = useState<number | null>(null);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setDragStartY(event.touches[0].clientY);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (dragStartY === null) return;

    const dragEndY = event.changedTouches[0].clientY;
    const dragDistance = dragEndY - dragStartY;

    // Ignore very small touches so normal taps do not accidentally move the sheet.
    if (Math.abs(dragDistance) < 45) {
      setDragStartY(null);
      return;
    }

    // Dragging down should make the panel smaller.
    if (dragDistance > 45) {
      if (sheetPosition === "expanded") {
        setSheetPosition("preview");
      } else {
        setSheetPosition("collapsed");
      }
    }

    // Dragging up should reveal more of the panel.
    if (dragDistance < -45) {
      if (sheetPosition === "collapsed") {
        setSheetPosition("preview");
      } else {
        setSheetPosition("expanded");
      }
    }

    setDragStartY(null);
  };

  const getSheetHeightClass = () => {
    if (sheetPosition === "collapsed") {
      return "max-h-[96px]";
    }

    if (sheetPosition === "expanded") {
      return "max-h-[78vh]";
    }

    return "max-h-[190px]";
  };

  return (
    <section className="w-full lg:hidden">
      <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/95 shadow-xl backdrop-blur-sm">
        <div
          className={`${getSheetHeightClass()} overflow-y-auto overscroll-contain transition-all duration-300 ease-out`}
        >
          {/* 
            Drag area.
            Users can pull this down to collapse the panel so only the first row is visible.
            Users can also drag up to reveal the Start button and safe-space stops.
          */}
          <div
            className="cursor-grab touch-none px-5 pt-3 active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#D4E1DD]" />

            {/* Stats Row */}
            <div className="grid grid-cols-4 items-center bg-white text-center">
              {/* Noise Level */}
              <div className="border-r border-[#E8EEEC] px-2 py-3">
                <p className="text-[10px] font-bold uppercase text-[#6A7282]">
                  Noise
                </p>
                <p className="text-sm font-semibold text-[#5A9A8E]">Quiet</p>
              </div>

              {/* Distance */}
              <div className="border-r border-[#E8EEEC] px-2 py-3">
                <p className="text-[10px] font-bold uppercase text-[#6A7282]">
                  Dist
                </p>
                <p className="text-sm font-semibold text-[#1E2939]">
                  {formatRouteLength(totalLength)}
                </p>
              </div>

              {/* Duration */}
              <div className="border-r border-[#E8EEEC] px-2 py-3">
                <p className="text-[10px] font-bold uppercase text-[#6A7282]">
                  Time
                </p>
                <p className="text-sm font-semibold text-[#1E2939]">
                  {estimateWalkingMinutes(totalLength)}m
                </p>
              </div>

              {/* Filter Button */}
              <div className="flex items-center justify-center">
                {!isNavigationActive && (
                  <button
                    type="button"
                    onClick={onOpenFilters}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DCE7E3] bg-[#E8F4F1] text-[#5A9A8E]"
                    aria-label="Open route filters"
                  >
                    <SlidersVertical size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 
            Only show the Start/Exit button when the sheet is not fully collapsed.
            This makes the collapsed state only show the first row, as requested.
          */}
          {sheetPosition !== "collapsed" && (
            <div className="px-5 pb-3 pt-3">
              {!isNavigationActive ? (
                <button
                  type="button"
                  onClick={onStartNavigation}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5A9A8E] py-3 font-medium text-white shadow-sm transition-transform active:scale-[0.98]"
                >
                  <Navigation size={17} />
                  Start
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onExitRoute}
                  className="w-full rounded-2xl bg-[#5A9A8E] py-3 font-medium text-white shadow-sm"
                >
                  Exit
                </button>
              )}
            </div>
          )}

          {/* 
            Only show the stopover panel when expanded.
            This prevents the safe-space card from taking up too much mobile screen space.
          */}
          {sheetPosition === "expanded" && (
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
          )}
        </div>
      </div>
    </section>
  );
}