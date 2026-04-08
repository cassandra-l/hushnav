import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MicButton } from "./components/mic-button";
import { PopUp } from "./components/pop-up";
import { RouteMap } from "./components/route-map";

// Available route preference options
type RoutePreference = "quietest" | "balanced" | "fastest";

// Shape of the route data we are currently mocking on the frontend
type RouteResult = {
  routeName: string;
  distance: string;
  estimatedTime: string;
  quietScore: number;
  notes: string;
  quietSpaces: number;
  crowdLevel: string;
  directions: string[];
  tags: string[];
};

export function Map() {
  const navigate = useNavigate();

  // Controls microphone popup visibility
  const [isPopUpOpen, setIsPopUpOpen] = useState(false);

  // Form inputs
  const [startLocation, setStartLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [preference, setPreference] =
    useState<RoutePreference>("quietest");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Route result to display after the user plans a route
  const [routeResult, setRouteResult] =
    useState<RouteResult | null>(null);

  // Small helper to make preference text look nicer in the UI
  const formatPreferenceLabel = (value: RoutePreference) => {
    if (value === "quietest") return "Quietest";
    if (value === "balanced") return "Balanced";
    return "Fastest";
  };

  // Handles route generation
  // Right now this uses mock data
  // Later this is where you will replace the mock with a real backend API call
  const handlePlanRoute = async () => {
    setError("");

    // Validation: both fields must be filled in
    if (!startLocation.trim() || !destination.trim()) {
      setRouteResult(null);
      setError("Please enter both a start location and destination.");
      return;
    }

    // Validation: start and destination should not be the same
    if (
      startLocation.trim().toLowerCase() ===
      destination.trim().toLowerCase()
    ) {
      setRouteResult(null);
      setError("Start location and destination cannot be the same.");
      return;
    }

    setLoading(true);

    try {
      // Simulated delay to mimic a real API request
      await new Promise((resolve) => setTimeout(resolve, 1000));

      let mockRoute: RouteResult;

      if (preference === "quietest") {
        mockRoute = {
          routeName: "Quietest Route",
          distance: "1.9 km",
          estimatedTime: "25 mins",
          quietScore: 91,
          notes:
            "This route avoids high foot traffic streets and passes quieter areas.",
          quietSpaces: 3,
          crowdLevel: "Low",
          tags: ["Low noise", "3 quiet spaces", "Avoids busy streets"],
          directions: [
            `Start at ${startLocation}.`,
            "Head north along a quieter side street.",
            "Continue through a low traffic section.",
            `Arrive at ${destination}.`,
          ],
        };
      } else if (preference === "balanced") {
        mockRoute = {
          routeName: "Balanced Route",
          distance: "1.6 km",
          estimatedTime: "21 mins",
          quietScore: 78,
          notes:
            "This route balances lower noise levels with a reasonable travel time.",
          quietSpaces: 2,
          crowdLevel: "Moderate",
          tags: ["Balanced option", "2 quiet spaces", "Moderate traffic"],
          directions: [
            `Start at ${startLocation}.`,
            "Walk through a mixed traffic street.",
            "Take a quieter connecting road toward the city centre.",
            `Arrive at ${destination}.`,
          ],
        };
      } else {
        mockRoute = {
          routeName: "Fastest Route",
          distance: "1.4 km",
          estimatedTime: "18 mins",
          quietScore: 60,
          notes:
            "This route is faster, but may include busier streets and noisier sections.",
          quietSpaces: 1,
          crowdLevel: "High",
          tags: ["Fastest", "Busier streets", "Direct path"],
          directions: [
            `Start at ${startLocation}.`,
            "Take the most direct route through the CBD.",
            "Continue through a main pedestrian corridor.",
            `Arrive at ${destination}.`,
          ],
        };
      }

      setRouteResult(mockRoute);
    } catch {
      setRouteResult(null);
      setError("Something went wrong while planning your route.");
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

      {/* Main responsive layout:
          - mobile: stacked
          - desktop: left panel + large map on right */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left column: form + summary + directions */}
        <div className="w-full lg:w-[420px] flex flex-col gap-5">
          {/* Route planning form */}
          <section className="bg-white/70 rounded-3xl shadow-md p-5 border border-white/60">
            <div className="flex flex-col gap-4">
              {/* Start location input */}
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

              {/* Destination input */}
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

              {/* Route preference selector */}
              <div>
                <label className="block text-sm font-medium text-[#1E2939] mb-2">
                  Route preference
                </label>

                {/* Using buttons instead of a dropdown makes the choice easier to see */}
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

              {/* Plan route button */}
              <button
                onClick={handlePlanRoute}
                disabled={loading}
                className="w-full bg-[#1E2939]/85 text-white py-3 rounded-2xl shadow-md font-medium disabled:opacity-70"
              >
                {loading ? "Planning route..." : "Plan Route"}
              </button>

              {/* Error state */}
              {error && (
                <p className="text-sm text-red-600 font-medium">{error}</p>
              )}
            </div>
          </section>

          {/* Empty state shown before any route has been generated */}
          {!routeResult && (
            <section className="bg-white/60 rounded-3xl shadow-md p-5 border border-white/60">
              <h2 className="text-lg font-semibold text-[#1E2939] mb-2">
                Route Preview
              </h2>
              <p className="text-[#6A7282] text-sm">
                Enter a start point and destination to generate a quieter route
                with summary details and step-by-step directions.
              </p>
            </section>
          )}

          {/* Route summary card */}
          {routeResult && (
            <section className="bg-white/75 rounded-3xl shadow-md p-5 border border-white/60">
              <h2 className="text-lg font-semibold text-[#1E2939] mb-4">
                Route Summary
              </h2>

              {/* Route tags make the result look smarter and easier to scan */}
              <div className="flex flex-wrap gap-2 mb-4">
                {routeResult.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-[#DDEAE7] text-[#1E2939] text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="space-y-3 text-sm text-[#1E2939]">
                <div className="flex justify-between gap-4">
                  <span className="font-medium">From</span>
                  <span className="text-right">{startLocation}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="font-medium">To</span>
                  <span className="text-right">{destination}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="font-medium">Route</span>
                  <span className="text-right">{routeResult.routeName}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="font-medium">Preference</span>
                  <span className="text-right">
                    {formatPreferenceLabel(preference)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="font-medium">Distance</span>
                  <span className="text-right">{routeResult.distance}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="font-medium">Estimated time</span>
                  <span className="text-right">
                    {routeResult.estimatedTime}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="font-medium">Quiet score</span>
                  <span className="text-right">
                    {routeResult.quietScore}/100
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="font-medium">Crowd level</span>
                  <span className="text-right">{routeResult.crowdLevel}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="font-medium">Quiet spaces nearby</span>
                  <span className="text-right">{routeResult.quietSpaces}</span>
                </div>
              </div>

              <p className="text-[#4A5565] mt-4 text-sm">{routeResult.notes}</p>
            </section>
          )}

          {/* Directions card */}
          {routeResult && (
            <section className="bg-white/75 rounded-3xl shadow-md p-5 border border-white/60">
              <h2 className="text-lg font-semibold text-[#1E2939] mb-4">
                Directions
              </h2>

              <div className="flex flex-col gap-3">
                {routeResult.directions.map((step, index) => (
                  <div
                    key={index}
                    className="flex gap-3 items-start bg-[#F7FAF9] rounded-2xl px-4 py-3 border border-[#E5ECE9]"
                  >
                    {/* Step number */}
                    <div className="w-7 h-7 rounded-full bg-[#7DB0A6] text-white text-sm font-semibold flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </div>

                    {/* Step description */}
                    <p className="text-sm text-[#1E2939]">{step}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column: larger map area */}
        <div className="w-full flex-1">
          <section className="bg-white/60 rounded-3xl shadow-md p-5 border border-white/60">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-[#1E2939]">
                Map Preview
              </h2>

              {/* Small helper label for presentation/demo purposes */}
              <span className="text-xs text-[#6A7282]">
                Melbourne CBD view
              </span>
            </div>

            {/* Interactive map component */}
            <RouteMap
              startLocation={startLocation}
              destination={destination}
            />
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