import { useState } from "react";
import { useAudio } from "./context/use-audio";
import { Play, Pause, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { Navbar } from "./components/nav-bar";
import { MobileMenu } from "./components/hamburger-menu";

const soundLibrary = [
  {
    id: "brownNoise",
    title: "Deep Earth",
    desc: "Consistent low-frequency sound",
    file: "/audio/brown_noise.mp3",
    duration: "3:45",
    category: "FOCUS",
  },
  {
    id: "rain",
    title: "Downpour",
    desc: "Gentle rainfall",
    file: "/audio/rain.mp3",
    duration: "4:12",
    category: "NATURE",
  },
  {
    id: "waves",
    title: "Tidal Flow",
    desc: "Calming coastal sounds",
    file: "/audio/waves.mp3",
    duration: "2:58",
    category: "NATURE",
  },
  {
    id: "fire",
    title: "Kindle",
    desc: "Crackling wood fire",
    file: "/audio/fireplace.mp3",
    duration: "5:20",
    category: "NATURE",
  },
  {
    id: "chirping",
    title: "Morning Echoes",
    desc: "Natural bird sounds",
    file: "/audio/chirping.mp3",
    duration: "3:15",
    category: "NATURE",
  },
  {
    id: "stream",
    title: "Hidden Creek",
    desc: "Gentle flowing water",
    file: "/audio/stream.mp3",
    duration: "4:00",
    category: "NATURE",
  },
];

export function Soundscape() {
  const { playingId, togglePlay } = useAudio();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-dvh overflow-hidden font-sans text-[#101828]">
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div className="fixed inset-0 -z-10 bg-[#EAF5F2]" aria-hidden="true" />

      <Navbar
        className="left-1/2 -translate-x-1/2 top-8 w-auto hidden lg:flex"
        showLogo={false}
      />

      <header className="lg:hidden sticky top-0 z-20 flex items-center px-5 py-4">
        <button onClick={() => setIsMenuOpen(true)} className="p-2">
          <Menu size={24} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pt-20 lg:pt-30 pb-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-left mb-12 pl-8">
            <h1 className="text-6xl font-black tracking-tight mb-2">
              Soundscape
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-60">
              Immersive audio to drown out urban noise
            </p>
          </div>

          <div className="space-y-1">
            {soundLibrary.map((sound, index) => {
              const isPlaying = playingId === sound.id;
              const isHovered = hoveredId === sound.id;

              return (
                <div
                  key={sound.id}
                  onMouseEnter={() => setHoveredId(sound.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => togglePlay(sound.id, sound.file)}
                  className={`group flex items-center px-8 py-4 rounded-2xl transition-all cursor-pointer ${
                    isPlaying ? "bg-white shadow-sm" : "hover:bg-white/40"
                  }`}
                >
                  <div className="w-10 text-sm font-medium">
                    {isHovered ? (
                      isPlaying ? (
                        <Pause size={16} fill="currentColor" />
                      ) : (
                        <Play size={16} fill="currentColor" />
                      )
                    ) : isPlaying ? (
                      /* Animated bar animation for the active track */
                      <div className="flex items-end gap-[2px] h-3 w-4">
                        <motion.div
                          animate={{ height: [4, 12, 6] }}
                          transition={{ repeat: Infinity, duration: 0.6 }}
                          className="w-[2px] bg-[#5A9A8E]"
                        />
                        <motion.div
                          animate={{ height: [8, 4, 12] }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                          className="w-[2px] bg-[#5A9A8E]"
                        />
                        <motion.div
                          animate={{ height: [12, 8, 4] }}
                          transition={{ repeat: Infinity, duration: 0.5 }}
                          className="w-[2px] bg-[#5A9A8E]"
                        />
                      </div>
                    ) : (
                      <span className="opacity-40">{index + 1}</span>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3
                      className={`font-bold text-[15px] ${isPlaying ? "text-[#5A9A8E]" : ""}`}
                    >
                      {sound.title}
                    </h3>
                    <p className="text-[12px] opacity-50">{sound.desc}</p>
                  </div>

                  <div className="flex items-center gap-6">
                    <span className="px-3 py-1 bg-black/5 rounded-full text-[9px] border border-[#141414]/10 font-bold tracking-widest opacity-40 uppercase">
                      {sound.category}
                    </span>
                    <div className="opacity-40 font-mono text-[11px] w-8 text-right">
                      {sound.duration}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
