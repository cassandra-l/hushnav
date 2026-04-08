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
  quietSpaces: number;
  crowdLevel: string;
  directions: string[];
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
      setRouteResult(null);
      setError("Please enter both a start location and destination.");
      return;
    }

    if (
      startLocation.trim().toLowerCase() === destination.trim().toLowerCase()
    ) {
      setRouteResult(null);
      setError("Start location and destination cannot be the same.");
      return;
    }

    setLoading(true);

    try {
      // Temporary mock response until backend is connected
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
            "Head north along a quieter side street near Swanston Street.",
            "Continue through a lower foot traffic section toward Little Lonsdale Street.",
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
            "This route balances lower noise levels with a shorter travel time.",
          quietSpaces: 2,
          crowdLevel: "Moderate",
          directions: [
            `Start at ${startLocation}.`,
            "Walk through a moderately busy street with quieter connecting paths.",
            "Continue toward the city centre using a balanced route option.",
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
            "This route is quicker, but may include busier streets and noisier sections.",
          quietSpaces: 1,
          crowdLevel: "High",
          directions: [
            `Start at ${startLocation}.`,
            "Take the most direct path through the main pedestrian corridor.",
            "Continue straight through a busier section of the CBD.",
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
        <h2 className="text-lg font-semibold text-[#1E2939] mb-3">
          Map Preview
        </h2>
        <div className="h-72 rounded-2xl bg-[#DDEAE7] border border-[#C7D8D3] flex items-center justify-center text-center px-6 text-[#6A7282]">
          Map will appear here once the route API or map library is connected.
        </div>
      </section>

      {routeResult && (
        <>
          <section className="bg-white/75 rounded-3xl shadow-md p-5 mb-5 border border-white/60">
            <h2 className="text-lg font-semibold text-[#1E2939] mb-3">
              Route Summary
            </h2>

            <div className="flex flex-col gap-2 text-[#1E2939]">
              <p>
                <span className="font-medium">From:</span> {startLocation}
              </p>
              <p>
                <span className="font-medium">To:</span> {destination}
              </p>
              <p>
                <span className="font-medium">Route:</span>{" "}
                {routeResult.routeName}
              </p>
              <p>
                <span className="font-medium">Preference:</span> {preference}
              </p>
              <p>
                <span className="font-medium">Distance:</span>{" "}
                {routeResult.distance}
              </p>
              <p>
                <span className="font-medium">Estimated time:</span>{" "}
                {routeResult.estimatedTime}
              </p>
              <p>
                <span className="font-medium">Quiet score:</span>{" "}
                {routeResult.quietScore}/100
              </p>
              <p>
                <span className="font-medium">Crowd level:</span>{" "}
                {routeResult.crowdLevel}
              </p>
              <p>
                <span className="font-medium">Quiet spaces nearby:</span>{" "}
                {routeResult.quietSpaces}
              </p>
              <p className="text-[#4A5565] mt-2">{routeResult.notes}</p>
            </div>
          </section>

          <section className="bg-white/75 rounded-3xl shadow-md p-5 mb-5 border border-white/60">
            <h2 className="text-lg font-semibold text-[#1E2939] mb-3">
              Directions
            </h2>

            <ol className="list-decimal list-inside text-[#1E2939] space-y-2">
              {routeResult.directions.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </section>
        </>
      )}

      <div className="fixed bottom-6 right-6">
        <MicButton onClick={() => setIsPopUpOpen(true)} />
      </div>

      {isPopUpOpen && <PopUp onClose={() => setIsPopUpOpen(false)} />}
    </main>
  );
}