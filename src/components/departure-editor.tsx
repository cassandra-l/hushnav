import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import {
  DEPARTURE_DATE_ONLY_HINT,
  DEPARTURE_NOW_OR_FUTURE_MESSAGE,
  isChosenDepartureInPast,
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

export type DepartureConfig = {
  enabled: boolean;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
};

export type DepartureEditorProps = {
  departureConfig: DepartureConfig;
  setDepartureConfig: Dispatch<SetStateAction<DepartureConfig>>;
  onCancel: () => void;
  onApplyChooseTime: () => void | Promise<void>;
  getCurrentTimeHm: () => string;
  getTodayYmd: () => string;
};

export function DepartureEditor({
  departureConfig,
  setDepartureConfig,
  onCancel,
  onApplyChooseTime,
  getCurrentTimeHm,
  getTodayYmd,
}: DepartureEditorProps) {
  const applyDepartureNow = () =>
    setDepartureConfig({
      ...departureConfig,
      date: getTodayYmd(),
      time: getCurrentTimeHm(),
    });

  const departureIsPast = isChosenDepartureInPast(
    departureConfig.date,
    departureConfig.time,
  );

  const [showPastSubmitError, setShowPastSubmitError] = useState(false);

  const resetToNowIfInvalid = () => {
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

  const submitIfValid = (action: () => void | Promise<void>) => {
    if (departureIsPast) {
      setShowPastSubmitError(true);
      return;
    }
    setShowPastSubmitError(false);
    void action();
  };

  return (
    <div className="flex min-w-0 flex-col overflow-x-hidden">
      <div className="min-w-0 max-w-full space-y-2 px-3 pb-2 pt-3">
        <div className="mb-1 flex min-w-0 items-center justify-between gap-2">
          <label className="text-xs font-medium text-[#6A7282]">Date</label>
          <button
            type="button"
            onClick={applyDepartureNow}
            className="shrink-0 rounded-md border border-[#DCE7E3] bg-[#F8FBFA] px-2 py-0.5 text-xs font-medium text-[#5A9A8E] hover:bg-[#EEF6F4]"
            aria-label="Set departure date to today and time to now"
          >
            Now
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
              const nextTime = clampTimeIfToday(nextDate, prev.time);
              return { ...prev, date: nextDate, time: nextTime };
            });
          }}
          className={fieldClassName}
        />
        <p className="text-xs leading-relaxed text-[#6A7282]">
          {DEPARTURE_DATE_ONLY_HINT}
        </p>

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
      </div>

      <div className="min-w-0 border-t border-[#E8EEEC] px-3 pb-3 pt-2">
        {showPastSubmitError && departureIsPast ? (
          <p
            role="alert"
            aria-live="polite"
            className="mb-2 text-sm font-medium leading-snug text-red-600"
          >
            {DEPARTURE_NOW_OR_FUTURE_MESSAGE}
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
          <button
            type="button"
            onClick={() => submitIfValid(onApplyChooseTime)}
            className="flex-1 cursor-pointer rounded-xl bg-[#7DB0A6] py-2 text-sm font-medium text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
