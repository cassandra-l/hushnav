interface Props {
  onClose: () => void;
}

export function PopUp(props: Props) {
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-3xl"></div>

      <div className="z-10 flex flex-col gap-1 bg-white/70 border border-white/80 w-[90%] rounded-3xl p-4 backdrop-blur-3xl">
        {/* Microphone Icon and Cross Button Container */}
        <div className="flex justify-between pl-3 pr-3 pt-3">
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
          <button onClick={props.onClose}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4A5565"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              className="lucide lucide-x-icon lucide-x"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div>
          {/* Title and SubText */}
          <div className="p-3">
            <h1 className="font-medium text-[24px]">Noise Monitor</h1>
            <p className="text-[#4A5565]">
              A tool to measure the real time noise level in your surroundings.
              <br />
              Please allow microphone access.
            </p>
          </div>

          <div className="flex justify-center">
            <button className="bg-[#7DB0A6] text-white rounded-full w-[95%] py-3">
              Allow Microphone
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
