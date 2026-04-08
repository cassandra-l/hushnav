export function VolumeBar() {
  return (
    <div className="w-12 h-95 bg-white/80 border border-[#D1D5DC]/90 rounded-xl overflow-hidden shadow-sm relative">
      {/* For Volume Measurement */}
      <div
        className="absolute bottom-0 w-full bg-linear-to-t from-[#8FB9AA] via-[#ECEFB5] to-[#E7C0C0] transition-all duration-300"
        // Test
        style={{ height: "50%" }}
      />
    </div>
  );
}
