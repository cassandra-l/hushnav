import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Navigation,
  ChevronDown,
  Wind,
  Clock3,
  SlidersVertical,
  Mic,
  AlertTriangle,
  Menu,
  Bookmark,
  Headphones,
  ChevronUp,
  Pause,
  Play,
} from "lucide-react";
import { MicButton } from "./components/mic-button";

import { PopUp } from "./components/pop-up";
import { RouteMap } from "./components/route-map";
import { SafeSpaceStopoverPanel } from "./components/safe-space-stopover-panel";
import { RoutePreviewPanel } from "./components/route-preview-panel";
import type {
  AvoidMode,
  PlanRouteRequest,
  PlanRouteResponse,
  SafeSpace,
  SafeSpaceType,
} from "./types/route";
import { useAudioMonitor } from "./hook/useAudioMonitor";
import { VolumeBar } from "./components/noise-volume-bar";
import { AutocompleteInput } from "./components/map/AutocompleteInput";
import {
  getFavouriteRoutes,
  removeFavouriteRoute,
  saveFavouriteRoute,
  type FavouriteRoute,
} from "./utils/favouriteRoutes";

import type { CrowdMapFeatureCollection } from "./types/noise-map";
import { AnimatePresence, motion } from "framer-motion";
import {
  peekNextPendingBadgePopup,
  shiftPendingBadgePopupQueue,
  incrementNoiseReports,
  incrementRoutesPlanned,
  incrementSafeSpacesVisited,
  subscribeToAchievementsUpdates,
} from "./achievements-store";
import type { BadgeDefinition } from "./achievement-badges";
import { BadgeUnlockedPopup } from "./components/badge-unlocked-popup";
import { ReportSuccess } from "./components/report-success";
import { Navbar } from "./components/nav-bar";
import { MobileMenu } from "./components/hamburger-menu";
import { NavigationNoiseNotice } from "./components/navigation-noise-notice";
import {
  DepartureEditor,
  type BestTimeSuggestion,
  type DepartureConfig,
} from "./components/departure-editor";
import {
  BEST_TIME_DATE_MESSAGE,
  DEPARTURE_NOW_OR_FUTURE_MESSAGE,
  isChosenDepartureInPast,
  isDepartureDateBeforeTodayLocal,
  parseLocalDepartureMs,
} from "./departurePast";
import { useAudio } from "./context/use-audio";

// Backend base URL from .env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

// Standardised suggestion shape used by the UI
type LocationSuggestion = {
  id: string;
  place_name: string;
  center?: [number, number];
};

// Live user location shape from the browser Geolocation API
type UserLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
};

type MapCenter = {
  lat: number;
  lng: number;
};

const CBD_CENTER: MapCenter = {
  lat: -37.8136,
  lng: 144.9631,
};

type NoiseReportPin = {
  id: number;
  lat: number;
  lng: number;
  noiseLevel: number | null;
  createdAt: string;
};

type ActiveNoiseNotice = {
  report: NoiseReportPin;
  distanceMeters: number;
};

// Fetch search suggestions through our backend proxy.
// The backend will call Photon first, then fall back to Gisgraphy.
async function fetchPhotonSuggestions(
  query: string,
  signal?: AbortSignal,
): Promise<LocationSuggestion[]> {
  const trimmed = query.trim();

  if (trimmed.length < 2 || trimmed === "Current Location") {
    return [];
  }

  if (!API_BASE_URL) {
    console.error(
      "API base URL not set. Add VITE_API_BASE_URL to your .env file.",
    );
    return [];
  }

  const params = new URLSearchParams({
    q: trimmed,
  });

  const baseUrl = API_BASE_URL.replace(/\/$/, "");

  const response = await fetch(
    `${baseUrl}/geocode-suggestions?${params.toString()}`,
    {
      signal,
    },
  );

  if (!response.ok) {
    const body = await response.text();
    console.error("Geocode suggestions failed:", response.status, body);
    return [];
  }

  const data = (await response.json()) as {
    suggestions?: LocationSuggestion[];
  };

  return Array.isArray(data.suggestions) ? data.suggestions : [];
}

// Noise monitoring configuration
// Time interval between every triggers
const COOLDOWN_DURATION = 5 * 60 * 1000;

// Noise threshold to trigger the alert
const NOISE_THRESHOLD = 10;
const FILTER_PREVIEW_STATE_KEY = "hushnav:mapPreviewBeforeFilters";
const NOISE_REPORT_LOOKUP_RADIUS_METERS = 1000;
const NOISE_NOTICE_TRIGGER_DISTANCE_METERS = 100;
const NOISE_ROUTE_CORRIDOR_DISTANCE_METERS = 60;
const NOISE_NOTICE_PASSED_TOLERANCE_METERS = 20;

const SAFE_SPACES_STORAGE_KEY = "hushnav:selectedSafeSpaces";

const SENSITIVITY_STORAGE_KEY = "hushnav:selectedSensitivity";

const DEFAULT_SAFE_SPACE_TYPES: SafeSpaceType[] = [
  "park",
  "library",
  "museum",
  "church",
  "synagogue",
];

function getTodayLocalDateString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getCurrentHourMinuteString() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function toRouteTimeIso(date: string, time: string) {
  const ms = parseLocalDepartureMs(date, time);
  if (ms !== null) return new Date(ms).toISOString();
  return new Date(`${date}T${time}:00`).toISOString();
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function coordinateToMeters(
  coordinate: { lat: number; lng: number },
  origin: { lat: number; lng: number },
) {
  const earthRadiusMeters = 6371000;

  return {
    x:
      toRadians(coordinate.lng - origin.lng) *
      earthRadiusMeters *
      Math.cos(toRadians(origin.lat)),
    y: toRadians(coordinate.lat - origin.lat) * earthRadiusMeters,
  };
}

function getRoutePositionForPoint(
  routeCoordinates: [number, number][],
  point: { lat: number; lng: number },
) {
  if (routeCoordinates.length < 2) return null;

  let travelledMeters = 0;
  let nearestDistanceMeters = Number.POSITIVE_INFINITY;
  let nearestProgressMeters = 0;

  for (let index = 0; index < routeCoordinates.length - 1; index += 1) {
    const [startLng, startLat] = routeCoordinates[index];
    const [endLng, endLat] = routeCoordinates[index + 1];
    const start = coordinateToMeters({ lat: startLat, lng: startLng }, point);
    const end = coordinateToMeters({ lat: endLat, lng: endLng }, point);
    const segmentX = end.x - start.x;
    const segmentY = end.y - start.y;
    const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;
    const segmentLengthMeters = Math.sqrt(segmentLengthSquared);

    if (segmentLengthSquared === 0) continue;

    const projectionRatio = Math.max(
      0,
      Math.min(
        1,
        -(start.x * segmentX + start.y * segmentY) / segmentLengthSquared,
      ),
    );
    const projectedX = start.x + projectionRatio * segmentX;
    const projectedY = start.y + projectionRatio * segmentY;
    const distanceMeters = Math.sqrt(
      projectedX * projectedX + projectedY * projectedY,
    );

    if (distanceMeters < nearestDistanceMeters) {
      nearestDistanceMeters = distanceMeters;
      nearestProgressMeters =
        travelledMeters + projectionRatio * segmentLengthMeters;
    }

    travelledMeters += segmentLengthMeters;
  }

  return {
    distanceToRouteMeters: nearestDistanceMeters,
    progressMeters: nearestProgressMeters,
  };
}

// One-hour window, 12h clock, compact label (e.g. 9:00AM-10:00AM).
function formatHourRangeLabel(startHour: number) {
  const to12h = (hour: number) => {
    const h = hour % 24;
    const suffix = h >= 12 ? "PM" : "AM";
    const value = h % 12 === 0 ? 12 : h % 12;
    return `${value}:00${suffix}`;
  };
  const endHour = (startHour + 1) % 24;
  return `${to12h(startHour)}-${to12h(endHour)}`;
}

function readSelectedSafeSpaceTypes(): SafeSpaceType[] {
  const raw = localStorage.getItem(SAFE_SPACES_STORAGE_KEY);

  if (!raw) {
    return DEFAULT_SAFE_SPACE_TYPES;
  }

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return DEFAULT_SAFE_SPACE_TYPES;
    }

    return parsed.filter((item): item is SafeSpaceType =>
      DEFAULT_SAFE_SPACE_TYPES.includes(item as SafeSpaceType),
    );
  } catch {
    return DEFAULT_SAFE_SPACE_TYPES;
  }
}

