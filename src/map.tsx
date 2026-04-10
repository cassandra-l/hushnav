import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  MapPin,
  Navigation,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { MicButton } from "./components/mic-button";
import { PopUp } from "./components/pop-up";
import { RouteMap } from "./components/route-map";
import type { PlanRouteResponse } from "./types/route";

// Backend base URL from .env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? "";

// Wider inner-city box so results are still focused, but not too strict
const SEARCH_BBOX = {
  minLng: 144.93,
  minLat: -37.83,
  maxLng: 144.995,
  maxLat: -37.795,
};

const CBD_CENTER = {
  lng: 144.9631,
  lat: -37.8136,
};

type LocationSuggestion = {
  id: string;
  place_name: string;
  center: [number, number];
};

// Local CBD / inner-city landmarks to improve shorthand matches
const LANDMARK_SUGGESTIONS: LocationSuggestion[] = [
  {
    id: "local-rmit-city",
    place_name: "RMIT University Melbourne City Campus",
    center: [144.9631, -37.807],
  },
  {
    id: "local-rmit-building80",
    place_name: "RMIT Building 80, Swanston Street, Melbourne",
    center: [144.9637, -37.8081],
  },
  {
    id: "local-marvel",
    place_name: "Marvel Stadium, Docklands",
    center: [144.9473, -37.8165],
  },
  {
    id: "local-flinders",
    place_name: "Flinders Street Station",
    center: [144.9671, -37.8183],
  },
  {
    id: "local-southern-cross",
    place_name: "Southern Cross Station",
    center: [144.9523, -37.8184],
  },
  {
    id: "local-parliament",
    place_name: "Parliament Station, Melbourne",
    center: [144.9732, -37.811],
  },
  {
    id: "local-state-library",
    place_name: "State Library Victoria",
    center: [144.9652, -37.8097],
  },
  {
    id: "local-melbourne-central",
    place_name: "Melbourne Central",
    center: [144.9629, -37.8102],
  },
  {
    id: "local-qv",
    place_name: "QV Melbourne",
    center: [144.9655, -37.8107],
  },
  {
    id: "local-emporium",
    place_name: "Emporium Melbourne",
    center: [144.9634, -37.811],
  },
  {
    id: "local-federation-square",
    place_name: "Federation Square",
    center: [144.969, -37.8179],
  },
  {
    id: "local-crown",
    place_name: "Crown Melbourne",
    center: [144.9584, -37.8226],
  },
  {
    id: "local-docklands",
    place_name: "Docklands, Melbourne",
    center: [144.9478, -37.8148],
  },
];

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

