interface Props {
  onClick: () => void;
}

export function MicButton(props: Props) {
  return (
    <button
      onClick={props.onClick}
      className="flex justify-center items-center border border-white/60 bg-[#7DB0A6]/80 w-14.5 h-14.5 rounded-full"
    >
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
    </button>
  );
}
