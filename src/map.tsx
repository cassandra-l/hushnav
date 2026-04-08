import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MicButton } from "./components/mic-button";
import { PopUp } from "./components/pop-up";

type RoutePreference = "quietest" | "balanced" | "fastest";

type RouteResult = {
  routeName: string;
  distance: string;
  estimatedTime: string;
  quietScore: number;
  notes: string;
};

export function Map() {
  const navigate = useNavigate();

  const [isPopUpOpen, setIsPopUpOpen] = useState(false);
  const [startLocation, setStartLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [preference, setPreference] = useState<RoutePreference>("quietest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);

  const handlePlanRoute = async () => {
    setError("");

    if (!startLocation.trim() || !destination.trim()) {
      setError("Please enter both a start location and destination.");
      return;
    }

    setLoading(true);

    try {
      // Temporary mock response until backend is connected
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockRoute: RouteResult = {
        routeName:
          preference === "quietest"
            ? "Quietest Route"
            : preference === "balanced"
            ? "Balanced Route"
            : "Fastest Route",
        distance:
          preference === "fastest"
            ? "1.4 km"
            : preference === "balanced"
            ? "1.6 km"
            : "1.9 km",
        estimatedTime:
          preference === "fastest"
            ? "18 mins"
            : preference === "balanced"
            ? "21 mins"
            : "25 mins",
        quietScore:
          preference === "quietest"
            ? 91
            : preference === "balanced"
            ? 78
            : 60,
        notes:
          preference === "quietest"
            ? "This route avoids high foot traffic streets and passes quieter areas."
            : preference === "balanced"
            ? "This route balances lower noise with a reasonable travel time."
            : "This route is quicker, but may include busier streets.",
      };

      setRouteResult(mockRoute);
    } catch {
      setError("Something went wrong while planning your route.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-6 max-w-md mx-auto">
      <button
        onClick={() => navigate("/")}
        className="mb-4 text-sm text-[#1E2939] font-medium"
      >
        ← Back
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-[#1E2939]">
          Plan Your Quiet Route
        </h1>
        <p className="text-[#6A7282] mt-1">
          Find a calmer path through the Melbourne CBD.
        </p>
      </div>

      <section className="bg-white/70 rounded-3xl shadow-md p-5 mb-5 border border-white/60">
        <div className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="start"
              className="block text-sm font-medium text-[#1E2939] mb-2"
            >
              Start location
            </label>
            <input
              id="start"
              type="text"
              value={startLocation}
              onChange={(e) => setStartLocation(e.target.value)}
              placeholder="e.g. Flinders Street Station"
              className="w-full rounded-2xl border border-[#D5D7DA] px-4 py-3 bg-white text-[#1E2939] outline-none"
            />
          </div>

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
          </div>

          <div>
            <label
              htmlFor="preference"
              className="block text-sm font-medium text-[#1E2939] mb-2"
            >
              Route preference
            </label>
            <select
              id="preference"
              value={preference}
              onChange={(e) =>
                setPreference(e.target.value as RoutePreference)
              }
              className="w-full rounded-2xl border border-[#D5D7DA] px-4 py-3 bg-white text-[#1E2939] outline-none"
            >
              <option value="quietest">Quietest</option>
              <option value="balanced">Balanced</option>
              <option value="fastest">Fastest</option>
            </select>
          </div>

          <button
            onClick={handlePlanRoute}
            disabled={loading}
            className="w-full bg-[#1E2939]/85 text-white py-3 rounded-2xl shadow-md font-medium disabled:opacity-70"
          >
            {loading ? "Planning route..." : "Plan Route"}
          </button>

          {error && (
            <p className="text-sm text-red-600 font-medium">{error}</p>
          )}
        </div>
      </section>

      <section className="bg-white/60 rounded-3xl shadow-md p-5 mb-5 border border-white/60">
        <h2 className="text-lg font-semibold text-[#1E2939] mb-3">Map Preview</h2>
        <div className="h-64 rounded-2xl bg-[#DDEAE7] border border-[#C7D8D3] flex items-center justify-center text-center px-6 text-[#6A7282]">
          Map will appear here once the route API or map library is connected.
        </div>
      </section>

      {routeResult && (
        <section className="bg-white/75 rounded-3xl shadow-md p-5 mb-5 border border-white/60">
          <h2 className="text-lg font-semibold text-[#1E2939] mb-3">
            Route Summary
          </h2>

          <div className="flex flex-col gap-2 text-[#1E2939]">
            <p>
              <span className="font-medium">Route:</span> {routeResult.routeName}
            </p>
            <p>
              <span className="font-medium">Distance:</span> {routeResult.distance}
            </p>
            <p>
              <span className="font-medium">Estimated time:</span>{" "}
              {routeResult.estimatedTime}
            </p>
            <p>
              <span className="font-medium">Quiet score:</span>{" "}
              {routeResult.quietScore}/100
            </p>
            <p className="text-[#4A5565] mt-2">{routeResult.notes}</p>
          </div>
        </section>
      )}

      <div className="fixed bottom-6 right-6">
        <MicButton onClick={() => setIsPopUpOpen(true)} />
      </div>

      {isPopUpOpen && <PopUp onClose={() => setIsPopUpOpen(false)} />}
    </main>
  );
}