function AutocompleteInput({
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
      <label
        htmlFor={id}
        className="block text-xs font-medium text-[#4A5565] mb-2"
      >
        {label}
      </label>

      <div className="relative">
        <div className="flex items-center gap-3 rounded-2xl border border-[#DCE7E3] bg-white px-4 py-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              isStart ? "bg-[#D4B896]" : "bg-[#7DB0A6]"
            }`}
          >
            {isStart ? (
              <Navigation size={16} className="text-white" />
            ) : (
              <MapPin size={16} className="text-white" />
            )}
          </div>

          <Search size={16} className="text-[#5A9A8E] shrink-0" />

          <input
            id={id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            placeholder={placeholder}
            autoComplete="off"
            className="w-full bg-transparent outline-none text-[14px] text-[#1E2939] placeholder:text-[#8B98A5]"
          />
        </div>

        {isOpen && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-[#DCE7E3] bg-white shadow-xl">
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
                  className="w-full px-4 py-3 text-left text-sm text-[#1E2939] hover:bg-[#F7FAF9] border-b border-[#EEF4F2] last:border-b-0"
                >
                  {suggestion.place_name}
                </button>
              ))
            ) : value.trim().length >= 2 ? (
              <div className="px-4 py-3 text-sm text-[#6A7282]">
                No matching locations found
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export function Map() {
  const navigate = useNavigate();

  const [isPopUpOpen, setIsPopUpOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(true);

  const [startLocation, setStartLocation] = useState("");
  const [destination, setDestination] = useState("");

  const [selectedStart, setSelectedStart] = useState<LocationSuggestion | null>(
    null
  );
  const [selectedDestination, setSelectedDestination] =
    useState<LocationSuggestion | null>(null);

  const [startSuggestions, setStartSuggestions] = useState<LocationSuggestion[]>(
    []
  );
  const [destinationSuggestions, setDestinationSuggestions] = useState<
    LocationSuggestion[]
  >([]);

  const [isStartSuggestionsOpen, setIsStartSuggestionsOpen] = useState(false);
  const [isDestinationSuggestionsOpen, setIsDestinationSuggestionsOpen] =
    useState(false);

  const [isStartSuggestionsLoading, setIsStartSuggestionsLoading] =
    useState(false);
  const [isDestinationSuggestionsLoading, setIsDestinationSuggestionsLoading] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [routeData, setRouteData] = useState<PlanRouteResponse | null>(null);

  const desktopSearchPanelRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchPanelRef = useRef<HTMLDivElement | null>(null);

  const formatRouteLength = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const estimateWalkingMinutes = (meters: number) => {
    return Math.max(1, Math.round(meters / 84));
  };

  const aliasMap = useMemo<Record<string, string>>(
    () => ({
      rmit: "RMIT University Melbourne",
      "rmit university": "RMIT University Melbourne",
      "building 80": "RMIT Building 80 Melbourne",
      "rmit building 80": "RMIT Building 80 Melbourne",
      marvel: "Marvel Stadium Melbourne",
      "marvel stadium": "Marvel Stadium Melbourne",
      flinders: "Flinders Street Station",
      "flinders station": "Flinders Street Station",
      "flinders street": "Flinders Street Station",
      "southern cross": "Southern Cross Station",
      "southern cross station": "Southern Cross Station",
      parliament: "Parliament Station Melbourne",
      "state library": "State Library Victoria",
      "melbourne central": "Melbourne Central",
      "melb central": "Melbourne Central",
      qv: "QV Melbourne",
      emporium: "Emporium Melbourne",
      docklands: "Docklands Melbourne",
      crown: "Crown Melbourne",
      "fed square": "Federation Square",
      federation: "Federation Square",
    }),
    []
  );

  const getLocalMatches = useMemo(() => {
    return (query: string): LocationSuggestion[] => {
      const q = query.trim().toLowerCase();
      if (q.length < 2) return [];

      const queryWords = q.split(/\s+/).filter(Boolean);

      return LANDMARK_SUGGESTIONS.filter((place) => {
        const placeText = place.place_name.toLowerCase();

        // Match either the full query or all individual words
        return (
          placeText.includes(q) ||
          queryWords.every((word) => placeText.includes(word))
        );
      }).slice(0, 6);
    };
  }, []);

  const mergeSuggestions = (
    localResults: LocationSuggestion[],
    mapboxResults: LocationSuggestion[]
  ) => {
    const merged = [...localResults, ...mapboxResults];
    const unique = new Map<string, LocationSuggestion>();

    for (const item of merged) {
      const key = item.place_name.toLowerCase();
      if (!unique.has(key)) {
        unique.set(key, item);
      }
    }

    return Array.from(unique.values()).slice(0, 6);
  };

  const fetchSuggestions = useMemo(() => {
    return async (query: string): Promise<LocationSuggestion[]> => {
      const trimmed = query.trim();
      if (trimmed.length < 2) return [];

      const normalised = trimmed.toLowerCase();
      const boostedQuery = aliasMap[normalised] ?? trimmed;

      const localMatches = getLocalMatches(trimmed);

      // Even if Mapbox fails, local suggestions still work
      if (!MAPBOX_TOKEN) {
        return localMatches;
      }

      try {
        const url =
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            boostedQuery
          )}.json` +
          `?access_token=${MAPBOX_TOKEN}` +
          `&autocomplete=true` +
          `&limit=6` +
          `&country=au` +
          `&language=en` +
          `&bbox=${SEARCH_BBOX.minLng},${SEARCH_BBOX.minLat},${SEARCH_BBOX.maxLng},${SEARCH_BBOX.maxLat}` +
          `&proximity=${CBD_CENTER.lng},${CBD_CENTER.lat}`;

        const response = await fetch(url);

        if (!response.ok) {
          return localMatches;
        }

        const data = await response.json();
        const features = Array.isArray(data.features) ? data.features : [];

        const mapboxResults: LocationSuggestion[] = features
          .filter(
            (feature: any) =>
              feature &&
              typeof feature.id === "string" &&
              typeof feature.place_name === "string" &&
              Array.isArray(feature.center) &&
              feature.center.length >= 2
          )
          .map((feature: any) => ({
            id: feature.id,
            place_name: feature.place_name,
            center: [feature.center[0], feature.center[1]] as [number, number],
          }));

        return mergeSuggestions(localMatches, mapboxResults);
      } catch (err) {
        console.error("Mapbox suggestion fetch failed:", err);
        return localMatches;
      }
    };
  }, [aliasMap, getLocalMatches]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      const clickedInsideDesktop =
        desktopSearchPanelRef.current?.contains(target) ?? false;
      const clickedInsideMobile =
        mobileSearchPanelRef.current?.contains(target) ?? false;

      if (!clickedInsideDesktop && !clickedInsideMobile) {
        setIsStartSuggestionsOpen(false);
        setIsDestinationSuggestionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (startLocation.trim().length < 2) {
      setStartSuggestions([]);
      setIsStartSuggestionsLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setIsStartSuggestionsLoading(true);
        const results = await fetchSuggestions(startLocation);

        if (!cancelled) {
          setStartSuggestions(results);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch start suggestions:", err);
          setStartSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setIsStartSuggestionsLoading(false);
        }
      }
    };

    const timeout = setTimeout(run, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [startLocation, fetchSuggestions]);

  useEffect(() => {
    if (destination.trim().length < 2) {
      setDestinationSuggestions([]);
      setIsDestinationSuggestionsLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setIsDestinationSuggestionsLoading(true);
        const results = await fetchSuggestions(destination);

        if (!cancelled) {
          setDestinationSuggestions(results);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch destination suggestions:", err);
          setDestinationSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setIsDestinationSuggestionsLoading(false);
        }
      }
    };

    const timeout = setTimeout(run, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [destination, fetchSuggestions]);

  const handlePlanRoute = async () => {
    setError("");
    setIsStartSuggestionsOpen(false);
    setIsDestinationSuggestionsOpen(false);

    if (!startLocation.trim() || !destination.trim()) {
      setRouteData(null);
      setError("Please enter both a start location and destination.");
      return;
    }

    if (
      startLocation.trim().toLowerCase() === destination.trim().toLowerCase()
    ) {
      setRouteData(null);
      setError("Start location and destination cannot be the same.");
      return;
    }

    if (!API_BASE_URL) {
      setRouteData(null);
      setError("API base URL not set. Add VITE_API_BASE_URL to your .env file.");
      return;
    }

    setLoading(true);

    try {
      const requestBody = {
        startQuery: startLocation,
        endQuery: destination,
      };

      const response = await fetch(`${API_BASE_URL}/plan-route`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const rawText = await response.text();

      console.log("Route response status:", response.status);
      console.log("Route response text:", rawText);

      let data: PlanRouteResponse | { error?: string } | null = null;

      if (rawText.trim()) {
        try {
          data = JSON.parse(rawText);
        } catch {
          throw new Error(
            "Backend returned a response, but it was not valid JSON."
          );
        }
      }

      if (!response.ok) {
        const errorMessage =
          data && "error" in data && data.error
            ? data.error
            : `Request failed with status ${response.status}.`;

        throw new Error(errorMessage);
      }

      if (!data) {
        throw new Error("Backend returned an empty response.");
      }

      setRouteData(data as PlanRouteResponse);

      if (window.innerWidth < 1024) {
        setIsMobileSearchOpen(false);
      }
    } catch (err) {
      setRouteData(null);

      if (err instanceof TypeError) {
        setError(
          "Cannot connect to the backend server right now. Please make sure it is running."
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong while planning your route.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#D5E8E5]">
      <div className="h-full w-full lg:grid lg:grid-cols-[380px_1fr]">
        <aside className="hidden lg:flex lg:flex-col h-full bg-white border-r border-[#E8EEEC] z-20">
          <div
            ref={desktopSearchPanelRef}
            className="px-5 pt-5 pb-4 border-b border-[#E8EEEC]"
          >
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => navigate("/")}
                className="w-10 h-10 rounded-full bg-[#F7FAF9] border border-[#E8EEEC] flex items-center justify-center text-[#1E2939]"
                aria-label="Go back"
              >
                <ArrowLeft size={18} />
              </button>

              <div>
                <h1 className="text-xl font-semibold text-[#1E2939]">
                  Quiet Route
                </h1>
                <p className="text-sm text-[#6A7282]">
                  Find the calmest path through the city
                </p>
              </div>
            </div>

            <AutocompleteInput
              id="desktopStartLocation"
              label="Start"
              value={startLocation}
              placeholder="Enter start location"
              iconType="start"
              suggestions={startSuggestions}
              isOpen={isStartSuggestionsOpen}
              loading={isStartSuggestionsLoading}
              onChange={(value) => {
                setStartLocation(value);
                setSelectedStart(null);
                setIsStartSuggestionsOpen(value.trim().length >= 2);
              }}
              onSelect={(suggestion) => {
                setStartLocation(suggestion.place_name);
                setSelectedStart(suggestion);
                setIsStartSuggestionsOpen(false);
              }}
              onFocus={() => {
                if (startLocation.trim().length >= 2) {
                  setIsStartSuggestionsOpen(true);
                }
                setIsDestinationSuggestionsOpen(false);
              }}
            />

            <AutocompleteInput
              id="desktopDestination"
              label="Destination"
              value={destination}
              placeholder="Enter destination"
              iconType="destination"
              suggestions={destinationSuggestions}
              isOpen={isDestinationSuggestionsOpen}
              loading={isDestinationSuggestionsLoading}
              onChange={(value) => {
                setDestination(value);
                setSelectedDestination(null);
                setIsDestinationSuggestionsOpen(value.trim().length >= 2);
              }}
              onSelect={(suggestion) => {
                setDestination(suggestion.place_name);
                setSelectedDestination(suggestion);
                setIsDestinationSuggestionsOpen(false);
              }}
              onFocus={() => {
                if (destination.trim().length >= 2) {
                  setIsDestinationSuggestionsOpen(true);
                }
                setIsStartSuggestionsOpen(false);
              }}
            />

            <button
              onClick={handlePlanRoute}
              disabled={loading}
              className="w-full rounded-2xl bg-[#5A9A8E] text-white py-3 font-medium shadow-sm disabled:opacity-70"
            >
              {loading ? "Finding quiet route..." : "Find Quiet Route"}
            </button>

            {error && (
              <p className="text-sm text-red-600 font-medium mt-3">{error}</p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {routeData ? (
              <div className="space-y-4">
                <div className="bg-[#F8FBFA] rounded-3xl border border-[#E8EEEC] p-4">
                  <h2 className="text-base font-semibold text-[#1E2939] mb-3">
                    Route Summary
                  </h2>

                  <div className="space-y-3 text-sm text-[#1E2939]">
                    <div className="flex justify-between gap-4">
                      <span className="text-[#6A7282]">Noise Level</span>
                      <span className="font-medium text-[#5A9A8E]">Quiet</span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-[#6A7282]">Distance</span>
                      <span className="font-medium">
                        {formatRouteLength(routeData.route.totalLength)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-[#6A7282]">Duration</span>
                      <span className="font-medium">
                        {estimateWalkingMinutes(routeData.route.totalLength)} min
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-[#6A7282]">From</span>
                      <span className="font-medium text-right">
                        {routeData.start.resolvedName}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-[#6A7282]">To</span>
                      <span className="font-medium text-right">
                        {routeData.end.resolvedName}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setRouteData(null);
                    setError("");
                  }}
                  className="w-full rounded-2xl bg-[#5A9A8E] text-white py-3 font-medium"
                >
                  Exit
                </button>
              </div>
            ) : (
              <div className="bg-[#F8FBFA] rounded-3xl border border-[#E8EEEC] p-4">
                <h2 className="text-base font-semibold text-[#1E2939] mb-2">
                  Quiet Route Preview
                </h2>
                <p className="text-sm text-[#6A7282]">
                  Search for a start point and destination to display the quietest
                  route on the map.
                </p>
              </div>
            )}
          </div>
        </aside>

        <div className="relative h-full w-full">
          <RouteMap routeData={routeData} />

          {!isMobileSearchOpen && (
            <div className="absolute top-4 left-4 right-4 z-10 lg:hidden">
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(true)}
                className="w-full bg-white/92 backdrop-blur-sm rounded-2xl shadow-lg border border-white/70 px-4 py-3 flex items-center justify-between"
              >
                <div className="text-left">
                  <p className="text-sm font-semibold text-[#1E2939]">
                    Quiet Route
                  </p>
                  <p className="text-xs text-[#6A7282]">
                    {startLocation && destination
                      ? `${startLocation} → ${destination}`
                      : "Open search"}
                  </p>
                </div>

                <ChevronDown size={18} className="text-[#1E2939]" />
              </button>
            </div>
          )}

          {isMobileSearchOpen && (
            <section className="absolute top-4 left-4 right-4 z-20 lg:hidden">
              <div
                ref={mobileSearchPanelRef}
                className="bg-white/92 backdrop-blur-sm rounded-[28px] shadow-xl p-4 border border-white/70"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate("/")}
                      className="w-10 h-10 rounded-full bg-[#F7FAF9] border border-[#E8EEEC] flex items-center justify-center text-[#1E2939] shadow-sm"
                      aria-label="Go back"
                    >
                      <ArrowLeft size={18} />
                    </button>

                    <div>
                      <h1 className="text-[24px] leading-tight font-semibold text-[#1E2939]">
                        Quiet Route
                      </h1>
                      <p className="text-sm text-[#6A7282]">
                        Find the calmest path through the city
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMobileSearchOpen(false)}
                    className="w-9 h-9 rounded-full bg-[#F7FAF9] border border-[#E8EEEC] flex items-center justify-center text-[#1E2939] shrink-0"
                    aria-label="Collapse panel"
                  >
                    <ChevronUp size={18} />
                  </button>
                </div>

                <AutocompleteInput
                  id="mobileStartLocation"
                  label="Start"
                  value={startLocation}
                  placeholder="Enter start location"
                  iconType="start"
                  suggestions={startSuggestions}
                  isOpen={isStartSuggestionsOpen}
                  loading={isStartSuggestionsLoading}
                  onChange={(value) => {
                    setStartLocation(value);
                    setSelectedStart(null);
                    setIsStartSuggestionsOpen(value.trim().length >= 2);
                  }}
                  onSelect={(suggestion) => {
                    setStartLocation(suggestion.place_name);
                    setSelectedStart(suggestion);
                    setIsStartSuggestionsOpen(false);
                  }}
                  onFocus={() => {
                    if (startLocation.trim().length >= 2) {
                      setIsStartSuggestionsOpen(true);
                    }
                    setIsDestinationSuggestionsOpen(false);
                  }}
                />

                <AutocompleteInput
                  id="mobileDestination"
                  label="Destination"
                  value={destination}
                  placeholder="Enter destination"
                  iconType="destination"
                  suggestions={destinationSuggestions}
                  isOpen={isDestinationSuggestionsOpen}
                  loading={isDestinationSuggestionsLoading}
                  onChange={(value) => {
                    setDestination(value);
                    setSelectedDestination(null);
                    setIsDestinationSuggestionsOpen(value.trim().length >= 2);
                  }}
                  onSelect={(suggestion) => {
                    setDestination(suggestion.place_name);
                    setSelectedDestination(suggestion);
                    setIsDestinationSuggestionsOpen(false);
                  }}
                  onFocus={() => {
                    if (destination.trim().length >= 2) {
                      setIsDestinationSuggestionsOpen(true);
                    }
                    setIsStartSuggestionsOpen(false);
                  }}
                />

                <button
                  onClick={handlePlanRoute}
                  disabled={loading}
                  className="w-full rounded-2xl bg-[#5A9A8E] text-white py-3 font-medium shadow-md disabled:opacity-70"
                >
                  {loading ? "Finding quiet route..." : "Find Quiet Route"}
                </button>

                {error && (
                  <p className="text-sm text-red-600 font-medium mt-3">{error}</p>
                )}
              </div>
            </section>
          )}

          <section className="absolute bottom-4 left-4 right-4 z-10 lg:hidden">
            <div className="bg-white/95 backdrop-blur-sm rounded-[28px] shadow-xl border border-white/80 overflow-hidden">
              {routeData ? (
                <div className="grid grid-cols-4 items-center text-center">
                  <div className="px-3 py-4 border-r border-[#E8EEEC]">
                    <p className="text-xs text-[#6A7282]">Noise Level</p>
                    <p className="text-[15px] font-medium text-[#5A9A8E]">
                      Quiet
                    </p>
                  </div>

                  <div className="px-3 py-4 border-r border-[#E8EEEC]">
                    <p className="text-xs text-[#6A7282]">Distance</p>
                    <p className="text-[15px] font-medium text-[#1E2939]">
                      {formatRouteLength(routeData.route.totalLength)}
                    </p>
                  </div>

                  <div className="px-3 py-4 border-r border-[#E8EEEC]">
                    <p className="text-xs text-[#6A7282]">Duration</p>
                    <p className="text-[15px] font-medium text-[#1E2939]">
                      {estimateWalkingMinutes(routeData.route.totalLength)} min
                    </p>
                  </div>

                  <div className="px-3 py-4">
                    <button
                      onClick={() => {
                        setRouteData(null);
                        setError("");
                      }}
                      className="bg-[#5A9A8E] text-white rounded-2xl px-5 py-2.5 font-medium shadow-sm"
                    >
                      Exit
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#1E2939]">
                      Quiet Route Preview
                    </p>
                    <p className="text-xs text-[#6A7282] mt-1">
                      Search for a route to begin.
                    </p>
                  </div>

                  <button
                    onClick={() => navigate("/")}
                    className="bg-[#5A9A8E] text-white rounded-2xl px-5 py-2.5 font-medium shadow-sm shrink-0"
                  >
                    Exit
                  </button>
                </div>
              )}
            </div>
          </section>

          <div className="absolute bottom-28 left-4 z-10 lg:hidden">
            <MicButton onClick={() => setIsPopUpOpen(true)} />
          </div>

          <div className="absolute bottom-28 right-4 z-10 lg:hidden">
            <button
              type="button"
              className="w-16 h-16 rounded-full bg-[#5A9A8E] text-white shadow-xl flex items-center justify-center border-4 border-white/70"
              aria-label="Calm tools"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12.8 19.6A2 2 0 1 0 14 16H2" />
                <path d="M17.5 8a2.5 2.5 0 1 1 2 4H2" />
                <path d="M9.8 4.4A2 2 0 1 1 11 8H2" />
              </svg>
            </button>
          </div>

          <div className="hidden lg:block absolute bottom-6 right-6 z-10">
            <MicButton onClick={() => setIsPopUpOpen(true)} />
          </div>
        </div>
      </div>

      {isPopUpOpen && <PopUp onClose={() => setIsPopUpOpen(false)} />}
    </main>
  );
}