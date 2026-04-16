import { X } from "lucide-react";

type PopUpProps = {
  onClose: () => void;
  onAllow: () => void | Promise<void>;
};

export function PopUp({ onClose, onAllow }: PopUpProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-md px-7">
      <div className="relative w-full max-w-md rounded-3xl bg-white/70 border border-white/80 p-6 shadow-2xl">
        {/* Microphone Icon and Cross Button Container */}
        <div className="flex justify-between mb-3">
          {/* Microphone Icon */}
          <div className="flex justify-center items-center border border-white/60 bg-[#7DB0A6]/80 w-12 h-12 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              className="lucide lucide-mic-icon lucide-mic"
            >
              <path d="M12 19v3" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <rect x="9" y="2" width="6" height="13" rx="3" />
            </svg>
          </div>

          {/* Cross Button */}
          <button
            type="button"
            onClick={onClose}
            className="right-4 top-4 text-[#4A5565] hover:text-[#1E2939]"
            aria-label="Close popup"
          >
            <X size={22} />
          </button>
        </div>
        {/* Title and sub-text */}
        <div className="">
          <h2 className="text-[24px] font-medium text-[#1E2939]">
            Noise Monitor
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#4A5565]">
            A tool to measure the real time noise level in your surroundings.
            <br />
            Please allow microphone access.
          </p>
        </div>

        {/* Allow Microphone */}
        <button
          type="button"
          onClick={onAllow}
          className="mt-6 w-full rounded-full bg-[#7DB0A6] px-4 py-3 text-md font-medium text-white shadow-lg transition hover:opacity-95"
        >
          Allow Microphone
        </button>
      </div>
    </div>
  );
}
