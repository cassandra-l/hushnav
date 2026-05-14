import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import {
  BEST_TIME_DATE_MESSAGE,
  BEST_TIME_TAP_FIND_MESSAGE,
  DEPARTURE_BEST_TIME_DATE_HINT,
  DEPARTURE_DATE_ONLY_HINT,
  DEPARTURE_NOW_OR_FUTURE_MESSAGE,
  isChosenDepartureInPast,
  isDepartureDateBeforeTodayLocal,
} from "../departurePast";

const fieldClassName =
  "box-border w-full min-w-0 max-w-full rounded-xl border border-[#DCE7E3] px-3 py-2 text-sm";

const timeFieldClassName = [
  fieldClassName,
  "shrink",
  "[&::-webkit-datetime-edit-fields-wrapper]:min-w-0",
  "[&::-webkit-datetime-edit]:min-w-0",
  "[&::-webkit-calendar-picker-indicator]:ml-0 [&::-webkit-calendar-picker-indicator]:shrink-0",
].join(" ");

/** Best-time slot height; Choose time column uses the same `h-[4.75rem]` so tabs align. */
const BEST_TIME_SLOT_CLASS =
  "box-border flex h-[4.75rem] w-full min-w-0 flex-col rounded-2xl border border-[#E8EEEC] bg-[#F8FBFA] p-2.5";

