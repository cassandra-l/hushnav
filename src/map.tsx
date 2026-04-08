import { useState } from "react";
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

export function Map() {
  const navigate = useNavigate();

  // Controls microphone popup visibility
  const [isPopUpOpen, setIsPopUpOpen] = useState(false);

  // Mobile-only state to collapse/expand the top search panel
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(true);

  // User text input state
  const [startLocation, setStartLocation] = useState("");
  const [destination, setDestination] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Stores real backend route data
  const [routeData, setRouteData] = useState<PlanRouteResponse | null>(null);

  // Format distance from meters to a cleaner UI label
  const formatRouteLength = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  // Temporary walking-time estimate until backend returns duration
  const estimateWalkingMinutes = (meters: number) => {
    return Math.max(1, Math.round(meters / 84));
  };

  // Handles quiet-route request
  const handlePlanRoute = async () => {
    setError("");

    if (!startLocation.trim() || !destination.trim()) {
      setRouteData(null);
      setError("Please enter both a start location and destination.");
      return;
    }

    if (
      startLocation.trim().toLowerCase() ===
      destination.trim().toLowerCase()
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
      // Backend currently plans the quietest route
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

      // Read text first so invalid JSON does not crash the page
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

      // After route is found on mobile, collapse the top panel
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
      {/* Desktop layout:
          - left panel like Google Maps
          - map fills remaining space
          Mobile layout:
          - full-screen map with floating overlays */}
      <div className="h-full w-full lg:grid lg:grid-cols-[380px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:flex-col h-full bg-white border-r border-[#E8EEEC] z-20">
          <div className="px-5 pt-5 pb-4 border-b border-[#E8EEEC]">
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

            {/* Desktop start input */}
            <div className="mb-3">
              <label
                htmlFor="desktopStartLocation"
                className="block text-xs font-medium text-[#4A5565] mb-2"
              >
                Start
              </label>

              <div className="flex items-center gap-3 rounded-2xl border border-[#DCE7E3] bg-white px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-[#D4B896] flex items-center justify-center shrink-0">
                  <Navigation size={16} className="text-white" />
                </div>

                <Search size={16} className="text-[#5A9A8E] shrink-0" />

                <input
                  id="desktopStartLocation"
                  type="text"
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  placeholder="Enter start location"
                  className="w-full bg-transparent outline-none text-[14px] text-[#1E2939] placeholder:text-[#8B98A5]"
                />
              </div>
            </div>

            {/* Desktop destination input */}
            <div className="mb-4">
              <label
                htmlFor="desktopDestination"
                className="block text-xs font-medium text-[#4A5565] mb-2"
              >
                Destination
              </label>

              <div className="flex items-center gap-3 rounded-2xl border border-[#DCE7E3] bg-white px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-[#7DB0A6] flex items-center justify-center shrink-0">
                  <MapPin size={16} className="text-white" />
                </div>

                <Search size={16} className="text-[#5A9A8E] shrink-0" />

                <input
                  id="desktopDestination"
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Enter destination"
                  className="w-full bg-transparent outline-none text-[14px] text-[#1E2939] placeholder:text-[#8B98A5]"
                />
              </div>
            </div>

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

          {/* Desktop route details panel */}
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

        {/* Map area */}
        <div className="relative h-full w-full">
          <RouteMap routeData={routeData} />

          {/* Mobile collapsed button */}
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

          {/* Mobile top floating search panel */}
          {isMobileSearchOpen && (
            <section className="absolute top-4 left-4 right-4 z-10 lg:hidden">
              <div className="bg-white/92 backdrop-blur-sm rounded-[28px] shadow-xl p-4 border border-white/70">
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

                {/* Mobile start input */}
                <div className="mb-3">
                  <label
                    htmlFor="mobileStartLocation"
                    className="block text-xs font-medium text-[#4A5565] mb-2"
                  >
                    Start
                  </label>

                  <div className="flex items-center gap-3 rounded-2xl border border-[#DCE7E3] bg-white/80 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-[#D4B896] flex items-center justify-center shrink-0">
                      <Navigation size={16} className="text-white" />
                    </div>

                    <Search size={16} className="text-[#5A9A8E] shrink-0" />

                    <input
                      id="mobileStartLocation"
                      type="text"
                      value={startLocation}
                      onChange={(e) => setStartLocation(e.target.value)}
                      placeholder="Enter start location"
                      className="w-full bg-transparent outline-none text-[14px] text-[#1E2939] placeholder:text-[#8B98A5]"
                    />
                  </div>
                </div>

                {/* Mobile destination input */}
                <div className="mb-4">
                  <label
                    htmlFor="mobileDestination"
                    className="block text-xs font-medium text-[#4A5565] mb-2"
                  >
                    Destination
                  </label>

                  <div className="flex items-center gap-3 rounded-2xl border border-[#DCE7E3] bg-white/80 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-[#7DB0A6] flex items-center justify-center shrink-0">
                      <MapPin size={16} className="text-white" />
                    </div>

                    <Search size={16} className="text-[#5A9A8E] shrink-0" />

                    <input
                      id="mobileDestination"
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Enter destination"
                      className="w-full bg-transparent outline-none text-[14px] text-[#1E2939] placeholder:text-[#8B98A5]"
                    />
                  </div>
                </div>

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

          {/* Mobile bottom info bar */}
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

          {/* Floating action buttons on mobile only */}
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

          {/* Desktop mic button */}
          <div className="hidden lg:block absolute bottom-6 right-6 z-10">
            <MicButton onClick={() => setIsPopUpOpen(true)} />
          </div>
        </div>
      </div>

      {/* Mic popup */}
      {isPopUpOpen && <PopUp onClose={() => setIsPopUpOpen(false)} />}
    </main>
  );
}