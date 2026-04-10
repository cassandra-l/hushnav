interface Props {
  volume: number;
}

export function VolumeBar({ volume }: Props) {
  return (
    /* Volume Bar container */
    <div className="w-12 h-80 mb-4 bg-white/80 border border-[#D1D5DC]/90 rounded-xl overflow-hidden shadow-sm relative z-20">
      <div
        className="absolute bottom-0 w-full transition-all duration-150 ease-out"
        style={{
          height: `${Math.max(volume)}%`,
          background: `linear-gradient(to top, #8FB9AA 0%, #ECEFB5 35%, #E7C0C0 70%)`,
          backgroundSize: "100% 400px",
          backgroundPosition: "bottom",
        }}
      />
    </div>
  );
}