function tabClass(active: boolean) {
  return `flex-1 border-b-2 py-2.5 text-sm font-medium transition-colors ${
    active
      ? "border-[#5A9A8E] text-[#5A9A8E]"
      : "border-transparent text-[#6A7282]"
  }`;
}

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
  getCurrentTimeHm: () => string;
  getTodayYmd: () => string;
};

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
  getCurrentTimeHm,
  getTodayYmd,
}: DepartureEditorProps) {
  const applyDepartureNow = () =>
    setDepartureConfig((prev) =>
      isBestTimeTab
        ? { ...prev, date: getTodayYmd() }
        : {
            ...prev,
            date: getTodayYmd(),
            time: getCurrentTimeHm(),
          },
    );

  const departureIsPast = isChosenDepartureInPast(
    departureConfig.date,
    departureConfig.time,
  );

  const bestTimeDateInvalid = isDepartureDateBeforeTodayLocal(
    departureConfig.date,
  );

  const submitErrorActive = isBestTimeTab
    ? bestTimeDateInvalid
    : departureIsPast;

  const [showPastSubmitError, setShowPastSubmitError] = useState(false);

  useEffect(() => {
    if (!submitErrorActive) setShowPastSubmitError(false);
  }, [submitErrorActive]);

  const resetToNowIfInvalid = () => {
    if (isBestTimeTab) {
      if (bestTimeDateInvalid) {
        setDepartureConfig((prev) => ({ ...prev, date: getTodayYmd() }));
      }
      return;
    }
    if (departureIsPast) {
      setDepartureConfig({
        enabled: false,
        date: getTodayYmd(),
        time: getCurrentTimeHm(),
      });
    }
  };

  const clampTimeIfToday = (dateYmd: string, timeHm: string) => {
    if (dateYmd !== getTodayYmd()) return timeHm;
    const minHm = getCurrentTimeHm();
    return timeHm < minHm ? minHm : timeHm;
  };

  const submitIfValid = (
    mode: "choose" | "best",
    action: () => void | Promise<void>,
  ) => {
    const invalid =
      mode === "best" ? bestTimeDateInvalid : departureIsPast;
    if (invalid) {
      setShowPastSubmitError(true);
      return;
    }
    setShowPastSubmitError(false);
    void action();
  };

  return (
    <div className="flex min-w-0 flex-col overflow-x-hidden">
      <div className="flex border-b border-[#E8EEEC]">
        <button
          type="button"
          onClick={() => {
            setShowPastSubmitError(false);
            setIsBestTimeTab(false);
            setDepartureConfig((prev) => ({
              ...prev,
              time: clampTimeIfToday(prev.date, prev.time),
            }));
          }}
          className={tabClass(!isBestTimeTab)}
        >
          Choose time
        </button>
        <button
          type="button"
          onClick={() => {
            setShowPastSubmitError(false);
            setIsBestTimeTab(true);
          }}
          className={tabClass(isBestTimeTab)}
        >
          Best time
        </button>
      </div>

      <div className="min-w-0 max-w-full space-y-2 px-3 pb-2 pt-2">
        <div className="mb-1 flex min-w-0 items-center justify-between gap-2">
          <label className="text-xs font-medium text-[#6A7282]">Date</label>
          <button
            type="button"
            onClick={applyDepartureNow}
            className="shrink-0 rounded-md border border-[#DCE7E3] bg-[#F8FBFA] px-2 py-0.5 text-xs font-medium text-[#5A9A8E] hover:bg-[#EEF6F4]"
            aria-label={
              isBestTimeTab
                ? "Set best-time date to today"
                : "Set departure date to today and time to now"
            }
          >
            {isBestTimeTab ? "Today" : "Now"}
          </button>
        </div>
        <input
          type="date"
          min={getTodayYmd()}
          value={departureConfig.date}
          onChange={(e) => {
            const v = e.target.value;
            const t = getTodayYmd();
            const nextDate = !v || v < t ? t : v;
            setDepartureConfig((prev) => {
              if (isBestTimeTab) {
                return { ...prev, date: nextDate };
              }
              const nextTime = clampTimeIfToday(nextDate, prev.time);
              return { ...prev, date: nextDate, time: nextTime };
            });
          }}
          className={fieldClassName}
        />
        <p className="text-xs leading-relaxed text-[#6A7282]">
          {isBestTimeTab
            ? DEPARTURE_BEST_TIME_DATE_HINT
            : DEPARTURE_DATE_ONLY_HINT}
        </p>

        {!isBestTimeTab ? (
          <div className="flex h-[4.75rem] w-full min-w-0 flex-col">
            <label className="mb-1 block text-xs font-medium text-[#6A7282]">
              Departure time
            </label>
            <input
              type="time"
              min={
                departureConfig.date === getTodayYmd()
                  ? getCurrentTimeHm()
                  : undefined
              }
              value={departureConfig.time}
              onChange={(e) =>
                setDepartureConfig((prev) => ({
                  ...prev,
                  time: clampTimeIfToday(prev.date, e.target.value),
                }))
              }
              className={timeFieldClassName}
            />
            <div className="min-h-0 flex-1" aria-hidden />
          </div>
        ) : (
          <div className={BEST_TIME_SLOT_CLASS}>
            {bestTimeSuggestion ? (
              <>
                <p className="text-xs text-[#6A7282]">
                  Quietest time to travel
                </p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-[#1E2939]">
                  {bestTimeSuggestion.label}
                </p>
              </>
            ) : (
              <p className="text-xs leading-relaxed text-[#6A7282]">
                {BEST_TIME_TAP_FIND_MESSAGE}
              </p>
            )}
            <div className="min-h-0 flex-1" aria-hidden />
          </div>
        )}
      </div>

      <div className="min-w-0 border-t border-[#E8EEEC] px-3 pb-3 pt-2">
        {showPastSubmitError && submitErrorActive ? (
          <p
            role="alert"
            aria-live="polite"
            className="mb-2 text-sm font-medium leading-snug text-red-600"
          >
            {isBestTimeTab
              ? BEST_TIME_DATE_MESSAGE
              : DEPARTURE_NOW_OR_FUTURE_MESSAGE}
          </p>
        ) : null}
        <div className="flex min-w-0 gap-2">
          <button
            type="button"
            onClick={() => {
              resetToNowIfInvalid();
              setShowPastSubmitError(false);
              onCancel();
            }}
            className="flex-1 rounded-xl border border-[#DCE7E3] bg-[#F5FAF8] py-2 text-sm font-medium text-[#4A5568]"
          >
            Cancel
          </button>

          {isBestTimeTab ? (
            <button
              type="button"
              onClick={() => submitIfValid("best", onFindBestTime)}
              disabled={isBestTimeLoading}
              className="flex-1 rounded-xl bg-[#7DB0A6] py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isBestTimeLoading ? "Finding..." : "Find"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => submitIfValid("choose", onApplyChooseTime)}
              className="flex-1 cursor-pointer rounded-xl bg-[#7DB0A6] py-2 text-sm font-medium text-white"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
