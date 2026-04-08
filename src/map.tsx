import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MicButton } from "./components/mic-button";
import { PopUp } from "./components/pop-up";
import { RouteMap } from "./components/route-map"; // Map component

// Type for route preference dropdown
type RoutePreference = "quietest" | "balanced" | "fastest";

// Type for route result (mock data for now)
type RouteResult = {
  routeName: string;
  distance: string;
  estimatedTime: string;
  quietScore: number;
  notes: string;
  quietSpaces: number;
  crowdLevel: string;
  directions: string[];
};

export function Map() {
  const navigate = useNavigate();

  // -------------------------
  // STATE MANAGEMENT
  // -------------------------

  const [isPopUpOpen, setIsPopUpOpen] = useState(false);

  const [startLocation, setStartLocation] = useState("");
  const [destination, setDestination] = useState("");

  const [preference, setPreference] =
    useState<RoutePreference>("quietest");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [routeResult, setRouteResult] =
    useState<RouteResult | null>(null);

  // -------------------------
  // HANDLE ROUTE PLANNING
  // -------------------------

  const handlePlanRoute = async () => {
    setError("");

    // Validation: ensure inputs are filled
    if (!startLocation.trim() || !destination.trim()) {
      setRouteResult(null);
      setError("Please enter both a start location and destination.");
      return;
    }

    // Validation: prevent same start + destination
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
      // -------------------------
      // MOCK DATA (replace later with backend API)
      // -------------------------
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
            "This route balances lower noise with travel efficiency.",
          quietSpaces: 2,
          crowdLevel: "Moderate",
          directions: [
            `Start at ${startLocation}.`,
            "Walk through mixed traffic streets.",
            "Take a quieter connecting street.",
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
            "This route is faster but may include busy streets.",
          quietSpaces: 1,
          crowdLevel: "High",
          directions: [
            `Start at ${startLocation}.`,
            "Take the most direct route.",
            "Continue through main pedestrian areas.",
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
    <main className="min-h-screen px-6 py-6 max-w-md mx-auto">
      {/* -------------------------
          BACK BUTTON
      ------------------------- */}
      <button
        onClick={() => navigate("/")}
        className="mb-4 text-sm text-[#1E2939] font-medium"
      >
        ← Back
      </button>

      {/* -------------------------
          PAGE HEADER
      ------------------------- */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-[#1E2939]">
          Plan Your Quiet Route
        </h1>
        <p className="text-[#6A7282] mt-1">
          Find a calmer path through the Melbourne CBD.
        </p>
      </div>

      {/* -------------------------
          INPUT FORM
      ------------------------- */}
      <section className="bg-white/70 rounded-3xl shadow-md p-5 mb-5 border border-white/60">
        <div className="flex flex-col gap-4">
          {/* Start location */}
          <div>
            <label className="block text-sm font-medium text-[#1E2939] mb-2">
              Start location
            </label>
            <input
              type="text"
              value={startLocation}
              onChange={(e) => setStartLocation(e.target.value)}
              placeholder="e.g. Flinders Street Station"
              className="w-full rounded-2xl border border-[#D5D7DA] px-4 py-3"
            />
          </div>

          {/* Destination */}
          <div>
            <label className="block text-sm font-medium text-[#1E2939] mb-2">
              Destination
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. State Library Victoria"
              className="w-full rounded-2xl border border-[#D5D7DA] px-4 py-3"
            />
          </div>

          {/* Preference */}
          <div>
            <label className="block text-sm font-medium text-[#1E2939] mb-2">
              Route preference
            </label>
            <select
              value={preference}
              onChange={(e) =>
                setPreference(e.target.value as RoutePreference)
              }
              className="w-full rounded-2xl border border-[#D5D7DA] px-4 py-3"
            >
              <option value="quietest">Quietest</option>
              <option value="balanced">Balanced</option>
              <option value="fastest">Fastest</option>
            </select>
          </div>

          {/* Button */}
          <button
            onClick={handlePlanRoute}
            disabled={loading}
            className="w-full bg-[#1E2939]/85 text-white py-3 rounded-2xl shadow-md"
          >
            {loading ? "Planning route..." : "Plan Route"}
          </button>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
      </section>

      {/* -------------------------
          MAP SECTION (Mapbox)
      ------------------------- */}
      <section className="bg-white/60 rounded-3xl shadow-md p-5 mb-5 border border-white/60">
        <h2 className="text-lg font-semibold mb-3">Map Preview</h2>

        {/* Real map component */}
        <RouteMap
          startLocation={startLocation}
          destination={destination}
        />
      </section>

      {/* -------------------------
          ROUTE RESULT
      ------------------------- */}
      {routeResult && (
        <>
          {/* Summary */}
          <section className="bg-white/75 rounded-3xl shadow-md p-5 mb-5 border border-white/60">
            <h2 className="text-lg font-semibold mb-3">
              Route Summary
            </h2>

            <p><b>From:</b> {startLocation}</p>
            <p><b>To:</b> {destination}</p>
            <p><b>Route:</b> {routeResult.routeName}</p>
            <p><b>Distance:</b> {routeResult.distance}</p>
            <p><b>Time:</b> {routeResult.estimatedTime}</p>
            <p><b>Quiet score:</b> {routeResult.quietScore}/100</p>
            <p><b>Crowd level:</b> {routeResult.crowdLevel}</p>
            <p><b>Quiet spaces:</b> {routeResult.quietSpaces}</p>

            <p className="mt-2 text-[#4A5565]">
              {routeResult.notes}
            </p>
          </section>

          {/* Directions */}
          <section className="bg-white/75 rounded-3xl shadow-md p-5 mb-5 border border-white/60">
            <h2 className="text-lg font-semibold mb-3">
              Directions
            </h2>

            <ol className="list-decimal list-inside space-y-2">
              {routeResult.directions.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </section>
        </>
      )}

      {/* -------------------------
          MIC BUTTON (FLOATING)
      ------------------------- */}
      <div className="fixed bottom-6 right-6">
        <MicButton onClick={() => setIsPopUpOpen(true)} />
      </div>

      {/* Pop-up */}
      {isPopUpOpen && (
        <PopUp onClose={() => setIsPopUpOpen(false)} />
      )}
    </main>
  );
}