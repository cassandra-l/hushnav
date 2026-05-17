import { LocateFixed, MapPin, Navigation, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import type { FavouriteRoute } from "../../utils/favouriteRoutes";

type LocationSuggestion = {
  id: string;
  place_name: string;
  center?: [number, number];
};

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

  // Favourite routes are shown inside the dropdown under the Favourites tab.
  favouriteRoutes?: FavouriteRoute[];

  // Runs when Emily selects a saved route.
  // This auto-fills both origin and destination in map.tsx.
  onSelectFavouriteRoute?: (route: FavouriteRoute) => void;

  // Runs when Emily deletes a saved favourite route.
  onRemoveFavouriteRoute?: (routeId: string) => void;

  // Optional current-location button.
  // Only used for the start input.
  onLocationClick?: () => void;
  isLocating?: boolean;
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
  favouriteRoutes = [],
  onSelectFavouriteRoute,
  onRemoveFavouriteRoute,
  onLocationClick,
  isLocating = false,
}: AutocompleteInputProps) {
  const isStart = iconType === "start";

  const [activeDropdownTab, setActiveDropdownTab] = useState<
    "suggestions" | "favourites"
  >("suggestions");

  const shouldShowSuggestionsEmptyMessage =
    !loading && suggestions.length === 0 && value.trim().length >= 2;

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
        <div className="flex items-center gap-3 rounded-2xl border-0 px-4 py-3 lg:border lg:border-[#E8EEEC] lg:py-2">
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

          <input
            id={id}
            type="text"
            value={value}
            onChange={(e) => {
              setActiveDropdownTab("suggestions");
              onChange(e.target.value);
            }}
            onFocus={() => {
              setActiveDropdownTab("suggestions");
              onFocus();
            }}
            placeholder={placeholder}
            autoComplete="off"
            className="min-w-0 w-full bg-transparent text-[14px] text-[#1E2939] outline-none placeholder:text-[#8B98A5]"
          />

          {isStart && onLocationClick && (
            <button
              type="button"
              onClick={onLocationClick}
              disabled={isLocating}
              className={`cursor-pointer shrink-0 p-1 text-[#5A9A8E] transition-colors hover:text-[#7DB0A6] ${
                isLocating ? "animate-pulse" : ""
              }`}
              title="Use current location"
            >
              <LocateFixed size={18} />
            </button>
          )}
        </div>

        {isOpen && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[9999] max-h-80 overflow-hidden rounded-2xl border border-[#DCE7E3] bg-white shadow-xl">
            <div className="grid grid-cols-2 border-b border-[#EEF4F2] bg-white p-2">
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setActiveDropdownTab("suggestions");
                }}
                className={`rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
                  activeDropdownTab === "suggestions"
                    ? "bg-[#7DB0A6] text-white shadow-sm"
                    : "text-[#9AA3AF] hover:bg-[#F7FAF9] hover:text-[#5A9A8E]"
                }`}
              >
                Suggestions
              </button>

              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setActiveDropdownTab("favourites");
                }}
                className={`rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
                  activeDropdownTab === "favourites"
                    ? "bg-[#7DB0A6] text-white shadow-sm"
                    : "text-[#9AA3AF] hover:bg-[#F7FAF9] hover:text-[#5A9A8E]"
                }`}
              >
                Favourites
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {activeDropdownTab === "suggestions" && (
                <>
                  {loading ? (
                    <div className="px-4 py-3 text-sm text-[#6A7282]">
                      Searching...
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          onSelect(suggestion);
                        }}
                        className="w-full border-b border-[#EEF4F2] px-4 py-3 text-left text-sm text-[#1E2939] hover:bg-[#F7FAF9] last:border-b-0"
                      >
                        {suggestion.place_name}
                      </button>
                    ))
                  ) : shouldShowSuggestionsEmptyMessage ? (
                    <div className="px-4 py-3 text-sm text-[#6A7282]">
                      No matching results found
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-[#6A7282]">
                      Start typing to search for a location.
                    </div>
                  )}
                </>
              )}

              {activeDropdownTab === "favourites" && (
                <>
                  {favouriteRoutes.length === 0 ? (
                    <div className="px-4 py-4 text-center">
                      <Star className="mx-auto mb-2 h-5 w-5 text-[#9AA3AF]" />

                      <p className="text-sm font-medium text-[#4A5565]">
                        No favourite routes yet
                      </p>

                      <p className="mt-1 text-xs text-[#8B98A5]">
                        Save a route first, then it will appear here.
                      </p>
                    </div>
                  ) : (
                    favouriteRoutes.map((route) => (
                      <div
                        key={route.id}
                        className="flex items-stretch border-b border-[#EEF4F2] last:border-b-0"
                      >
                        <button
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onSelectFavouriteRoute?.(route);
                          }}
                          className="min-w-0 flex-1 px-4 py-3 text-left hover:bg-[#F7FAF9]"
                          aria-label={`Use favourite route from ${route.origin} to ${route.destination}`}
                        >
                       <div className="flex items-start gap-3">
  <div className="mt-0.5 flex flex-col items-center gap-1 shrink-0">
    <Navigation size={15} className="text-[#D4B896]" />
    <div className="h-3 w-px bg-[#DCE7E3]" />
    <MapPin size={15} className="text-[#7DB0A6]" />
  </div>

  <div className="min-w-0 flex-1">
    <p className="truncate text-sm font-semibold text-[#1E2939]">
      {route.origin}
    </p>

    <p className="my-1 text-xs text-[#8B98A5]">to</p>

    <p className="truncate text-sm font-semibold text-[#1E2939]">
      {route.destination}
    </p>
  </div>
</div>
                        </button>

                        <button
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onRemoveFavouriteRoute?.(route.id);
                          }}
                          className="flex w-12 shrink-0 items-center justify-center text-red-500 transition hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remove favourite route from ${route.origin} to ${route.destination}`}
                          title="Remove favourite route"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}