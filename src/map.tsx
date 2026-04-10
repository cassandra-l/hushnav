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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? "";

const CBD_CENTER = {
  lng: 144.9631,
  lat: -37.8136,
};

// Keep this a bit wider than the exact CBD so edge results still appear.
const MELBOURNE_INNER_BBOX = "144.92,-37.835,145.01,-37.79";

type LocationSuggestion = {
  id: string;
  mapboxId: string;
  place_name: string;
  center?: [number, number];
};

type SearchBoxSuggestFeature = {
  type?: string;
  name?: string;
  name_preferred?: string;
  mapbox_id?: string;
  full_address?: string;
  place_formatted?: string;
  feature_type?: string;
  coordinates?: {
    longitude?: number;
    latitude?: number;
  };
};

type SearchBoxSuggestResponse = {
  suggestions?: SearchBoxSuggestFeature[];
};

type SearchBoxRetrieveFeature = {
  geometry?: {
    type?: string;
    coordinates?: [number, number];
  };
  properties?: {
    name?: string;
    name_preferred?: string;
    full_address?: string;
    place_formatted?: string;
    mapbox_id?: string;
    feature_type?: string;
    address?: string;
  };
};

type SearchBoxRetrieveResponse = {
  features?: SearchBoxRetrieveFeature[];
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
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-[#DCE7E3] bg-white shadow-xl max-h-80 overflow-y-auto">
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
                No matching results found
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function createSessionToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildSuggestionLabel(feature: SearchBoxSuggestFeature) {
  const parts = [
    feature.name_preferred || feature.name || "",
    feature.place_formatted || "",
    feature.full_address || "",
  ].filter(Boolean);

  const uniqueParts = Array.from(new Set(parts));

  return uniqueParts.join(", ");
}

function buildRetrievedLabel(feature: SearchBoxRetrieveFeature) {
  const props = feature.properties ?? {};

  const parts = [
    props.full_address || "",
    props.name_preferred || props.name || "",
    props.place_formatted || "",
  ].filter(Boolean);

  const uniqueParts = Array.from(new Set(parts));
  return uniqueParts.join(", ");
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

  const startSessionTokenRef = useRef<string>(createSessionToken());
  const destinationSessionTokenRef = useRef<string>(createSessionToken());

  const formatRouteLength = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const estimateWalkingMinutes = (meters: number) => {
    return Math.max(1, Math.round(meters / 84));
  };

  const hasMapboxToken = useMemo(() => MAPBOX_TOKEN.trim().length > 0, []);

  const fetchSearchBoxSuggestions = useMemo(() => {
    return async (
      query: string,
      sessionToken: string
    ): Promise<LocationSuggestion[]> => {
      const trimmed = query.trim();

      if (trimmed.length < 2 || !hasMapboxToken) {
        return [];
      }

      const params = new URLSearchParams({
        q: trimmed,
        access_token: MAPBOX_TOKEN,
        session_token: sessionToken,
        limit: "8",
        language: "en",
        country: "au",
        proximity: `${CBD_CENTER.lng},${CBD_CENTER.lat}`,
        bbox: MELBOURNE_INNER_BBOX,
        types: "street,address,poi,place,locality,neighborhood",
      });

      const url = `https://api.mapbox.com/search/searchbox/v1/suggest?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        const body = await response.text();
        console.error("Search Box suggest failed:", response.status, body);
        throw new Error(`Suggest request failed with status ${response.status}`);
      }

      const data: SearchBoxSuggestResponse = await response.json();
      const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];

      return suggestions
        .filter((item) => item.mapbox_id)
        .map((item, index) => {
          const lng = item.coordinates?.longitude;
          const lat = item.coordinates?.latitude;

          return {
            id: `${item.mapbox_id}-${index}`,
            mapboxId: item.mapbox_id as string,
            place_name: buildSuggestionLabel(item),
            center:
              typeof lng === "number" && typeof lat === "number"
                ? ([lng, lat] as [number, number])
                : undefined,
          };
        });
    };
  }, [hasMapboxToken]);

  const retrieveSearchBoxSuggestion = useMemo(() => {
    return async (
      mapboxId: string,
      sessionToken: string
    ): Promise<LocationSuggestion | null> => {
      if (!hasMapboxToken) {
        return null;
      }

      const params = new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        session_token: sessionToken,
        language: "en",
      });

      const url = `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(
        mapboxId
      )}?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        const body = await response.text();
        console.error("Search Box retrieve failed:", response.status, body);
        throw new Error(`Retrieve request failed with status ${response.status}`);
      }

      const data: SearchBoxRetrieveResponse = await response.json();
      const feature = Array.isArray(data.features) ? data.features[0] : undefined;

      if (!feature) {
        return null;
      }

      const coordinates = feature.geometry?.coordinates;
      const label = buildRetrievedLabel(feature);

      return {
        id: feature.properties?.mapbox_id ?? mapboxId,
        mapboxId: feature.properties?.mapbox_id ?? mapboxId,
        place_name: label || feature.properties?.name || "",
        center:
          Array.isArray(coordinates) && coordinates.length >= 2
            ? ([coordinates[0], coordinates[1]] as [number, number])
            : undefined,
      };
    };
  }, [hasMapboxToken]);

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
    if (startLocation.trim().length < 2 || !hasMapboxToken) {
      setStartSuggestions([]);
      setIsStartSuggestionsLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setIsStartSuggestionsLoading(true);
        const results = await fetchSearchBoxSuggestions(
          startLocation,
          startSessionTokenRef.current
        );

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
  }, [startLocation, fetchSearchBoxSuggestions, hasMapboxToken]);

  useEffect(() => {
    if (destination.trim().length < 2 || !hasMapboxToken) {
      setDestinationSuggestions([]);
      setIsDestinationSuggestionsLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setIsDestinationSuggestionsLoading(true);
        const results = await fetchSearchBoxSuggestions(
          destination,
          destinationSessionTokenRef.current
        );

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
  }, [destination, fetchSearchBoxSuggestions, hasMapboxToken]);

  const handleStartSelect = async (suggestion: LocationSuggestion) => {
    try {
      const retrieved = await retrieveSearchBoxSuggestion(
        suggestion.mapboxId,
        startSessionTokenRef.current
      );

      const finalValue = retrieved ?? suggestion;

      setStartLocation(finalValue.place_name);
      setSelectedStart(finalValue);
      setIsStartSuggestionsOpen(false);
      setStartSuggestions([]);

      // End the current billing/search session and create a fresh one
      // for the next search interaction.
      startSessionTokenRef.current = createSessionToken();
    } catch (err) {
      console.error("Failed to retrieve selected start suggestion:", err);
      setStartLocation(suggestion.place_name);
      setSelectedStart(suggestion);
      setIsStartSuggestionsOpen(false);
      setStartSuggestions([]);
      startSessionTokenRef.current = createSessionToken();
    }
  };

  const handleDestinationSelect = async (suggestion: LocationSuggestion) => {
    try {
      const retrieved = await retrieveSearchBoxSuggestion(
        suggestion.mapboxId,
        destinationSessionTokenRef.current
      );

      const finalValue = retrieved ?? suggestion;

      setDestination(finalValue.place_name);
      setSelectedDestination(finalValue);
      setIsDestinationSuggestionsOpen(false);
      setDestinationSuggestions([]);

      destinationSessionTokenRef.current = createSessionToken();
    } catch (err) {
      console.error("Failed to retrieve selected destination suggestion:", err);
      setDestination(suggestion.place_name);
      setSelectedDestination(suggestion);
      setIsDestinationSuggestionsOpen(false);
      setDestinationSuggestions([]);
      destinationSessionTokenRef.current = createSessionToken();
    }
  };

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
                startSessionTokenRef.current = createSessionToken();
              }}
              onSelect={handleStartSelect}
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
                destinationSessionTokenRef.current = createSessionToken();
              }}
              onSelect={handleDestinationSelect}
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

            {!hasMapboxToken && (
              <p className="text-sm text-red-600 font-medium mt-3">
                Mapbox token missing. Add VITE_MAPBOX_TOKEN to your .env file.
              </p>
            )}

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
                    startSessionTokenRef.current = createSessionToken();
                  }}
                  onSelect={handleStartSelect}
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
                    destinationSessionTokenRef.current = createSessionToken();
                  }}
                  onSelect={handleDestinationSelect}
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

                {!hasMapboxToken && (
                  <p className="text-sm text-red-600 font-medium mt-3">
                    Mapbox token missing. Add VITE_MAPBOX_TOKEN to your .env file.
                  </p>
                )}

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