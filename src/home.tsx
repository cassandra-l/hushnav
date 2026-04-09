import { Logo } from "./components/logo";
import { FeatureCard } from "./components/feature-card";
import { useNavigate } from "react-router-dom";

export function Home() {
  const navigate = useNavigate();
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <Logo />
      {/* Title and sub-text */}
      <div className="text-center mt-5 mb-4">
        <h1 className="text-3xl font-medium">Hush Nav</h1>
        <p className="text-[#6A7282]">Find peace in the city</p>
      </div>

      <div className="flex flex-col gap-3 mb-7">
        {/* Find Quiet Route button */}
        <button
          onClick={() => navigate("/map")}
          className="flex gap-2 justify-center items-center w-80 h-14.5 bg-[#1E2939]/80 border border-[#364153]/50 text-white rounded-2xl shadow-md"
        >
          {/* Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="lucide lucide-map-pin-icon lucide-map-pin"
          >
            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Find Quiet Route
        </button>

        {/* Find Calm button */}
        <button
          onClick={() => navigate("/support")}
          className="flex gap-2 justify-center items-center w-80 h-14.5 bg-[#7DB0A6] border border-[#7DB0A6] p-4 rounded-2xl text-white shadow-md"
        >
          {/* Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="lucide lucide-wind-icon lucide-wind"
          >
            <path d="M12.8 19.6A2 2 0 1 0 14 16H2" />
            <path d="M17.5 8a2.5 2.5 0 1 1 2 4H2" />
            <path d="M9.8 4.4A2 2 0 1 1 11 8H2" />
          </svg>
          Find Calm
        </button>
      </div>

      <FeatureCard
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#5A9A8E"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="lucide lucide-shield-icon lucide-shield"
          >
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
          </svg>
        }
        title="Safe Spaces"
        description="Find quiet cafes, libraries, and parks along your route."
      />

      <FeatureCard
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#5A9A8E"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="lucide lucide-mic-icon lucide-mic"
          >
            <path d="M12 19v3" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <rect x="9" y="2" width="6" height="13" rx="3" />
          </svg>
        }
        title="Real Time Noise-Monitor"
        description="Track surroundings sound levels as you navigate through the city."
      />
    </main>
  );
}