function readSelectedAvoidMode(): AvoidMode {
  const selectedSensitivity = localStorage.getItem(SENSITIVITY_STORAGE_KEY);

  switch (selectedSensitivity) {
    case "mechanical":
      return "construction";
    case "social":
      return "crowd";
    case "standard":
    default:
      return "both";
  }
}

type FilterPreviewSnapshot = {
  routeData: PlanRouteResponse | null;
  startLocation: string;
  destination: string;
  selectedStart: LocationSuggestion | null;
  selectedDestination: LocationSuggestion | null;
  selectedSafeSpaceStops: SafeSpace[];
  selectedSafeSpaceFromPanel: SafeSpace | null;
  isSafeSpacesOpen: boolean;
  isMobileSearchOpen: boolean;
  userLocation: UserLocation | null;
};

// Main page component
export function Map() {
  const navigate = useNavigate();
  const location = useLocation();
  // Audio Player state
  const { playingId, isPaused, pauseAudio, resumeAudio } = useAudio();
  const [hasUsedAudio, setHasUsedAudio] = useState(false);

  // Calming tools menu
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);

  // Noise monitoring popup + audio state
  const [isPopUpOpen, setIsPopUpOpen] = useState(false);
  const { volume, isMonitoring, startMonitoring, stopMonitoring } =
    useAudioMonitor();

  // Hamburger menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Report sucess popup state
  const [isReportSuccessOpen, setIsReportSuccessOpen] = useState(false);

  // Inside Map component
  const [isHighNoiseAlertOpen, setIsHighNoiseAlertOpen] = useState(false);
  const [lastAlertTime, setLastAlertTime] = useState<number>(0);
  const [newBadgePopup, setNewBadgePopup] = useState<BadgeDefinition | null>(
    null,
  );

  // Mobile panel open/close state
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(true);

  // Tracks whether Emily is previewing the route or actively navigating.
  // Preview mode shows the filter button. Navigation mode removes it.
  const [isNavigationActive, setIsNavigationActive] = useState(false);

  // Controls whether safe spaces section is expanded
  const [isSafeSpacesOpen, setIsSafeSpacesOpen] = useState(false);

  // Raw text currently typed into each field
  const [startLocation, setStartLocation] = useState("");
  const [destination, setDestination] = useState("");

  // Message shown after saving the current route to favourites.
  const [saveRouteMessage, setSaveRouteMessage] = useState("");

  // Favourite routes used by the Favourites tab inside the autocomplete dropdown.
  // This replaces the old top-level Favourites tab.
  const [favouriteRoutes, setFavouriteRoutes] = useState<FavouriteRoute[]>([]);

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
  const [isBestTimeLoading, setIsBestTimeLoading] = useState(false);

  // Live user location from browser Geolocation API
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [noiseReportPins, setNoiseReportPins] = useState<NoiseReportPin[]>([]);
  const [focusedNoiseReportPin, setFocusedNoiseReportPin] =
    useState<NoiseReportPin | null>(null);
  const [activeNoiseNotice, setActiveNoiseNotice] =
    useState<ActiveNoiseNotice | null>(null);
  const [mapCenter, setMapCenter] = useState<MapCenter>(CBD_CENTER);
  const dismissedNoiseNoticeIdsRef = useRef<Set<number>>(new Set());

  // Final route response shown on the map
  const [routeData, setRouteData] = useState<PlanRouteResponse | null>(
    location.state?.restoredRoute || null,
  );
  const [departureConfig, setDepartureConfig] = useState<DepartureConfig>({
    enabled: false,
    date: getTodayLocalDateString(),
    time: getCurrentHourMinuteString(),
  });
  const [isDepartureOpen, setIsDepartureOpen] = useState(false);
  const [isBestTimeTab, setIsBestTimeTab] = useState(false);
  const [bestTimeSuggestion, setBestTimeSuggestion] =
    useState<BestTimeSuggestion | null>(null);
  const departureSummary = departureConfig.enabled
    ? `${departureConfig.date} ${departureConfig.time}`
    : "Now";

  useEffect(() => {
    setBestTimeSuggestion(null);
  }, [departureConfig.date]);
  // Aduio Playing
  useEffect(() => {
    const usedAudio = sessionStorage.getItem("hushnav-audio-used");
    setHasUsedAudio(usedAudio === "true");
  }, []);

  // Load favourite routes for the dropdown and refresh them whenever a route is saved.
  useEffect(() => {
    const loadFavouriteRoutes = () => {
      setFavouriteRoutes(getFavouriteRoutes());
    };

    loadFavouriteRoutes();

    window.addEventListener("hushnav:favourites-updated", loadFavouriteRoutes);
    window.addEventListener("storage", loadFavouriteRoutes);

    return () => {
      window.removeEventListener(
        "hushnav:favourites-updated",
        loadFavouriteRoutes,
      );
      window.removeEventListener("storage", loadFavouriteRoutes);
    };
  }, []);

  useEffect(() => {
    if (!routeData) return;
    setIsDepartureOpen(false);
    setBestTimeSuggestion(null);
  }, [routeData]);

  const [selectedSafeSpaceTypes, setSelectedSafeSpaceTypes] = useState<
    SafeSpaceType[]
  >(() => readSelectedSafeSpaceTypes());

  const [selectedAvoidMode, setSelectedAvoidMode] = useState<AvoidMode>(() =>
    readSelectedAvoidMode(),
  );

  const [shouldReplanAfterFilter, setShouldReplanAfterFilter] = useState(false);

  // Ordered safe-space stopovers selected by Emily.
  // The array order controls the route order:
  // start → first stop → second stop → destination.
  const [selectedSafeSpaceStops, setSelectedSafeSpaceStops] = useState<
    SafeSpace[]
  >([]);

  // Safe space selected from the preview/sidebar list.
  // Passing this to RouteMap lets the map fly to the marker and open its popup.
  const [selectedSafeSpaceFromPanel, setSelectedSafeSpaceFromPanel] =
    useState<SafeSpace | null>(null);

  // Crowd / noise line layer shown behind the route
  const [crowdMapData, setCrowdMapData] =
    useState<CrowdMapFeatureCollection | null>(null);

  // All safe spaces shown before a route is selected
  const [allSafeSpaces, setAllSafeSpaces] = useState<SafeSpace[]>([]);

  const visibleAllSafeSpaces =
    selectedSafeSpaceTypes.length === 0
      ? []
      : allSafeSpaces.filter((safeSpace) =>
          selectedSafeSpaceTypes.includes(safeSpace.type),
        );

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
    const previewSnapshot: FilterPreviewSnapshot = {
      routeData,
      startLocation,
      destination,
      selectedStart,
      selectedDestination,
      selectedSafeSpaceStops,
      selectedSafeSpaceFromPanel,
      isSafeSpacesOpen,
      isMobileSearchOpen,
      userLocation,
    };

    sessionStorage.setItem(
      FILTER_PREVIEW_STATE_KEY,
      JSON.stringify(previewSnapshot),
    );
    navigate("/filter_page", {
      state: { forecastSensitivityLocked: departureConfig.enabled },
    });
  };

  useEffect(() => {
    const state = location.state as {
      restoreRoutePreview?: boolean;
      replanAfterFilter?: boolean;
    } | null;
    if (!state?.restoreRoutePreview) return;

    const raw = sessionStorage.getItem(FILTER_PREVIEW_STATE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as FilterPreviewSnapshot;
      setRouteData(parsed.routeData);
      setStartLocation(parsed.startLocation);
      setDestination(parsed.destination);
      setSelectedStart(parsed.selectedStart);
      setSelectedDestination(parsed.selectedDestination);
      setSelectedSafeSpaceStops(parsed.selectedSafeSpaceStops ?? []);
      setSelectedSafeSpaceFromPanel(parsed.selectedSafeSpaceFromPanel ?? null);
      setIsSafeSpacesOpen(Boolean(parsed.isSafeSpacesOpen));
      setIsMobileSearchOpen(Boolean(parsed.isMobileSearchOpen));
      setUserLocation(parsed.userLocation ?? null);
      setIsNavigationActive(false);
      setError("");
      setSelectedSafeSpaceTypes(readSelectedSafeSpaceTypes());
      setSelectedAvoidMode(readSelectedAvoidMode());

      if (state.replanAfterFilter) {
        setShouldReplanAfterFilter(true);
      }
    } catch {
      // Ignore malformed snapshots.
    } finally {
      sessionStorage.removeItem(FILTER_PREVIEW_STATE_KEY);
    }
  }, [location.state]);

  useEffect(() => {
    if (!shouldReplanAfterFilter) return;

    setShouldReplanAfterFilter(false);
    const updatedSafeSpaceTypes = readSelectedSafeSpaceTypes();
    const updatedAvoidMode = readSelectedAvoidMode();

    void handlePlanRoute(
      selectedSafeSpaceStops,
      updatedSafeSpaceTypes,
      updatedAvoidMode,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldReplanAfterFilter]);

  // Gets Emily's current live location and uses it as the route start.
  const handleUseCurrentLocation = () => {
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("Live location is not supported by this browser.");
      return;
    }

    setIsLocatingUser(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLocation: UserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };

        setUserLocation(currentLocation);

        // Store the current location as the selected start point.
        // The backend receives the real lat/lng through selectedStart.center.
        setSelectedStart({
          id: "current-location",
          place_name: "Current Location",
          center: [currentLocation.lng, currentLocation.lat],
        });

        setStartLocation("Current Location");
        setIsStartSuggestionsOpen(false);
        setStartSuggestions([]);
        setIsLocatingUser(false);
      },
      (geolocationError) => {
        console.error("Failed to get current location:", geolocationError);

        if (geolocationError.code === geolocationError.PERMISSION_DENIED) {
          setLocationError("Location permission was denied.");
        } else if (
          geolocationError.code === geolocationError.POSITION_UNAVAILABLE
        ) {
          setLocationError("Your location is currently unavailable.");
        } else if (geolocationError.code === geolocationError.TIMEOUT) {
          setLocationError("Location request timed out.");
        } else {
          setLocationError("Could not get your current location.");
        }

        setIsLocatingUser(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      },
    );
  };

  const getCurrentLocationForReport = () => {
    if (!navigator.geolocation) {
      setLocationError("Live location is not supported by this browser.");
      return Promise.resolve(userLocation);
    }

    return new Promise<UserLocation | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation: UserLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          setUserLocation(currentLocation);
          setLocationError("");
          resolve(currentLocation);
        },
        (geolocationError) => {
          console.error("Failed to get report location:", geolocationError);

          if (geolocationError.code === geolocationError.PERMISSION_DENIED) {
            setLocationError("Location permission was denied.");
          } else if (
            geolocationError.code === geolocationError.POSITION_UNAVAILABLE
          ) {
            setLocationError("Your location is currently unavailable.");
          } else if (geolocationError.code === geolocationError.TIMEOUT) {
            setLocationError("Location request timed out.");
          } else {
            setLocationError("Could not get your current location.");
          }

          resolve(userLocation);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        },
      );
    });
  };

  const handleSubmitNoiseReport = async () => {
    setIsHighNoiseAlertOpen(false);

    const reportLocation = await getCurrentLocationForReport();

    if (!reportLocation) {
      incrementNoiseReports(1);
      setIsReportSuccessOpen(true);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/noise-reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lat: reportLocation.lat,
          lng: reportLocation.lng,
          noiseLevel: volume,
        }),
      });

      if (!response.ok) {
        throw new Error(`Create noise report failed: ${response.status}`);
      }

      const savedReport = (await response.json()) as NoiseReportPin;

      setNoiseReportPins((pins) => [savedReport, ...pins]);
      setFocusedNoiseReportPin(savedReport);
    } catch (err) {
      console.error("Failed to save noise report:", err);
    }

    incrementNoiseReports(1);
    setIsReportSuccessOpen(true);
  };

  // Starts navigation from the route preview page.
  // Map zoom/follow can be wired inside RouteMap when that nav feature is ready.
  const handleStartNavigation = () => {
    setIsNavigationActive(true);
    setIsMobileSearchOpen(false);
    setIsSafeSpacesOpen(false);
  };

  // Clears the active route and resets route-specific UI state
  const handleExitRoute = () => {
    // Remove the line from the map
    setRouteData(null);
    setError("");
    setLocationError("");
    setIsSafeSpacesOpen(false);
    setSelectedSafeSpaceStops([]);
    setSelectedSafeSpaceFromPanel(null);
    setIsNavigationActive(false);
    setActiveNoiseNotice(null);
    setIsDepartureOpen(false);
    setBestTimeSuggestion(null);
    setIsBestTimeTab(false);
    setDepartureConfig({
      enabled: false,
      date: getTodayLocalDateString(),
      time: getCurrentHourMinuteString(),
    });

    // Clear the input strings so the search bar is empty
    setStartLocation("");
    setDestination("");

    // Clear the actual coordinate objects
    setSelectedStart(null);
    setSelectedDestination(null);

    // Ensure the search panel stays open for a new search
    setIsMobileSearchOpen(true);
  };

  // Adds a safe space as the next ordered stopover and replans the route.
  const handleAddSafeSpaceStop = async (safeSpace: SafeSpace) => {
    const alreadyAdded = selectedSafeSpaceStops.some(
      (stop) => stop.id === safeSpace.id,
    );

    if (alreadyAdded) return;

    const updatedStops = [...selectedSafeSpaceStops, safeSpace];
    setSelectedSafeSpaceStops(updatedStops);
    incrementSafeSpacesVisited(1);
    setIsSafeSpacesOpen(false);
    setIsNavigationActive(false);

    await handlePlanRoute(updatedStops);
  };

  // Removes a safe space stopover and replans the route using the remaining stops.
  const handleRemoveSafeSpaceStop = async (safeSpaceId: number) => {
    const updatedStops = safeSpaceId
      ? selectedSafeSpaceStops.filter((stop) => stop.id !== safeSpaceId)
      : selectedSafeSpaceStops.slice(0, -1);

    setSelectedSafeSpaceStops(updatedStops);
    setIsNavigationActive(false);

    await handlePlanRoute(updatedStops);
  };
  // Moves a selected safe-space stop one position earlier in the route order.
  // Then replans the route so the backend uses the new order.
  const handleMoveSafeSpaceStopUp = async (safeSpaceId: number) => {
    const currentIndex = selectedSafeSpaceStops.findIndex(
      (stop) => stop.id === safeSpaceId,
    );

    // Already first, so it cannot move up.
    if (currentIndex <= 0) return;

    const updatedStops = [...selectedSafeSpaceStops];
    const previousStop = updatedStops[currentIndex - 1];

    updatedStops[currentIndex - 1] = updatedStops[currentIndex];
    updatedStops[currentIndex] = previousStop;

    setSelectedSafeSpaceStops(updatedStops);
    setIsNavigationActive(false);

    await handlePlanRoute(updatedStops);
  };

  // Moves a selected safe-space stop one position later in the route order.
  // Then replans the route so the backend uses the new order.
  const handleMoveSafeSpaceStopDown = async (safeSpaceId: number) => {
    const currentIndex = selectedSafeSpaceStops.findIndex(
      (stop) => stop.id === safeSpaceId,
    );

    // Not found or already last, so it cannot move down.
    if (
      currentIndex === -1 ||
      currentIndex >= selectedSafeSpaceStops.length - 1
    ) {
      return;
    }

    const updatedStops = [...selectedSafeSpaceStops];
    const nextStop = updatedStops[currentIndex + 1];

    updatedStops[currentIndex + 1] = updatedStops[currentIndex];
    updatedStops[currentIndex] = nextStop;

    setSelectedSafeSpaceStops(updatedStops);
    setIsNavigationActive(false);

    await handlePlanRoute(updatedStops);
  };

  useEffect(() => {
    const tryShowNewBadge = () => {
      setNewBadgePopup((current) => {
        if (current) return current;
        return peekNextPendingBadgePopup();
      });
    };

    tryShowNewBadge();
    return subscribeToAchievementsUpdates(tryShowNewBadge);
  }, []);

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

  // While navigation is active, keep the live location marker updated.
  // This moves the user marker, but it does not automatically recalculate the route.
  useEffect(() => {
    if (!navigator.geolocation || !isNavigationActive) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (geolocationError) => {
        console.error("Live location tracking failed:", geolocationError);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isNavigationActive]);

  useEffect(() => {
    if (
      !isNavigationActive ||
      !userLocation ||
      !routeData ||
      noiseReportPins.length === 0
    ) {
      setActiveNoiseNotice(null);
      return;
    }

    const routeCoordinates = routeData.route.geojson.coordinates;
    const userRoutePosition = getRoutePositionForPoint(
      routeCoordinates,
      userLocation,
    );

    if (!userRoutePosition) {
      setActiveNoiseNotice(null);
      return;
    }

    const nearestReport = noiseReportPins.reduce<ActiveNoiseNotice | null>(
      (nearest, report) => {
        if (dismissedNoiseNoticeIdsRef.current.has(report.id)) {
          return nearest;
        }

        const reportRoutePosition = getRoutePositionForPoint(
          routeCoordinates,
          report,
        );

        if (!reportRoutePosition) {
          return nearest;
        }

        const routeDistanceAheadMeters =
          reportRoutePosition.progressMeters - userRoutePosition.progressMeters;

        if (
          reportRoutePosition.distanceToRouteMeters >
          NOISE_ROUTE_CORRIDOR_DISTANCE_METERS
        ) {
          return nearest;
        }

        if (routeDistanceAheadMeters < -NOISE_NOTICE_PASSED_TOLERANCE_METERS) {
          return nearest;
        }

        if (routeDistanceAheadMeters > NOISE_NOTICE_TRIGGER_DISTANCE_METERS) {
          return nearest;
        }

        const displayDistanceMeters = Math.max(0, routeDistanceAheadMeters);

        if (!nearest || displayDistanceMeters < nearest.distanceMeters) {
          return {
            report,
            distanceMeters: displayDistanceMeters,
          };
        }

        return nearest;
      },
      null,
    );

    setActiveNoiseNotice(nearestReport);
  }, [isNavigationActive, noiseReportPins, routeData, userLocation]);

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

  useEffect(() => {
    const fetchNoiseReports = async () => {
      try {
        if (!API_BASE_URL) return;

        const params = new URLSearchParams({
          lat: String(mapCenter.lat),
          lng: String(mapCenter.lng),
          radiusMeters: String(NOISE_REPORT_LOOKUP_RADIUS_METERS),
        });

        const response = await fetch(
          `${API_BASE_URL}/noise-reports?${params.toString()}`,
        );

        if (!response.ok) {
          throw new Error(`Noise reports request failed: ${response.status}`);
        }

        const reports = (await response.json()) as NoiseReportPin[];
        setNoiseReportPins(Array.isArray(reports) ? reports : []);
      } catch (err) {
        console.error("Failed to load noise reports:", err);
      }
    };

    fetchNoiseReports();
  }, [mapCenter]);

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

  // When Emily chooses a favourite route from the autocomplete dropdown,
  // fill both route fields and let the backend resolve coordinates again.
  const handleSelectFavouriteRoute = (route: FavouriteRoute) => {
    setStartLocation(route.origin);
    setDestination(route.destination);

    // Favourite routes only store text labels, not coordinates.
    // Coordinates will be resolved again when Emily presses Find Quiet Route.
    setSelectedStart(null);
    setSelectedDestination(null);
    setUserLocation(null);

    setIsStartSuggestionsOpen(false);
    setIsDestinationSuggestionsOpen(false);
    setStartSuggestions([]);
    setDestinationSuggestions([]);
    setLocationError("");
    setSaveRouteMessage("Favourite route loaded.");
  };

  // Removes a saved favourite route from localStorage and refreshes the dropdown.
  const handleRemoveFavouriteRoute = (routeId: string) => {
    const updatedRoutes = removeFavouriteRoute(routeId);

    setFavouriteRoutes(updatedRoutes);
    setSaveRouteMessage("Favourite route removed.");

    window.dispatchEvent(new Event("hushnav:favourites-updated"));
  };

  // Saves the current origin and destination as a favourite route.
  // This supports AC 4.5.1.
  const handleSaveRoute = () => {
    const origin = startLocation.trim();
    const savedDestination = destination.trim();

    if (!origin || !savedDestination) {
      setSaveRouteMessage(
        "Please enter both a start location and destination first.",
      );
      return;
    }

    const result = saveFavouriteRoute(origin, savedDestination);

    // Keep the dropdown favourites list in sync immediately after saving.
    setFavouriteRoutes(result.routes);
    window.dispatchEvent(new Event("hushnav:favourites-updated"));

    if (result.status === "duplicate") {
      setSaveRouteMessage("This route is already in your favourites.");
      return;
    }

    setSaveRouteMessage("Route saved to favourites.");
  };

  // Sends route request to backend
  const buildRouteRequestBody = (
    safeSpaceStops: SafeSpace[],
    safeSpaceTypes: SafeSpaceType[],
    avoidMode: AvoidMode,
    routeMode: "live" | "forecast",
    routeTime?: string,
  ): PlanRouteRequest => ({
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
    avoidMode,
    safeSpaceTypes,
    routeMode,
    routeTime,
    stopSafeSpaceIds: safeSpaceStops.map((stop) => stop.id),
  });

  const handleFindBestTime = async () => {
    setError("");
    setBestTimeSuggestion(null);

    if (!startLocation.trim() || !destination.trim()) {
      setError("Please select start and destination before finding best time.");
      return;
    }
    if (!API_BASE_URL) {
      setError(
        "API base URL not set. Add VITE_API_BASE_URL to your .env file.",
      );
      return;
    }

    if (isDepartureDateBeforeTodayLocal(departureConfig.date)) {
      setError(BEST_TIME_DATE_MESSAGE);
      return;
    }

    // Hours 6–22; for "today" skip slot starts that are already in the past.
    const baseCandidateHours = Array.from({ length: 17 }, (_, i) => i + 6);
    const candidateHours =
      departureConfig.date === getTodayLocalDateString()
        ? baseCandidateHours.filter(
            (hour) =>
              !isChosenDepartureInPast(
                departureConfig.date,
                `${String(hour).padStart(2, "0")}:00`,
              ),
          )
        : baseCandidateHours;

    if (candidateHours.length === 0) {
      setError(
        "There are no remaining hours to score for today. Choose a future date.",
      );
      return;
    }

    setIsBestTimeLoading(true);
    try {
      const routeTimes = candidateHours.map((hour) => {
        const time = `${String(hour).padStart(2, "0")}:00`;
        return toRouteTimeIso(departureConfig.date, time);
      });

      const response = await fetch(`${API_BASE_URL}/best-time`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start:
            selectedStart?.center && selectedStart.center.length >= 2
              ? {
                  lng: selectedStart.center[0],
                  lat: selectedStart.center[1],
                }
              : undefined,
          end:
            selectedDestination?.center &&
            selectedDestination.center.length >= 2
              ? {
                  lng: selectedDestination.center[0],
                  lat: selectedDestination.center[1],
                }
              : undefined,
          startQuery: startLocation,
          endQuery: destination,
          avoidMode: selectedAvoidMode,
          routeTimes,
          stopSafeSpaceIds: selectedSafeSpaceStops.map((stop) => stop.id),
        }),
      });

      if (!response.ok) {
        let errorMessage = "Could not calculate best time for this date.";

        try {
          const errorData = (await response.json()) as { error?: string };
          if (typeof errorData.error === "string" && errorData.error.trim()) {
            errorMessage = errorData.error;
          }
        } catch {
          // Keep the generic message if the backend does not return JSON
        }

        throw new Error(errorMessage);
      }

      const bestTimeData = (await response.json()) as {
        bestRouteTime: string;
        bestCost: number;
        costs: { routeTime: string; cost: number | null }[];
      };

      const bestDate = new Date(bestTimeData.bestRouteTime);
      const bestHour = bestDate.getHours();
      const routeTimeIso = bestTimeData.bestRouteTime;

      // Label is a one-hour band; forecast still uses the start hour only.
      setBestTimeSuggestion({
        startHour: bestHour,
        endHour: (bestHour + 1) % 24,
        label: formatHourRangeLabel(bestHour),
        routeTimeIso,
      });
    } catch (err) {
      console.error("Best time recommendation failed:", err);
      setError("Failed to calculate best time.");
    } finally {
      setIsBestTimeLoading(false);
    }
  };

  const handlePlanRoute = async (
    safeSpaceStops = selectedSafeSpaceStops,
    safeSpaceTypes = selectedSafeSpaceTypes,
    avoidMode = selectedAvoidMode,
    departureOverride?: DepartureConfig,
  ) => {
    console.log("DEBUG - Start Selection:", selectedStart);
    console.log("DEBUG - Destination Selection:", selectedDestination);

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
      setError(
        "API base URL not set. Add VITE_API_BASE_URL to your .env file.",
      );
      return;
    }

    const effectiveDeparture = departureOverride ?? departureConfig;
    if (
      effectiveDeparture.enabled &&
      isChosenDepartureInPast(effectiveDeparture.date, effectiveDeparture.time)
    ) {
      setRouteData(null);
      setError(DEPARTURE_NOW_OR_FUTURE_MESSAGE);
      return;
    }

    setLoading(true);

    try {
      const routeMode = effectiveDeparture.enabled ? "forecast" : "live";
      const routeTime =
        routeMode === "forecast"
          ? toRouteTimeIso(effectiveDeparture.date, effectiveDeparture.time)
          : undefined;
      const requestBody = buildRouteRequestBody(
        safeSpaceStops,
        safeSpaceTypes,
        avoidMode,
        routeMode,
        routeTime,
      );

      console.log("Plan route request body:", requestBody);

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
      setIsSafeSpacesOpen(false);
      setIsNavigationActive(false);
      incrementRoutesPlanned(1);

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
    <main className="fixed inset-0 h-[100dvh] w-full overflow-hidden bg-[#D5E8E5]">
      <div className="h-full w-full lg:grid lg:grid-cols-[380px_1fr]">
        {/* Desktop left sidebar */}
        <aside className="z-20 hidden h-full max-h-screen flex-col border-r border-[#E8EEEC] bg-white lg:flex">
          <div
            ref={desktopSearchPanelRef}
            className="border-b border-[#E8EEEC] px-5 pb-4 pt-5"
          >
            <div className="mb-4">
              {/* <button
                onClick={() => navigate("/")}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E8EEEC] bg-[#F7FAF9] text-[#1E2939]"
                aria-label="Go back"
              >
                <ArrowLeft size={18} />
              </button> */}

              {/* <div>
                <h1 className="text-xl font-semibold text-[#1E2939]">
                  Quiet Route
                </h1>
                <p className="text-sm text-[#6A7282]">
                  Find the calmest path through the city
                </p>
              </div> */}
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
                setUserLocation(null);
                setLocationError("");
                setIsStartSuggestionsOpen(value.trim().length >= 2);
              }}
              onSelect={handleStartSelect}
              onFocus={() => {
                setIsStartSuggestionsOpen(true);
                setIsDestinationSuggestionsOpen(false);
              }}
              onLocationClick={handleUseCurrentLocation}
              isLocating={isLocatingUser}
              favouriteRoutes={favouriteRoutes}
              onSelectFavouriteRoute={handleSelectFavouriteRoute}
              onRemoveFavouriteRoute={handleRemoveFavouriteRoute}
            />

            {/* <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocatingUser}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#DCE7E3] bg-[#F8FBFA] px-4 py-2 text-sm font-medium text-[#5A9A8E] shadow-sm disabled:opacity-60"
            >
              <MapPin size={16} />
              {isLocatingUser
                ? "Finding your location..."
                : "Use Current Location"}
            </button> */}

            {locationError && (
              <p className="mb-3 text-xs font-medium text-red-600">
                {locationError}
              </p>
            )}

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
                setIsDestinationSuggestionsOpen(true);
                setIsStartSuggestionsOpen(false);
              }}
              favouriteRoutes={favouriteRoutes}
              onSelectFavouriteRoute={handleSelectFavouriteRoute}
              onRemoveFavouriteRoute={handleRemoveFavouriteRoute}
            />

            {!routeData && (
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => setIsDepartureOpen((open) => !open)}
                  className="flex w-full items-center justify-between gap-2 rounded-2xl border border-[#DCE7E3] bg-[#F8FBFA] px-4 py-2.5 text-sm text-[#1E2939]"
                  aria-expanded={isDepartureOpen}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Clock3 size={15} className="shrink-0 text-[#5A9A8E]" />
                    Departure
                  </span>
                  <span className="flex min-w-0 shrink-0 items-center gap-2">
                    <span className="max-w-[7rem] truncate font-medium text-[#5A9A8E]">
                      {departureSummary}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-[#6A7282] transition-transform duration-200 ${
                        isDepartureOpen ? "rotate-180" : ""
                      }`}
                    />
                  </span>
                </button>
                {isDepartureOpen && (
                  <div className="mt-2 min-w-0 overflow-hidden rounded-2xl border border-[#E8EEEC] bg-white shadow-sm">
                    <DepartureEditor
                      isBestTimeTab={isBestTimeTab}
                      setIsBestTimeTab={setIsBestTimeTab}
                      departureConfig={departureConfig}
                      setDepartureConfig={setDepartureConfig}
                      bestTimeSuggestion={bestTimeSuggestion}
                      isBestTimeLoading={isBestTimeLoading}
                      onCancel={() => {
                        setIsDepartureOpen(false);
                        setBestTimeSuggestion(null);
                      }}
                      onApplyChooseTime={async () => {
                        if (
                          isChosenDepartureInPast(
                            departureConfig.date,
                            departureConfig.time,
                          )
                        ) {
                          return;
                        }
                        const nextDepartureConfig: DepartureConfig = {
                          ...departureConfig,
                          enabled: true,
                        };
                        setDepartureConfig(nextDepartureConfig);
                        setIsDepartureOpen(false);
                      }}
                      onFindBestTime={handleFindBestTime}
                      getCurrentTimeHm={getCurrentHourMinuteString}
                      getTodayYmd={getTodayLocalDateString}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => handlePlanRoute()}
                disabled={loading}
                className="cursor-pointer flex-1 rounded-2xl bg-[#7DB0A6] py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#7DB0A6]/90 disabled:opacity-70"
              >
                {loading ? "Finding Quiet Route..." : "Find Quiet Route"}
              </button>

              <button
                type="button"
                onClick={handleSaveRoute}
                disabled={!startLocation.trim() || !destination.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F7F7F7] text-[#A8ADB5] shadow-md transition hover:bg-[#F1F5F4] hover:text-[#5A9A8E] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Save route to favourites"
                title="Save route to favourites"
              >
                <Bookmark size={19} strokeWidth={1.8} />
              </button>
            </div>

            {saveRouteMessage && (
              <p className="mt-3 text-sm font-medium text-[#5A9A8E]">
                {saveRouteMessage}
              </p>
            )}

            {error && (
              <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
            )}
          </div>

          {/* Desktop route summary */}
          <div
            ref={sidebarScrollRef}
            className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4"
          >
            {routeData ? (
              <div className="space-y-4">
                {/* Desktop Start / Exit button is now above the summary card */}
                {isNavigationActive ? (
                  <button
                    onClick={handleExitRoute}
                    className="w-full rounded-2xl bg-[#5A9A8E] py-3 font-medium text-white shadow-sm"
                  >
                    Exit
                  </button>
                ) : (
                  <button
                    onClick={handleStartNavigation}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5A9A8E] py-3 font-medium text-white shadow-sm"
                  >
                    <Navigation size={16} />
                    Start
                  </button>
                )}

                <div className="rounded-3xl border border-[#E8EEEC] bg-[#F8FBFA] p-4">
                  {/* Route Summary heading with small filter button on the right */}
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-[#1E2939]">
                      Route Summary
                    </h2>

                    {!isNavigationActive && (
                      <button
                        type="button"
                        onClick={handleOpenFilters}
                        className="cursor-pointer flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#DCE7E3] bg-[#E8F4F1] text-[#5A9A8E] shadow-sm transition-transform hover:scale-105 active:scale-95"
                        aria-label="Filter route"
                        title="Filter route"
                      >
                        <SlidersVertical size={17} className="text-[#5A9A8E]" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 text-sm text-[#1E2939]">
                    {departureConfig.enabled && (
                      <div className="flex justify-between gap-4">
                        <span className="text-[#6A7282]">Departure</span>
                        <span className="max-w-[55%] text-right font-medium text-[#5A9A8E]">
                          {departureSummary}
                        </span>
                      </div>
                    )}

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
                  </div>

                  <div ref={safeSpacesRef} className="mt-5">
                    <SafeSpaceStopoverPanel
                      safeSpaces={routeSafeSpaces}
                      onMoveStopUp={handleMoveSafeSpaceStopUp}
                      onMoveStopDown={handleMoveSafeSpaceStopDown}
                      selectedStops={selectedSafeSpaceStops}
                      isOpen={isSafeSpacesOpen}
                      onToggleOpen={() => setIsSafeSpacesOpen((prev) => !prev)}
                      onAddStop={handleAddSafeSpaceStop}
                      onRemoveStop={handleRemoveSafeSpaceStop}
                    />
                  </div>
                </div>
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
          <Navbar
            className="absolute left-1/2 -translate-x-1/2 top-8 w-auto hidden lg:flex"
            showLogo={false}
          />
          <RouteMap
            key={
              routeData
                ? JSON.stringify(routeData.route.geojson.coordinates)
                : "no-route"
            }
            routeData={routeData}
            crowdMapData={crowdMapData}
            noiseReportPins={noiseReportPins}
            focusedNoiseReportPin={focusedNoiseReportPin}
            allSafeSpaces={visibleAllSafeSpaces}
            isNavigationActive={isNavigationActive}
            selectedSafeSpaceFromPanel={selectedSafeSpaceFromPanel}
            userLocation={userLocation}
            onMapCenterChange={setMapCenter}
          />

          {isNavigationActive && activeNoiseNotice && (
            <div className="pointer-events-none absolute left-3 right-3 top-4 z-30 flex justify-center lg:top-24">
              <NavigationNoiseNotice
                distanceMeters={activeNoiseNotice.distanceMeters}
                noiseLevel={activeNoiseNotice.report.noiseLevel}
                onDismiss={() => {
                  dismissedNoiseNoticeIdsRef.current.add(
                    activeNoiseNotice.report.id,
                  );
                  setActiveNoiseNotice(null);
                }}
              />
            </div>
          )}

          {/* Mobile collapsed top card */}
          {!isMobileSearchOpen && !routeData && (
            <div className="absolute left-3 right-3 top-4 z-10 max-w-[calc(100vw-24px)] overflow-hidden lg:hidden">
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(true)}
                className="flex w-full min-w-0 items-center justify-between rounded-2xl border border-white/70 bg-white/92 px-4 py-3 shadow-lg backdrop-blur-sm"
              >
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-semibold text-[#1E2939]">
                    Quiet Route
                  </p>
                  <p className="truncate text-xs text-[#6A7282]">
                    {startLocation && destination
                      ? `${startLocation} → ${destination}`
                      : "Open search"}
                  </p>
                </div>

                <ChevronDown
                  size={18}
                  className="ml-2 shrink-0 text-[#1E2939]"
                />
              </button>
            </div>
          )}

          {/* Mobile search panel */}
          {isMobileSearchOpen && !routeData && (
            <section className="absolute left-3 right-3 top-4 z-30 max-w-[calc(100vw-24px)] overflow-visible lg:hidden">
              <div
                ref={mobileSearchPanelRef}
                className="flex w-full items-start gap-2"
              >
                {/* Back Button */}
                {/* <div className="shrink-0 pt-3">
                  <button
                    onClick={() => navigate("/")}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white bg-white/85 text-[#1E2939] shadow-sm"
                    aria-label="Go back"
                  >
                    <ArrowLeft size={17} />
                  </button>
                </div> */}
                <button
                  className="rounded-full border border-white/70 bg-white/95 p-4 text-[#1E2939] shadow-md backdrop-blur-sm"
                  onClick={() => setIsMenuOpen(true)}
                >
                  <Menu size={20} />
                </button>
                <MobileMenu
                  isOpen={isMenuOpen}
                  onClose={() => setIsMenuOpen(false)}
                />

                <div className="min-w-0 flex-1 flex-col">
                  <div className="min-w-0 flex-1 overflow-visible rounded-3xl border border-white/80 bg-white/95 shadow-md backdrop-blur-sm">
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
                        setUserLocation(null);
                        setLocationError("");
                        setIsStartSuggestionsOpen(value.trim().length >= 2);
                      }}
                      onSelect={handleStartSelect}
                      onFocus={() => {
                        setIsStartSuggestionsOpen(true);
                        setIsDestinationSuggestionsOpen(false);
                      }}
                      onLocationClick={handleUseCurrentLocation}
                      isLocating={isLocatingUser}
                      favouriteRoutes={favouriteRoutes}
                      onSelectFavouriteRoute={handleSelectFavouriteRoute}
                      onRemoveFavouriteRoute={handleRemoveFavouriteRoute}
                    />

                    {/* <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={isLocatingUser}
                      className="mx-4 mb-3 flex items-center justify-center gap-2 rounded-2xl border border-[#DCE7E3] bg-white/80 px-4 py-2 text-sm font-medium text-[#5A9A8E] shadow-sm disabled:opacity-60"
                    >
                      <MapPin size={16} />
                      {isLocatingUser
                        ? "Finding your location..."
                        : "Use Current Location"}
                    </button> */}

                    {locationError && (
                      <p className="mx-4 mb-3 text-xs font-medium text-red-600">
                        {locationError}
                      </p>
                    )}

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
                        setIsDestinationSuggestionsOpen(true);
                        setIsStartSuggestionsOpen(false);
                      }}
                      favouriteRoutes={favouriteRoutes}
                      onSelectFavouriteRoute={handleSelectFavouriteRoute}
                      onRemoveFavouriteRoute={handleRemoveFavouriteRoute}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDepartureOpen(true)}
                    className="mt-2 flex w-full items-center justify-between rounded-2xl border border-[#DCE7E3] bg-white px-4 py-2.5 text-sm text-[#1E2939] shadow-sm"
                  >
                    <span className="flex items-center gap-2">
                      <Clock3 size={15} className="text-[#5A9A8E]" />
                      Departure
                    </span>
                    <span className="font-medium text-[#5A9A8E]">
                      {departureSummary}
                    </span>
                  </button>

                  <AnimatePresence>
                    {startLocation && destination && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div className="mt-2 flex items-center gap-3">
                          <button
                            onClick={() => handlePlanRoute()}
                            disabled={loading}
                            className="flex-1 rounded-2xl bg-[#7DB0A6] py-3.5 text-sm font-semibold text-white shadow-md transition-transform active:scale-[0.98] disabled:opacity-70"
                          >
                            {loading
                              ? "Finding Quiet Route..."
                              : "Find Quiet Route"}
                          </button>

                          <button
                            type="button"
                            onClick={handleSaveRoute}
                            disabled={
                              !startLocation.trim() || !destination.trim()
                            }
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F7F7F7] text-[#A8ADB5] shadow-md transition hover:bg-[#F1F5F4] hover:text-[#5A9A8E] disabled:cursor-not-allowed disabled:opacity-80"
                            aria-label="Save route to favourites"
                            title="Save route to favourites"
                          >
                            <Bookmark size={19} strokeWidth={1.8} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {saveRouteMessage && (
                    <p className="mt-3 text-sm font-medium text-[#5A9A8E]">
                      {saveRouteMessage}
                    </p>
                  )}

                  {error && (
                    <p className="mt-3 text-sm font-medium text-red-600">
                      {error}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Mobile route preview top card - visible before navigation starts */}
          {routeData && !isNavigationActive && (
            <section className="absolute left-3 right-3 top-4 z-20 max-w-[calc(100vw-24px)] overflow-hidden lg:hidden">
              <div className="flex w-full items-start gap-2">
                <div className="shrink-0 pt-3">
                  <button
                    onClick={handleExitRoute}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white bg-white/85 text-[#1E2939] shadow-sm"
                    aria-label="Go back to search"
                  >
                    <ArrowLeft size={17} />
                  </button>
                </div>

                <div className="min-w-0 flex-1 overflow-hidden rounded-3xl border border-white bg-white/85 shadow-md backdrop-blur-sm">
                  <div className="flex min-w-0 items-center gap-2 px-3 py-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D4B896]">
                      <Navigation size={16} className="text-white" />
                    </div>
                    <p className="min-w-0 flex-1 truncate text-[13px] text-[#1E2939]">
                      {getStartDisplayName()}
                    </p>
                  </div>

                  <div className="mx-4 h-px bg-[#E8EEEC]" />

                  <div className="flex min-w-0 items-center gap-2 px-3 py-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7DB0A6]">
                      <MapPin size={16} className="text-white" />
                    </div>
                    <p className="min-w-0 flex-1 truncate text-[13px] text-[#1E2939]">
                      {getEndDisplayName()}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Mobile route preview: mic + Find Calm above the sheet so they do not cover it */}
          {routeData && !isNavigationActive && (
            <section className="absolute bottom-3 left-3 right-3 z-10 flex flex-col gap-3 lg:hidden">
              <div
                className={`flex shrink-0 items-end justify-between gap-3 px-1 ${
                  isSafeSpacesOpen
                    ? "pointer-events-none opacity-0 transition-opacity duration-200"
                    : "opacity-100 transition-opacity duration-200"
                }`}
              >
                <div className="flex flex-col items-start gap-2">
                  {isMonitoring && <VolumeBar volume={volume} />}
                  <MicButton
                    onClick={
                      isMonitoring ? stopMonitoring : () => setIsPopUpOpen(true)
                    }
                    isActive={isMonitoring}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/support")}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/85 bg-[#7DB0A6] text-white shadow-lg"
                  aria-label="Go to Find Calm page"
                >
                  <Wind size={24} />
                </button>
              </div>
              <RoutePreviewPanel
                routeData={routeData}
                safeSpaces={routeSafeSpaces}
                onMoveStopUp={handleMoveSafeSpaceStopUp}
                onMoveStopDown={handleMoveSafeSpaceStopDown}
                selectedStops={selectedSafeSpaceStops}
                isSafeSpacesOpen={isSafeSpacesOpen}
                isNavigationActive={isNavigationActive}
                formatRouteLength={formatRouteLength}
                estimateWalkingMinutes={estimateWalkingMinutes}
                onOpenFilters={handleOpenFilters}
                onStartNavigation={handleStartNavigation}
                onExitRoute={handleExitRoute}
                onToggleSafeSpaces={() => setIsSafeSpacesOpen((prev) => !prev)}
                onAddStop={handleAddSafeSpaceStop}
                onRemoveStop={handleRemoveSafeSpaceStop}
              />
            </section>
          )}

          {routeData && isNavigationActive && (
            <button
              onClick={handleExitRoute}
              className="absolute bottom-6 left-4 right-4 z-20 rounded-2xl bg-[#5A9A8E] py-3 font-medium text-white shadow-lg lg:hidden"
            >
              Exit Navigation
            </button>
          )}

          {/* Mobile mic + Find Calm */}
          {(!routeData || isNavigationActive) && (
            <>
              <div
                className={`absolute left-4 z-20 lg:hidden ${
                  isNavigationActive ? "bottom-[5.75rem]" : "bottom-6"
                } ${
                  routeData && isSafeSpacesOpen
                    ? "pointer-events-none opacity-0 transition-opacity duration-200"
                    : "opacity-100 transition-opacity duration-200"
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

              <div
                className={`absolute right-4 z-20 lg:hidden ${
                  isNavigationActive ? "bottom-[5.75rem]" : "bottom-6"
                } ${
                  routeData && isSafeSpacesOpen
                    ? "pointer-events-none opacity-0 transition-opacity duration-200"
                    : "opacity-100 transition-opacity duration-200"
                }`}
              >
                <div className="relative flex flex-col items-end gap-3">
                  {/* Expanded Menu */}
                  <AnimatePresence>
                    {isQuickMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col items-end gap-3"
                      >
                        {/* Soundscape */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => navigate("/soundscape")}
                            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7DB0A6]/80 border border-white/60 text-white shadow-lg"
                          >
                            <Headphones size={20} />
                          </button>
                          {hasUsedAudio && playingId && (
                            <button
                              type="button"
                              onClick={() => {
                                if (isPaused) {
                                  resumeAudio();
                                } else {
                                  pauseAudio();
                                }
                              }}
                              className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border border-white bg-white text-[#5A9A8E] shadow-md"
                            >
                              {isPaused ? (
                                <Play size={14} />
                              ) : (
                                <Pause size={14} />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Support */}
                        <button
                          type="button"
                          onClick={() =>
                            navigate("/support", { state: { fromMap: true } })
                          }
                          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7DB0A6]/80 border border-white/60 text-white shadow-lg cursor-pointer"
                          aria-label="Support"
                        >
                          <Wind size={20} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Main Arrow Button */}
                  <button
                    type="button"
                    onClick={() => setIsQuickMenuOpen((prev) => !prev)}
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/80 border border-[#7DB0A6]/30 text-[#7DB0A6] shadow-lg transition-transform curosor-pointer"
                    aria-label="Open quick menu"
                  >
                    <ChevronUp
                      size={24}
                      className={`transition-transform duration-300 ${
                        isQuickMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>
            </>
          )}

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
            <div className="relative flex flex-col items-end gap-3">
              {/* Expanded Menu */}
              <AnimatePresence>
                {isQuickMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-end gap-3"
                  >
                    {/* Soundscape */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => navigate("/soundscape")}
                        className="cursor-pointer flex h-14 w-14 items-center justify-center rounded-full bg-[#7DB0A6]/80 border border-white/60 text-white shadow-lg"
                      >
                        <Headphones size={20} />
                      </button>
                      {hasUsedAudio && playingId && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isPaused) {
                              resumeAudio();
                            } else {
                              pauseAudio();
                            }
                          }}
                          className="cursor-pointer absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-white bg-white text-[#5A9A8E] shadow-md"
                        >
                          {isPaused ? <Play size={14} /> : <Pause size={14} />}
                        </button>
                      )}
                    </div>

                    {/* {hasUsedAudio && playingId && (
                      <button
                        type="button"
                        onClick={() => {
                          if (isPaused) {
                            resumeAudio();
                          } else {
                            pauseAudio();
                          }
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/85 bg-white text-[#5A9A8E] shadow-lg"
                        aria-label={isPaused ? "Resume audio" : "Pause audio"}
                      >
                        {isPaused ? <Play size={18} /> : <Pause size={18} />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate("/soundscape")}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7DB0A6]/80 border border-white/60 text-white shadow-lg"
                      aria-label="Soundscape"
                    >
                      <Headphones size={20} />
                    </button> */}

                    {/* Support */}
                    {/* Support */}
                    <button
                      type="button"
                      onClick={() => {
                        const previewSnapshot = {
                          routeData,
                          startLocation,
                          destination,
                          selectedStart,
                          selectedDestination,
                          selectedSafeSpaceStops,
                          selectedSafeSpaceFromPanel,
                          isSafeSpacesOpen,
                          isMobileSearchOpen,
                          userLocation,
                        };

                        sessionStorage.setItem(
                          FILTER_PREVIEW_STATE_KEY,
                          JSON.stringify(previewSnapshot),
                        );

                        navigate("/support", {
                          state: { fromMap: true },
                        });
                      }}
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7DB0A6]/80 border border-white/60 text-white shadow-lg cursor-pointer"
                      aria-label="Support"
                    >
                      <Wind size={20} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Arrow Button */}
              <button
                type="button"
                onClick={() => setIsQuickMenuOpen((prev) => !prev)}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/80 border border-[#7DB0A6]/30 text-[#7DB0A6] shadow-lg transition-transform curosor-pointer"
                aria-label="Open quick menu"
              >
                <ChevronUp
                  size={24}
                  className={`transition-transform duration-300 ${
                    isQuickMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isDepartureOpen && !routeData && (
        <div className="absolute inset-0 z-40 flex items-end justify-center overflow-x-hidden bg-black/25 p-3 lg:hidden">
          <div className="w-full min-w-0 max-w-md max-h-[90dvh] overflow-x-hidden overflow-y-auto rounded-3xl border border-white/60 bg-white shadow-xl">
            <DepartureEditor
              isBestTimeTab={isBestTimeTab}
              setIsBestTimeTab={setIsBestTimeTab}
              departureConfig={departureConfig}
              setDepartureConfig={setDepartureConfig}
              bestTimeSuggestion={bestTimeSuggestion}
              isBestTimeLoading={isBestTimeLoading}
              onCancel={() => {
                setIsDepartureOpen(false);
                setBestTimeSuggestion(null);
              }}
              onApplyChooseTime={async () => {
                if (
                  isChosenDepartureInPast(
                    departureConfig.date,
                    departureConfig.time,
                  )
                ) {
                  return;
                }
                const nextDepartureConfig: DepartureConfig = {
                  ...departureConfig,
                  enabled: true,
                };
                setDepartureConfig(nextDepartureConfig);
                setIsDepartureOpen(false);
                await handlePlanRoute(
                  selectedSafeSpaceStops,
                  selectedSafeSpaceTypes,
                  selectedAvoidMode,
                  nextDepartureConfig,
                );
              }}
              onFindBestTime={handleFindBestTime}
              getCurrentTimeHm={getCurrentHourMinuteString}
              getTodayYmd={getTodayLocalDateString}
            />
          </div>
        </div>
      )}

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
        onConfirm={handleSubmitNoiseReport}
      />

      {/* New Badge Popup */}
      {newBadgePopup && (
        <BadgeUnlockedPopup
          key={newBadgePopup.id}
          badge={newBadgePopup}
          onClose={() => {
            shiftPendingBadgePopupQueue();
            setNewBadgePopup(peekNextPendingBadgePopup());
          }}
        />
      )}

      {/* Report Successful Popup */}
      <ReportSuccess
        isOpen={isReportSuccessOpen}
        onClose={() => setIsReportSuccessOpen(false)}
        onViewBadges={() => {
          setIsReportSuccessOpen(false);
          navigate("/achievements");
        }}
      />
    </main>
  );
}
