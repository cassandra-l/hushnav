import { MapPin, Navigation } from "lucide-react";
import type { LocationSuggestion } from "../../utils/photon";

type AutocompleteInputProps = {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  iconType: "start" | "destination";
  suggestions: LocationSuggestion[];
  isOpen: boolean;
  loading: boolean;
  onChange: (value: string) => void;
  onSelect: (suggestion: LocationSuggestion) => void;
  onFocus: () => void;
};

export function AutocompleteInput({
  id,
  label,
  value,
  placeholder,
  iconType,
  suggestions,
  isOpen,
  loading,
  onChange,
  onSelect,
  onFocus,
}: AutocompleteInputProps) {
  const isStart = iconType === "start";

  return (
    <div className="mb-3">
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-xs font-medium text-[#4A5565]"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <div className="flex items-center gap-3 rounded-2xl px-4 py-2">
          {/* Circle icon changes depending on whether this is start or destination */}
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              isStart ? "bg-[#D4B896]" : "bg-[#7DB0A6]"
            }`}
          >
            {isStart ? (
              <Navigation size={16} className="text-white" />
            ) : (
              <MapPin size={16} className="text-white" />
            )}
          </div>

          {/* User text input */}
          <input
            id={id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            placeholder={placeholder}
            autoComplete="off"
            className="min-w-0 w-full bg-transparent text-[14px] text-[#1E2939] outline-none placeholder:text-[#8B98A5]"
          />
        </div>

        {/* Suggestion dropdown */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-72 overflow-y-auto rounded-2xl border border-[#DCE7E3] bg-white shadow-xl">
            {loading ? (
              <div className="px-4 py-3 text-sm text-[#6A7282]">
                Searching...
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => onSelect(suggestion)}
                  className="w-full border-b border-[#EEF4F2] px-4 py-3 text-left text-sm text-[#1E2939] hover:bg-[#F7FAF9] last:border-b-0"
                >
                  {suggestion.place_name}
                </button>
              ))
            ) : value.trim().length >= 2 ? (
              <div className="px-4 py-3 text-sm text-[#6A7282]">
                No matching results found
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}