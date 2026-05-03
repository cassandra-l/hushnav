interface Props {
  // Function to trigger when the button is clicked
  onClick: () => void;
  // Indicates if the microphone is currently active/monitoring
  isActive: boolean;
}

export function MicButton({ onClick, isActive }: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg cursor-pointer ${
        isActive
          ? "bg-white border border-[#D1D5DC]/90"
          : "bg-[#7DB0A6]/80 border border-white/60"
      }`}
    >
      {isActive ? (
        /* Show 'X' Icon when microphone is active */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4A5565"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      ) : (
        /* The Microphone Icon */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 19v3" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <rect x="9" y="2" width="6" height="13" rx="3" />
        </svg>
      )}
    </button>
  );
}
