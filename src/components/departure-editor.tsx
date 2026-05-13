import type { Dispatch, SetStateAction } from "react";

export type DepartureConfig = {
  enabled: boolean;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
};

export type BestTimeSuggestion = {
  startHour: number;
  endHour: number;
  label: string;
  routeTimeIso: string;
};

export type DepartureEditorProps = {
  isBestTimeTab: boolean;
  setIsBestTimeTab: (value: boolean) => void;
  departureConfig: DepartureConfig;
  setDepartureConfig: Dispatch<SetStateAction<DepartureConfig>>;
  bestTimeSuggestion: BestTimeSuggestion | null;
  isBestTimeLoading: boolean;
  onCancel: () => void;
  onApplyChooseTime: () => void | Promise<void>;
  onFindBestTime: () => void | Promise<void>;
};

/** Shared departure UI (desktop sidebar + mobile sheet). */
export function DepartureEditor({
  isBestTimeTab,
  setIsBestTimeTab,
  departureConfig,
  setDepartureConfig,
  bestTimeSuggestion,
  isBestTimeLoading,
  onCancel,
  onApplyChooseTime,
  onFindBestTime,
}: DepartureEditorProps) {
  return (
    <div className="flex flex-col">
      <div className="flex border-b border-[#E8EEEC]">
        <button
          type="button"
          onClick={() => setIsBestTimeTab(false)}
          className={`flex-1 border-b-2 py-3 text-sm font-medium transition-colors ${
            !isBestTimeTab
              ? "border-[#5A9A8E] text-[#5A9A8E]"
              : "border-transparent text-[#6A7282]"
          }`}
        >
          Choose time
        </button>
        <button
          type="button"
          onClick={() => setIsBestTimeTab(true)}
          className={`flex-1 border-b-2 py-3 text-sm font-medium transition-colors ${
            isBestTimeTab
              ? "border-[#5A9A8E] text-[#5A9A8E]"
              : "border-transparent text-[#6A7282]"
          }`}
        >
          Best time
        </button>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-[#6A7282]">
            Date
          </label>
          <input
            type="date"
            value={departureConfig.date}
            onChange={(e) =>
              setDepartureConfig((prev) => ({
                ...prev,
                date: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-[#DCE7E3] px-3 py-2 text-sm"
          />
        </div>

        {/* Fixed-height slot so switching tabs does not resize the panel */}
        <div className="min-h-[6.25rem]">
          {!isBestTimeTab ? (
            <div>
              <label className="mb-1 block text-xs font-medium text-[#6A7282]">
                Departure time
              </label>
              <input
                type="time"
                value={departureConfig.time}
                onChange={(e) =>
                  setDepartureConfig((prev) => ({
                    ...prev,
                    time: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-[#DCE7E3] px-3 py-2 text-sm"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E8EEEC] bg-[#F8FBFA] p-3">
              {bestTimeSuggestion ? (
                <>
                  <p className="text-xs text-[#6A7282]">
                    Quietest time to travel
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#1E2939]">
                    {bestTimeSuggestion.label}
                  </p>
                </>
              ) : (
                <p className="text-xs leading-relaxed text-[#6A7282]">
                  Tap Find to recommend a quiet hour for this date.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-t border-[#E8EEEC] p-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-[#DCE7E3] bg-[#F5FAF8] py-2.5 text-sm font-medium text-[#4A5568]"
        >
          Cancel
        </button>

        {isBestTimeTab ? (
          <button
            type="button"
            onClick={() => void onFindBestTime()}
            disabled={isBestTimeLoading}
            className="flex-1 rounded-xl bg-[#7DB0A6] py-2.5 text-sm font-medium text-white disabled:opacity-70"
          >
            {isBestTimeLoading ? "Finding..." : "Find"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void onApplyChooseTime()}
            className="flex-1 rounded-xl bg-[#7DB0A6] py-2.5 text-sm font-medium text-white"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}
