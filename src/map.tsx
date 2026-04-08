import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MicButton } from "./components/mic-button";
import { PopUp } from "./components/pop-up";
import { RouteMap } from "./components/route-map";
import type {
  PlanRouteResponse,
  RoutePreference,
} from "./types/route";

// Backend base URL from the Vite environment file
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export function Map() {
  const navigate = useNavigate();

  // Controls microphone popup visibility
  const [isPopUpOpen, setIsPopUpOpen] = useState(false);

  // Form input state
  const [startLocation, setStartLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [preference, setPreference] =
    useState<RoutePreference>("quietest");

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Stores the real route response from the backend
  const [routeData, setRouteData] = useState<PlanRouteResponse | null>(null);

  // Converts route preference into nicer UI text
  const formatPreferenceLabel = (value: RoutePreference) => {
    if (value === "quietest") return "Quietest";
    if (value === "balanced") return "Balanced";
    return "Fastest";
  };

  // Formats route length into user-friendly text
  // Example:
  // 362.08 -> 362 m
  // 1200 -> 1.20 km
  const formatRouteLength = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }

    return `${(meters / 1000).toFixed(2)} km`;
  };

  // Sends route planning request to backend
  const handlePlanRoute = async () => {
    setError("");

    // Basic form validation
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

    // Prevent requests if backend base URL has not been set
    if (!API_BASE_URL) {
      setRouteData(null);
      setError(
        "API base URL not set. Add VITE_API_BASE_URL to your .env file."
      );
      return;
    }

    setLoading(true);

    try {
      // Request body based on teammate's backend contract
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

      // Read as text first so the app does not crash on empty or invalid JSON
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

      // TypeError is common when the backend server is offline
      if (err instanceof TypeError) {
        setError(
          "Cannot connect to the backend server right now. Please make sure it is running on localhost:3000."
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
    <main className="min-h-screen px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate("/")}
        className="mb-4 text-sm text-[#1E2939] font-medium hover:underline"
      >
        ← Back
      </button>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-[#1E2939]">
          Plan Your Quiet Route
        </h1>
        <p className="text-[#6A7282] mt-1">
          Find a calmer path through the Melbourne CBD.
        </p>
      </div>

      {/* Main responsive page layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left column */}
        <div className="w-full lg:w-[420px] flex flex-col gap-5">
          {/* Route planning form */}
          <section className="bg-white/70 rounded-3xl shadow-md p-5 border border-white/60">
            <div className="flex flex-col gap-4">
              {/* Start location */}
              <div>
                <label
                  htmlFor="startLocation"
                  className="block text-sm font-medium text-[#1E2939] mb-2"
                >
                  Start location
                </label>
                <input
                  id="startLocation"
                  type="text"
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  placeholder="e.g. Flinders Street Station"
                  className="w-full rounded-2xl border border-[#D5D7DA] px-4 py-3 bg-white text-[#1E2939] outline-none"
                />
                <p className="text-xs text-[#6A7282] mt-2">
                  Enter a Melbourne CBD starting point.
                </p>
              </div>

              {/* Destination */}
              <div>
                <label
                  htmlFor="destination"
                  className="block text-sm font-medium text-[#1E2939] mb-2"
                >
                  Destination
                </label>
                <input
                  id="destination"
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. State Library Victoria"
                  className="w-full rounded-2xl border border-[#D5D7DA] px-4 py-3 bg-white text-[#1E2939] outline-none"
                />
                <p className="text-xs text-[#6A7282] mt-2">
                  Choose where you want to go.
                </p>
              </div>

              {/* Route preference buttons
                  Note: backend does not currently use this value yet. */}
              <div>
                <label className="block text-sm font-medium text-[#1E2939] mb-2">
                  Route preference
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {(["quietest", "balanced", "fastest"] as RoutePreference[]).map(
                    (option) => {
                      const isSelected = preference === option;

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setPreference(option)}
                          className={`rounded-2xl px-3 py-3 text-sm font-medium border transition ${
                            isSelected
                              ? "bg-[#1E2939]/85 text-white border-[#1E2939]/85"
                              : "bg-white text-[#1E2939] border-[#D5D7DA]"
                          }`}
                        >
                          {formatPreferenceLabel(option)}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Submit button */}
              <button
                onClick={handlePlanRoute}
                disabled={loading}
                className="w-full bg-[#1E2939]/85 text-white py-3 rounded-2xl shadow-md font-medium disabled:opacity-70"
              >
                {loading ? "Finding route..." : "Find Quiet Route"}
              </button>

              {/* Error message */}
              {error && (
                <p className="text-sm text-red-600 font-medium">{error}</p>
              )}
            </div>
          </section>

          {/* Empty state before first request */}
          {!routeData && (
            <section className="bg-white/60 rounded-3xl shadow-md p-5 border border-white/60">
              <h2 className="text-lg font-semibold text-[#1E2939] mb-2">
                Route Preview
              </h2>
              <p className="text-[#6A7282] text-sm">
                Enter a start point and destination to generate a quieter route
                and display it on the map.
              </p>
            </section>
          )}

          {/* Real backend route summary */}
          {routeData && (
            <section className="bg-white/75 rounded-3xl shadow-md p-5 border border-white/60">
              <h2 className="text-lg font-semibold text-[#1E2939] mb-4">
                Route Summary
              </h2>

              <div className="space-y-3 text-sm text-[#1E2939]">
                <div className="flex justify-between gap-4">
                  <span className="font-medium">From</span>
                  <span className="text-right">
                    {routeData.start.resolvedName}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="font-medium">To</span>
                  <span className="text-right">
                    {routeData.end.resolvedName}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="font-medium">Preference</span>
                  <span className="text-right">
                    {formatPreferenceLabel(preference)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="font-medium">Route length</span>
                  <span className="text-right">
                    {formatRouteLength(routeData.route.totalLength)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="font-medium">Route score</span>
                  <span className="text-right">
                    {routeData.route.totalCost.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="font-medium">Edges used</span>
                  <span className="text-right">
                    {routeData.route.edgeIds.length}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="font-medium">Nodes used</span>
                  <span className="text-right">
                    {routeData.route.nodeIds.length}
                  </span>
                </div>
              </div>

              <p className="text-[#4A5565] mt-4 text-sm">
                Route score is the backend’s weighted value used for route
                selection, influenced by distance, noise, and crowd conditions.
              </p>
            </section>
          )}
        </div>

        {/* Right column: map */}
        <div className="w-full flex-1">
          <section className="bg-white/60 rounded-3xl shadow-md p-5 border border-white/60">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-[#1E2939]">
                Map Preview
              </h2>
              <span className="text-xs text-[#6A7282]">
                Melbourne CBD view
              </span>
            </div>

            <RouteMap routeData={routeData} />
          </section>
        </div>
      </div>

      {/* Floating microphone button */}
      <div className="fixed bottom-6 right-6">
        <MicButton onClick={() => setIsPopUpOpen(true)} />
      </div>

      {/* Microphone popup */}
      {isPopUpOpen && <PopUp onClose={() => setIsPopUpOpen(false)} />}
    </main>
  );
}