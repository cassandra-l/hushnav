import { useEffect, useRef, useState } from "react";
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

  /*
    Sheet positions:
    - collapsed: only stats row is visible
    - preview: stats row + Start button + collapsed "Safe Spaces Along Route" header
    - expanded: stats row + Start button + full safe-space panel/cards
  */
  const [sheetPosition, setSheetPosition] = useState<SheetPosition>("preview");

  const [dragStartY, setDragStartY] = useState<number | null>(null);

  // Used to detect when a stop has just been added.
  const previousStopCount = useRef(selectedStops.length);

  useEffect(() => {
    const hasAddedStop = selectedStops.length > previousStopCount.current;
    const hasRemovedAllStops =
      selectedStops.length === 0 && previousStopCount.current > 0;

    // After the user adds a stop, automatically expand the panel
    // so the selected stop card is visible by default.
    if (hasAddedStop) {
      setSheetPosition("expanded");
    }

    // If all stops are removed, return to the normal preview state.
    if (hasRemovedAllStops) {
      setSheetPosition("preview");
    }

    previousStopCount.current = selectedStops.length;
  }, [selectedStops.length]);

  const moveSheetFromDrag = (dragDistance: number) => {
    // Ignore small accidental movements so normal taps do not drag the sheet.
    if (Math.abs(dragDistance) < 35) return;

    // Drag down = minimise the sheet.
    if (dragDistance > 35) {
      if (sheetPosition === "expanded") {
        setSheetPosition("preview");
        return;
      }

      setSheetPosition("collapsed");
      return;
    }

    // Drag up = show more content.
    if (dragDistance < -35) {
      if (sheetPosition === "collapsed") {
        setSheetPosition("preview");
        return;
      }

      setSheetPosition("expanded");
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setDragStartY(event.touches[0].clientY);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (dragStartY === null) return;

    const dragEndY = event.changedTouches[0].clientY;
    moveSheetFromDrag(dragEndY - dragStartY);

    setDragStartY(null);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setDragStartY(event.clientY);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartY === null) return;

    moveSheetFromDrag(event.clientY - dragStartY);

    setDragStartY(null);
  };

  const handleHandleClick = () => {
    // Helpful for desktop testing:
    // clicking the handle cycles between the useful states.
    if (sheetPosition === "collapsed") {
      setSheetPosition("preview");
      return;
    }

    if (sheetPosition === "preview") {
      setSheetPosition("expanded");
      return;
    }

    setSheetPosition("preview");
  };

  const getSheetHeightClass = () => {
    if (sheetPosition === "collapsed") {
      // Only the stats row should be visible.
      return "max-h-[104px]";
    }

    if (sheetPosition === "expanded") {
      // Full safe-space panel visible.
      return "max-h-[58vh]";
    }

    // Default state:
    // stats row + Start button + collapsed Safe Spaces Along Route header.
    return "max-h-[260px]";
  };

  const shouldShowStartButton = sheetPosition !== "collapsed";

  /*
    Important:
    The safe-space panel must show in preview mode as a collapsed header,
    otherwise users cannot see "Safe Spaces Along Route" by default.
  */
  const shouldShowStopPanel =
    sheetPosition === "preview" || sheetPosition === "expanded";

  return (
    <section className="w-full lg:hidden">
      <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/95 shadow-xl backdrop-blur-sm">
        <div
          className={`${getSheetHeightClass()} overflow-y-auto overscroll-contain transition-all duration-300 ease-out`}
        >
          {/* Drag handle */}
          <div
            className="px-5 pt-3"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
          >
            <button
              type="button"
              onClick={handleHandleClick}
              className="mx-auto mb-3 block h-1.5 w-12 cursor-grab rounded-full bg-[#D4E1DD] active:cursor-grabbing"
              aria-label="Expand or minimise route preview panel"
            />
          </div>

          {/* Stats row */}
          <div className="px-5">
            <div className="grid grid-cols-4 items-center bg-white text-center">
              {/* Noise */}
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

              {/* Time */}
              <div className="border-r border-[#E8EEEC] px-2 py-3">
                <p className="text-[10px] font-bold uppercase text-[#6A7282]">
                  Time
                </p>
                <p className="text-sm font-semibold text-[#1E2939]">
                  {estimateWalkingMinutes(totalLength)}m
                </p>
              </div>

              {/* Filter button */}
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

          {/* Start / Exit button */}
          {shouldShowStartButton && (
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
                  className="w-full rounded-2xl bg-[#5A9A8E] py-3 font-medium text-white shadow-sm transition-transform active:scale-[0.98]"
                >
                  Exit
                </button>
              )}
            </div>
          )}

          {/* Safe-space stop panel */}
          {shouldShowStopPanel && (
            <SafeSpaceStopoverPanel
              safeSpaces={safeSpaces}
              selectedStops={selectedStops}
              /*
                In preview mode, force this closed so only the
                "Safe Spaces Along Route" header row shows.

                In expanded mode, keep the normal open/closed behaviour from the parent.
              */
              isOpen={sheetPosition === "expanded" ? isSafeSpacesOpen : false}
              onToggleOpen={() => {
                // If the user taps "Safe Spaces Along Route" while in preview,
                // expand the bottom sheet so the safe-space content/cards can be seen.
                if (sheetPosition === "preview") {
                  setSheetPosition("expanded");
                  return;
                }

                onToggleSafeSpaces();
              }}
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