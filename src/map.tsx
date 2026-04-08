import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, MapPin, Navigation } from "lucide-react";
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

  // User input state
  const [startLocation, setStartLocation] = useState("");
  const [destination, setDestination] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Stores the real route response from the backend
  const [routeData, setRouteData] = useState<PlanRouteResponse | null>(null);

  // Format distance from meters into readable text
  const formatRouteLength = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }

    return `${(meters / 1000).toFixed(1)} km`;
  };

  // Simple frontend walking-time estimate
  // Backend does not currently return duration, so this gives a UI-friendly estimate
  const estimateWalkingMinutes = (meters: number) => {
    return Math.max(1, Math.round(meters / 84));
  };

  // Send the quiet-route request to backend
  const handlePlanRoute = async () => {
    setError("");

    // Basic validation
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
      // Quietest route only: backend currently plans the quiet route
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

      // Read text first so invalid JSON or empty responses do not crash the app
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
      {/* Full-screen map sits underneath the floating UI */}
      <RouteMap routeData={routeData} />

      {/* Top floating search panel */}
      <section className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-white/92 backdrop-blur-sm rounded-[28px] shadow-xl p-4 border border-white/70">
          {/* Header row */}
          <div className="flex items-center gap-3 mb-4">
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

          {/* Start input */}
          <div className="mb-3">
            <label
              htmlFor="startLocation"
              className="block text-xs font-medium text-[#4A5565] mb-2"
            >
              Origin
            </label>

            <div className="flex items-center gap-3 rounded-2xl border border-[#DCE7E3] bg-white/80 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-[#D4B896] flex items-center justify-center shrink-0">
                <Navigation size={16} className="text-white" />
              </div>

              <Search size={16} className="text-[#5A9A8E] shrink-0" />

              <input
                id="startLocation"
                type="text"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                placeholder="Enter start location"
                className="w-full bg-transparent outline-none text-[14px] text-[#1E2939] placeholder:text-[#8B98A5]"
              />
            </div>
          </div>

          {/* Destination input */}
          <div className="mb-4">
            <label
              htmlFor="destination"
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
                id="destination"
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Enter destination"
                className="w-full bg-transparent outline-none text-[14px] text-[#1E2939] placeholder:text-[#8B98A5]"
              />
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={handlePlanRoute}
            disabled={loading}
            className="w-full rounded-2xl bg-[#5A9A8E] text-white py-3 font-medium shadow-md disabled:opacity-70"
          >
            {loading ? "Finding quiet route..." : "Find Quiet Route"}
          </button>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-600 font-medium mt-3">{error}</p>
          )}
        </div>
      </section>

      {/* Bottom floating route info bar */}
      <section className="absolute bottom-4 left-4 right-4 z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-[28px] shadow-xl border border-white/80 overflow-hidden">
          {routeData ? (
            <div className="grid grid-cols-4 items-center text-center">
              {/* Noise level */}
              <div className="px-3 py-4 border-r border-[#E8EEEC]">
                <p className="text-xs text-[#6A7282]">Noise Level</p>
                <p className="text-[15px] font-medium text-[#5A9A8E]">Quiet</p>
              </div>

              {/* Distance */}
              <div className="px-3 py-4 border-r border-[#E8EEEC]">
                <p className="text-xs text-[#6A7282]">Distance</p>
                <p className="text-[15px] font-medium text-[#1E2939]">
                  {formatRouteLength(routeData.route.totalLength)}
                </p>
              </div>

              {/* Duration */}
              <div className="px-3 py-4 border-r border-[#E8EEEC]">
                <p className="text-xs text-[#6A7282]">Duration</p>
                <p className="text-[15px] font-medium text-[#1E2939]">
                  {estimateWalkingMinutes(routeData.route.totalLength)} min
                </p>
              </div>

              {/* Exit button */}
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
                  Search for a start point and destination to display your route.
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

      {/* Floating microphone button */}
      <div className="absolute bottom-28 left-4 z-10">
        <MicButton onClick={() => setIsPopUpOpen(true)} />
      </div>

      {/* Optional second floating calm button to match the style more closely */}
      <div className="absolute bottom-28 right-4 z-10">
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

      {/* Mic popup */}
      {isPopUpOpen && <PopUp onClose={() => setIsPopUpOpen(false)} />}
    </main>
  );
}