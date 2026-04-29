import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Navigation,
  ChevronDown,
  Wind,
  SlidersVertical,
  Mic,
  AlertTriangle,
} from "lucide-react";
import { MicButton } from "./components/mic-button";
import { PopUp } from "./components/pop-up";
import { RouteMap } from "./components/route-map";
import { SafeSpaceStopoverPanel } from "./components/safe-space-stopover-panel";
import type { PlanRouteResponse, SafeSpace } from "./types/route";
import { useAudioMonitor } from "./hook/useAudioMonitor";
import { VolumeBar } from "./components/noise-volume-bar";
import type { CrowdMapFeatureCollection } from "./types/noise-map";
import { AnimatePresence, motion } from "framer-motion";
import {
  incrementNoiseReports,
  incrementRoutesPlanned,
  incrementSafeSpacesVisited,
} from "./achievements-store";

// Backend base URL from .env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

// Used to bias Photon results toward Melbourne CBD
const CBD_CENTER = {
  lng: 144.9631,
  lat: -37.8136,
};

// A wider Melbourne inner bounding box so nearby areas like Docklands,
// Southbank, and East Melbourne can still appear in suggestions
const MELBOURNE_INNER_BBOX = "144.88,-37.86,145.05,-37.77";

// Standardised suggestion shape used by the UI
type LocationSuggestion = {
  id: string;
  place_name: string;
  center?: [number, number];
};

// Photon API feature shape
type PhotonFeature = {
  geometry?: {
    type?: string;
    coordinates?: [number, number];
  };
  properties?: {
    osm_id?: number | string;
    osm_type?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    suburb?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
  };
};

// Photon API response shape
type PhotonResponse = {
  features?: PhotonFeature[];
};

// Reusable props for the start/destination input with suggestions
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

// Reusable autocomplete field used for both Start and Destination
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
            className="w-full bg-transparent text-[14px] text-[#1E2939] outline-none placeholder:text-[#8B98A5]"
          />
        </div>

        {/* Suggestion dropdown */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-80 overflow-hidden overflow-y-auto rounded-2xl border border-[#DCE7E3] bg-white shadow-xl">
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

// Builds a readable label from Photon feature properties
function buildPhotonLabel(feature: PhotonFeature): string {
  const props = feature.properties ?? {};

  const addressPart = [props.housenumber, props.street]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ")
    .trim();

  const firstLine = [props.name, addressPart].filter((part): part is string =>
    Boolean(part && part.trim()),
  );

  const secondLine = [
    props.suburb || props.city || props.district,
    props.state,
    props.postcode,
  ].filter((part): part is string => Boolean(part && part.trim()));

  const parts = [...firstLine, ...secondLine];

  const uniqueParts = Array.from(
    new Set(parts.map((part) => part.trim())),
  ).filter((part) => part.length > 0);

  return uniqueParts.join(", ");
}

// Converts a Photon feature into our app's LocationSuggestion format
function normalisePhotonFeature(
  feature: PhotonFeature,
  index: number,
): LocationSuggestion | null {
  const coordinates = feature.geometry?.coordinates;
  const props = feature.properties ?? {};

  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return null;
  }

  const [lng, lat] = coordinates;

  if (typeof lng !== "number" || typeof lat !== "number") {
    return null;
  }

  const label = buildPhotonLabel(feature);

  if (!label) {
    return null;
  }

  const idBase =
    props.osm_id !== undefined
      ? `${props.osm_type ?? "feature"}-${String(props.osm_id)}`
      : `${label}-${index}`;

  return {
    id: `${idBase}-${index}`,
    place_name: label,
    center: [lng, lat],
  };
}

// Calls Photon API to fetch live search suggestions
async function fetchPhotonSuggestions(
  query: string,
  signal?: AbortSignal,
): Promise<LocationSuggestion[]> {
  const trimmed = query.trim();

  if (trimmed.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    q: trimmed,
    limit: "8",
    lang: "en",
    lat: String(CBD_CENTER.lat),
    lon: String(CBD_CENTER.lng),
    bbox: MELBOURNE_INNER_BBOX,
  });

  const response = await fetch(
    `https://photon.komoot.io/api/?${params.toString()}`,
    {
      signal,
    },
  );

  if (!response.ok) {
    const body = await response.text();
    console.error("Photon search failed:", response.status, body);
    throw new Error(`Photon request failed with status ${response.status}`);
  }

  const data = (await response.json()) as PhotonResponse;
  const features = Array.isArray(data.features) ? data.features : [];

  return features
    .map((feature, index) => normalisePhotonFeature(feature, index))
    .filter((item): item is LocationSuggestion => item !== null);
}

// Noise monitoring configuration
// Time interval between every triggers
const COOLDOWN_DURATION = 5 * 60 * 1000;
// Noise threshold to trigger the alert
const NOISE_THRESHOLD = 10;

// Main page component
export function Map() {
  const navigate = useNavigate();

  // Noise monitoring popup + audio state
  const [isPopUpOpen, setIsPopUpOpen] = useState(false);
  const { volume, isMonitoring, startMonitoring, stopMonitoring } =
    useAudioMonitor();

  // Inside Map component
  const [isHighNoiseAlertOpen, setIsHighNoiseAlertOpen] = useState(false);
  const [lastAlertTime, setLastAlertTime] = useState<number>(0);

  // Mobile panel open/close state
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(true);

  // Controls whether safe spaces section is expanded
  const [isSafeSpacesOpen, setIsSafeSpacesOpen] = useState(false);

  // Raw text currently typed into each field
  const [startLocation, setStartLocation] = useState("");
  const [destination, setDestination] = useState("");

  // Selected suggestion objects
  const [selectedStart, setSelectedStart] = useState<LocationSuggestion | null>(
    null,
  );
  const [selectedDestination, setSelectedDestination] =
    useState<LocationSuggestion | null>(null);

  // Suggestion lists for each field
  const [startSuggestions, setStartSuggestions] = useState<
    LocationSuggestion[]
  >([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<
    LocationSuggestion[]
  >([]);

  // Controls whether suggestion dropdowns are visible
  const [isStartSuggestionsOpen, setIsStartSuggestionsOpen] = useState(false);
  const [isDestinationSuggestionsOpen, setIsDestinationSuggestionsOpen] =
    useState(false);

  // Loading states for live search
  const [isStartSuggestionsLoading, setIsStartSuggestionsLoading] =
    useState(false);
  const [isDestinationSuggestionsLoading, setIsDestinationSuggestionsLoading] =
    useState(false);

  // Route API loading + error state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Final route response shown on the map
  const [routeData, setRouteData] = useState<PlanRouteResponse | null>(null);

  // Selected safe space stopover shown in the UI
  const [selectedSafeSpaceStop, setSelectedSafeSpaceStop] =
    useState<SafeSpace | null>(null);

  // Crowd / noise line layer shown behind the route
  const [crowdMapData, setCrowdMapData] =
    useState<CrowdMapFeatureCollection | null>(null);

  // All safe spaces shown before a route is selected
  const [allSafeSpaces, setAllSafeSpaces] = useState<SafeSpace[]>([]);

  // Refs for click-outside handling
  const desktopSearchPanelRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchPanelRef = useRef<HTMLDivElement | null>(null);

  // Abort controllers prevent old Photon requests from overwriting newer ones
  const startAbortRef = useRef<AbortController | null>(null);
  const destinationAbortRef = useRef<AbortController | null>(null);

  // Safe spaces returned by the backend for the active route
  const routeSafeSpaces = routeData?.safeSpaces ?? [];

  // Reference to the 'Safe Spaces' section container
  const safeSpacesRef = useRef<HTMLDivElement>(null);

  const sidebarScrollRef = useRef<HTMLDivElement>(null);

  // Helper to display route length nicely
  const formatRouteLength = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  // Rough walking duration estimate
  const estimateWalkingMinutes = (meters: number) => {
    return Math.max(1, Math.round(meters / 84));
  };

  // Returns the best display name for the route start
  const getStartDisplayName = () => {
    if (!routeData) return "";

    return (
      routeData.start.resolvedName ??
      (routeData.start.input === "selected_start_coordinates"
        ? startLocation
        : routeData.start.input)
    );
  };

  // Returns the best display name for the route destination
  const getEndDisplayName = () => {
    if (!routeData) return "";

    return (
      routeData.end.resolvedName ??
      (routeData.end.input === "selected_end_coordinates"
        ? destination
        : routeData.end.input)
    );
  };

  // Sends Emily to the filter page from the route preview page
  const handleOpenFilters = () => {
    navigate("/filter");
  };

  // Clears the active route and resets route-specific UI state
  const handleExitRoute = () => {
    // Remove the line from the map
    setRouteData(null);
    setError("");
    setIsSafeSpacesOpen(false);
    setSelectedSafeSpaceStop(null);

    // Clear the input strings so the search bar is empty
    setStartLocation("");
    setDestination("");

    // Clear the actual coordinate objects
    setSelectedStart(null);
    setSelectedDestination(null);

    // Ensure the search panel stays open for a new search
    setIsMobileSearchOpen(true);
  };

  // Adds a safe space as a selected stopover in the UI
  const handleAddSafeSpaceStop = (safeSpace: SafeSpace) => {
    setSelectedSafeSpaceStop(safeSpace);
    incrementSafeSpacesVisited(1);
    setIsSafeSpacesOpen(false);
  };

  // Removes the selected safe space stopover from the UI
  const handleRemoveSafeSpaceStop = () => {
    setSelectedSafeSpaceStop(null);
  };
  useEffect(() => {
    // Get exact time of this specific check
    const currentTime = Date.now();
    // Only show the popup if ALL of these are true:
    if (
      // User has noise monitor turned on
      isMonitoring &&
      // Current noise level hits the threshold limit
      volume > NOISE_THRESHOLD &&
      // The popup isn't already visible
      !isHighNoiseAlertOpen &&
      // Has been more than five minutes
      currentTime - lastAlertTime > COOLDOWN_DURATION
    ) {
      setIsHighNoiseAlertOpen(true);
      // Start the 5-minute timer
      setLastAlertTime(currentTime);
    }

    // If user stop the mic, reset everything
    if (!isMonitoring) {
      setLastAlertTime(0);
      setIsHighNoiseAlertOpen(false);
    }
  }, [volume, isMonitoring, isHighNoiseAlertOpen, lastAlertTime]);

  // Close suggestion dropdowns when user clicks outside both panels
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

  // Watch start field and fetch live Photon suggestions
  useEffect(() => {
    if (startLocation.trim().length < 2) {
      setStartSuggestions([]);
      setIsStartSuggestionsLoading(false);
      return;
    }

    startAbortRef.current?.abort();
    const controller = new AbortController();
    startAbortRef.current = controller;

    const timeout = setTimeout(async () => {
      try {
        setIsStartSuggestionsLoading(true);
        const results = await fetchPhotonSuggestions(
          startLocation,
          controller.signal,
        );
        setStartSuggestions(results);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Failed to fetch start suggestions:", err);
          setStartSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsStartSuggestionsLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [startLocation]);

  // Watch destination field and fetch live Photon suggestions
  useEffect(() => {
    if (destination.trim().length < 2) {
      setDestinationSuggestions([]);
      setIsDestinationSuggestionsLoading(false);
      return;
    }

    destinationAbortRef.current?.abort();
    const controller = new AbortController();
    destinationAbortRef.current = controller;

    const timeout = setTimeout(async () => {
      try {
        setIsDestinationSuggestionsLoading(true);
        const results = await fetchPhotonSuggestions(
          destination,
          controller.signal,
        );
        setDestinationSuggestions(results);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Failed to fetch destination suggestions:", err);
          setDestinationSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsDestinationSuggestionsLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [destination]);

  // Fetch crowd / noise map data once when the page loads
  useEffect(() => {
    const fetchCrowdMap = async () => {
      try {
        if (!API_BASE_URL) return;

        const response = await fetch(`${API_BASE_URL}/noise-map`);

        if (!response.ok) {
          throw new Error(
            `Crowd map request failed with status ${response.status}`,
          );
        }

        const data = await response.json();
        setCrowdMapData(data);
      } catch (err) {
        console.error("Failed to load crowd map data:", err);
      }
    };

    fetchCrowdMap();
  }, []);

  // Fetch all safe spaces once so they can be shown before a route is selected
  useEffect(() => {
    const fetchAllSafeSpaces = async () => {
      try {
        if (!API_BASE_URL) return;

        const response = await fetch(`${API_BASE_URL}/safe-spaces`);

        if (!response.ok) {
          throw new Error(
            `Safe spaces request failed with status ${response.status}`,
          );
        }

        const data = (await response.json()) as SafeSpace[];
        setAllSafeSpaces(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load safe spaces:", err);
        setAllSafeSpaces([]);
      }
    };

    fetchAllSafeSpaces();
  }, []);

  // Handle automatic scrolling when the Safe Spaces section is toggled
  useEffect(() => {
    if (isSafeSpacesOpen && safeSpacesRef.current && sidebarScrollRef.current) {
      const timer = setTimeout(() => {
        const containerTop =
          sidebarScrollRef.current?.getBoundingClientRect().top || 0;
        const elementTop =
          safeSpacesRef.current?.getBoundingClientRect().top || 0;
        const scrollOffset =
          elementTop - containerTop + sidebarScrollRef.current!.scrollTop;

        sidebarScrollRef.current?.scrollTo({
          // Scrolling so the box starts about 100px from the top
          // This keeps the context of the route summary visible
          top: scrollOffset - 100,
          behavior: "smooth",
        });
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [isSafeSpacesOpen]);

  // When a start suggestion is chosen, store both the label and coordinates
  const handleStartSelect = (suggestion: LocationSuggestion) => {
    setStartLocation(suggestion.place_name);
    setSelectedStart(suggestion);
    setIsStartSuggestionsOpen(false);
    setStartSuggestions([]);
  };

  // When a destination suggestion is chosen, store both the label and coordinates
  const handleDestinationSelect = (suggestion: LocationSuggestion) => {
    setDestination(suggestion.place_name);
    setSelectedDestination(suggestion);
    setIsDestinationSuggestionsOpen(false);
    setDestinationSuggestions([]);
  };

  // Sends route request to backend
  const handlePlanRoute = async () => {
    console.log("DEBUG - Start Selection:", selectedStart);
    console.log("DEBUG - Destination Selection:", selectedDestination);
    setError("");
    setIsStartSuggestionsOpen(false);
    setIsDestinationSuggestionsOpen(false);
    setSelectedSafeSpaceStop(null);

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
      setError(
        "API base URL not set. Add VITE_API_BASE_URL to your .env file.",
      );
      return;
    }

    setLoading(true);

    try {
      const requestBody = {
        start:
          selectedStart?.center && selectedStart.center.length >= 2
            ? {
                lng: selectedStart.center[0],
                lat: selectedStart.center[1],
              }
            : undefined,
        end:
          selectedDestination?.center && selectedDestination.center.length >= 2
            ? {
                lng: selectedDestination.center[0],
                lat: selectedDestination.center[1],
              }
            : undefined,
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
          data = JSON.parse(rawText) as PlanRouteResponse | { error?: string };
        } catch {
          throw new Error(
            "Backend returned a response, but it was not valid JSON.",
          );
        }
      }

      if (!response.ok) {
        const errorMessage =
          data && "error" in data && typeof data.error === "string"
            ? data.error
            : `Request failed with status ${response.status}.`;

        throw new Error(errorMessage);
      }

      if (!data) {
        throw new Error("Backend returned an empty response.");
      }

      setRouteData(data as PlanRouteResponse);
      // Achievement counters
      incrementRoutesPlanned(1);
      setIsSafeSpacesOpen(false);

      if (window.innerWidth < 1024) {
        setIsMobileSearchOpen(false);
      }
    } catch (err) {
      setRouteData(null);

      if (err instanceof TypeError) {
        setError(
          "Cannot connect to the backend server right now. Please make sure it is running.",
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
    <main className="h-[100dvh] fixed inset-0 w-full overflow-hidden bg-[#D5E8E5]">
      <div className="h-full w-full lg:grid lg:grid-cols-[380px_1fr]">
        {/* Desktop left sidebar */}
        <aside className="z-20 hidden max-h-screen h-full flex-col border-r border-[#E8EEEC] bg-white lg:flex">
          <div
            ref={desktopSearchPanelRef}
            className="border-b border-[#E8EEEC] px-5 pb-4 pt-5"
          >
            <div className="mb-4 flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E8EEEC] bg-[#F7FAF9] text-[#1E2939]"
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
              className="w-full rounded-2xl bg-[#5A9A8E] py-3 font-medium text-white shadow-sm disabled:opacity-70"
            >
              {loading ? "Finding quiet route..." : "Find Quiet Route"}
            </button>

            {error && (
              <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
            )}
          </div>

          {/* Desktop route summary */}
          <div
            ref={sidebarScrollRef}
            className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar min-h-0"
          >
            {routeData ? (
              <div className="space-y-4">
                <div className="rounded-3xl border border-[#E8EEEC] bg-[#F8FBFA] p-4">
                  <h2 className="mb-3 text-base font-semibold text-[#1E2939]">
                    Route Summary
                  </h2>

                  <button
                    type="button"
                    onClick={handleOpenFilters}
                    className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7DB0A6] px-4 py-3 text-sm font-medium text-white shadow-sm"
                  >
                    <SlidersVertical size={16} className="text-white" />
                    Filters
                  </button>

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
                        {estimateWalkingMinutes(routeData.route.totalLength)}{" "}
                        min
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-[#6A7282]">From</span>
                      <span className="text-right font-medium">
                        {getStartDisplayName()}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-[#6A7282]">To</span>
                      <span className="text-right font-medium">
                        {getEndDisplayName()}
                      </span>
                    </div>
                  </div>

                  <div ref={safeSpacesRef} className="mt-5">
                    <SafeSpaceStopoverPanel
                      safeSpaces={routeSafeSpaces}
                      selectedStop={selectedSafeSpaceStop}
                      isOpen={isSafeSpacesOpen}
                      onToggleOpen={() => setIsSafeSpacesOpen((prev) => !prev)}
                      onAddStop={handleAddSafeSpaceStop}
                      onRemoveStop={handleRemoveSafeSpaceStop}
                    />
                  </div>
                </div>

                <button
                  onClick={handleExitRoute}
                  className="w-full rounded-2xl bg-[#5A9A8E] py-3 font-medium text-white"
                >
                  Exit
                </button>
              </div>
            ) : (
              <div className="rounded-3xl border border-[#E8EEEC] bg-[#F8FBFA] p-4">
                <h2 className="mb-2 text-base font-semibold text-[#1E2939]">
                  Quiet Route Preview
                </h2>
                <p className="text-sm text-[#6A7282]">
                  Search for a start point and destination to display the
                  quietest route on the map.
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Main map area */}
        <div className="relative h-full w-full">
          <RouteMap
            key={
              routeData
                ? JSON.stringify(routeData.route.geojson.coordinates)
                : "no-route"
            }
            routeData={routeData}
            crowdMapData={crowdMapData}
            allSafeSpaces={allSafeSpaces}
          />

          {/* Mobile collapsed top card */}
          {!isMobileSearchOpen && !routeData && (
            <div className="absolute left-4 right-4 top-4 z-10 lg:hidden">
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(true)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/70 bg-white/92 px-4 py-3 shadow-lg backdrop-blur-sm"
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

          {/* Mobile search panel */}
          {isMobileSearchOpen && !routeData && (
            <section className="absolute left-4 right-4 top-5 z-20 lg:hidden">
              <div
                ref={mobileSearchPanelRef}
                className="flex items-start gap-3"
              >
                {/* Back Button */}
                <div className="pt-13">
                  <button
                    onClick={() => navigate("/")}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white bg-white/80 text-[#1E2939] shadow-sm"
                    aria-label="Go back"
                  >
                    <ArrowLeft size={18} />
                  </button>
                </div>

                <div className="flex flex-1 flex-col">
                  <div className="flex-1 bg-white/80 border border-white rounded-3xl">
                    <AutocompleteInput
                      id="mobileStartLocation"
                      label=""
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
                      onSelect={handleStartSelect}
                      onFocus={() => {
                        if (startLocation.trim().length >= 2) {
                          setIsStartSuggestionsOpen(true);
                        }
                        setIsDestinationSuggestionsOpen(false);
                      }}
                    />
                    {/* Divider Line */}
                    <div className="mx-4 h-px bg-[#E8EEEC]" />

                    <AutocompleteInput
                      id="mobileDestination"
                      label=""
                      value={destination}
                      placeholder="Enter destination"
                      iconType="destination"
                      suggestions={destinationSuggestions}
                      isOpen={isDestinationSuggestionsOpen}
                      loading={isDestinationSuggestionsLoading}
                      onChange={(value) => {
                        setDestination(value);
                        setSelectedDestination(null);
                        setIsDestinationSuggestionsOpen(
                          value.trim().length >= 2,
                        );
                      }}
                      onSelect={handleDestinationSelect}
                      onFocus={() => {
                        if (destination.trim().length >= 2) {
                          setIsDestinationSuggestionsOpen(true);
                        }
                        setIsStartSuggestionsOpen(false);
                      }}
                    />
                  </div>
                  <AnimatePresence>
                    {startLocation && destination && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <button
                          onClick={handlePlanRoute}
                          disabled={loading}
                          className="w-full mt-2 rounded-2xl bg-[#5A9A8E] py-3 font-medium text-white shadow-md disabled:opacity-70 active:scale-[0.98] transition-transform"
                        >
                          {loading
                            ? "Finding quiet route..."
                            : "Find Quiet Route"}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {error && (
                    <p className="mt-3 text-sm font-medium text-red-600">
                      {error}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Mobile bottom route summary - Only visible when a route exists */}
          {routeData && (
            <section className="absolute bottom-4 left-4 right-4 z-10 lg:hidden">
              <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/95 shadow-xl backdrop-blur-sm">
                <div className="max-h-[45vh] overflow-y-auto overscroll-contain">
                  <div className="border-b border-[#E8EEEC] px-5 py-3">
                    <button
                      type="button"
                      onClick={handleOpenFilters}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-[#5A9A8E]"
                      aria-label="Open filters"
                    >
                      <SlidersVertical size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 items-center text-center">
                    <div className="border-r border-[#E8EEEC] px-3 py-4">
                      <p className="text-xs text-[#6A7282]">Noise Level</p>
                      <p className="text-[15px] font-medium text-[#5A9A8E]">
                        Quiet
                      </p>
                    </div>

                    <div className="border-r border-[#E8EEEC] px-3 py-4">
                      <p className="text-xs text-[#6A7282]">Distance</p>
                      <p className="text-[15px] font-medium text-[#1E2939]">
                        {formatRouteLength(routeData.route.totalLength)}
                      </p>
                    </div>

                    <div className="border-r border-[#E8EEEC] px-3 py-4">
                      <p className="text-xs text-[#6A7282]">Duration</p>
                      <p className="text-[15px] font-medium text-[#1E2939]">
                        {estimateWalkingMinutes(routeData.route.totalLength)}{" "}
                        min
                      </p>
                    </div>

                    <div className="px-3 py-4">
                      <button
                        onClick={handleExitRoute}
                        className="rounded-2xl bg-[#5A9A8E] px-5 py-2.5 font-medium text-white shadow-sm"
                      >
                        Exit
                      </button>
                    </div>
                  </div>

                  <SafeSpaceStopoverPanel
                    safeSpaces={routeSafeSpaces}
                    selectedStop={selectedSafeSpaceStop}
                    isOpen={isSafeSpacesOpen}
                    onToggleOpen={() => setIsSafeSpacesOpen((prev) => !prev)}
                    onAddStop={handleAddSafeSpaceStop}
                    onRemoveStop={handleRemoveSafeSpaceStop}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Mobile mic button + live noise bar */}
          <div
            className={`absolute left-4 z-10 lg:hidden transition-all duration-300 ${
              routeData
                ? isSafeSpacesOpen
                  ? "bottom-78 opacity-0 pointer-events-none"
                  : "bottom-44" // Moves up when the route bar appears
                : "bottom-6" // Stays at the bottom when no route is entered
            }`}
          >
            {isMonitoring && <VolumeBar volume={volume} />}
            <MicButton
              onClick={
                isMonitoring ? stopMonitoring : () => setIsPopUpOpen(true)
              }
              isActive={isMonitoring}
            />
          </div>

          {/* Mobile find calm button */}
          <div
            className={`absolute right-4 z-10 lg:hidden transition-all duration-300 ${
              routeData
                ? isSafeSpacesOpen
                  ? "bottom-78 opacity-0 pointer-events-none"
                  : "bottom-44" // Moves up when the route bar appears
                : "bottom-6" // Stays at the bottom when no route is entered
            }`}
          >
            <button
              type="button"
              onClick={() => navigate("/support")}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-white/60 bg-[#7DB0A6]/80 text-white shadow-lg"
              aria-label="Go to Find Calm page"
            >
              <Wind size={22} />
            </button>
          </div>

          {/* Desktop mic button + live noise bar */}
          <div className="absolute bottom-6 left-6 z-10 hidden lg:block">
            {isMonitoring && <VolumeBar volume={volume} />}
            <MicButton
              onClick={
                isMonitoring ? stopMonitoring : () => setIsPopUpOpen(true)
              }
              isActive={isMonitoring}
            />
          </div>

          {/* Desktop find calm button */}
          <div className="absolute bottom-6 right-6 z-10 hidden lg:block">
            <button
              type="button"
              onClick={() => navigate("/support")}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-white/60 bg-[#7DB0A6]/80 text-white shadow-lg"
              aria-label="Go to Find Calm page"
            >
              <Wind size={22} />
            </button>
          </div>
        </div>
      </div>

      {/* Microphone permission popup */}
      <PopUp
        isOpen={isPopUpOpen}
        title="Noise Monitor"
        buttonText="Allow Microphone"
        icon={<Mic size={24} />}
        iconBgColor="bg-[#7DB0A6]/80"
        description={
          <>
            A tool to measure the real time noise level in your surroundings.
            <br />
            Please allow microphone access.
          </>
        }
        onClose={() => setIsPopUpOpen(false)}
        onConfirm={async () => {
          setIsPopUpOpen(false);
          await startMonitoring();
        }}
      />
      {/* High Noise Alert Popup */}
      <PopUp
        isOpen={isHighNoiseAlertOpen}
        title="High Noise Level"
        buttonText="Report Noise"
        icon={<AlertTriangle size={24} className="text-[#C9A882]" />}
        iconBgColor="bg-[#C9A882]/20"
        description={
          <>
            The noise level in your area is extremely high. <br />
            Consider finding a quieter location for your comfort and well-being.
          </>
        }
        onClose={() => setIsHighNoiseAlertOpen(false)}
        onConfirm={() => {
          incrementNoiseReports(1);
          setIsHighNoiseAlertOpen(false);
        }}
      />
    </main>
  );
}
