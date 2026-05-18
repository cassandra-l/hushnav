import { useState } from "react";
import { useAudio } from "./context/use-audio";
import { Play, Menu, Pause, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "./components/nav-bar";
import { MobileMenu } from "./components/hamburger-menu";

import brownNoise from "./assets/audio/brown_noise.mp3";
import rain from "./assets/audio/rain.mp3";
import waves from "./assets/audio/waves.mp3";
import fireplace from "./assets/audio/fireplace.mp3";
import chirping from "./assets/audio/chirping.mp3";
import stream from "./assets/audio/stream.mp3";

const soundLibrary = [
  {
    id: "brownNoise",
    title: "Deep Earth",
    desc: "Consistent low-frequency sound",
    file: brownNoise,
    duration: "0:07",
    category: "FOCUS",
  },
  {
    id: "rain",
    title: "Downpour",
    desc: "Gentle rainfall",
    file: rain,
    duration: "1:34",
    category: "NATURE",
  },
  {
    id: "waves",
    title: "Tidal Flow",
    desc: "Calming coastal sounds",
    file: waves,
    duration: "0:32",
    category: "NATURE",
  },
  {
    id: "fire",
    title: "Kindle",
    desc: "Crackling wood fire",
    file: fireplace,
    duration: "5:20",
    category: "NATURE",
  },
  {
    id: "chirping",
    title: "Morning Echoes",
    desc: "Natural bird sounds",
    file: chirping,
    duration: "1:42",
    category: "NATURE",
  },
  {
    id: "stream",
    title: "Hidden Creek",
    desc: "Gentle flowing water",
    file: stream,
    duration: "1:34",
    category: "NATURE",
  },
];

export function Soundscape() {
  const { playingId, togglePlay } = useAudio();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Helper to calculate total time from the library
  const calculateTotalTime = () => {
    const totalSeconds = soundLibrary.reduce((acc, track) => {
      const [minutes, seconds] = track.duration.split(":").map(Number);
      return acc + minutes * 60 + seconds;
    }, 0);

    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden font-sans text-[#101828]">
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div
        className="fixed inset-0 -z-10 bg-linear-to-b from-[#ffffff] via-[#d5e8e5] to-[#cfe3df]"
        aria-hidden="true"
      />

      <Navbar
        className="left-1/2 -translate-x-1/2 top-8 w-auto hidden lg:flex"
        showLogo={false}
      />

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-20 flex items-center px-5 py-4">
        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-4 bg-white/60 backdrop-blur-xl rounded-full border border-white/40 text-[#1E2939] shadow-sm"
        >
          <Menu size={20} className="text-[#5A9A8E]" />
        </button>
      </header>

      {/* Title Position */}
      <main className="flex-1 overflow-y-auto pt-6 md:pt-35 pb-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto"
        >
          {/* Header Section */}
          <div className="text-left mb-8 md:mb-12">
            <h1 className="text-5xl md:text-6xl font-medium tracking-tight mb-2 text-[#1E2939]">
              Soundscape
            </h1>
            <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] opacity-60 text-[#5A9A8E]">
              IMMERSIVE AUDIO CURATED FOR YOU
            </p>
          </div>

          <div className="flex justify-between items-center mb-3 px-2">
            <span className="text-[12px] font-mono font-bold uppercase tracking-[0.15em] text-[#1E2939]/50">
              Playlist
            </span>
            <div className="flex items-center gap-2 text-[#1E2939]/50">
              <Clock size={12} strokeWidth={2.5} />{" "}
              <span className="font-mono text-[12px] font-bold uppercase tracking-[0.15em]">
                Total {calculateTotalTime()}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {soundLibrary.map((sound, index) => {
              const isPlaying = playingId === sound.id;
              const isHovered = hoveredId === sound.id;

              return (
                <div
                  key={sound.id}
                  onMouseEnter={() => setHoveredId(sound.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => togglePlay(sound.id, sound.file)}
                  className={`group flex items-center px-4 md:px-8 py-4 rounded-2xl transition-all duration-300 cursor-pointer border backdrop-blur-md ${
                    isPlaying
                      ? "bg-white shadow-md border-white/80 backdrop-blur-3xl" // Solid white when active
                      : isHovered
                        ? "bg-white/60 border-white/80 shadow-sm backdrop-blur-3xl" // Brighter on hover
                        : "bg-white/40 border-white/50 backdrop-blur-3xl shadow-sm" // Standard
                  }`}
                >
                  {/* Action Area */}
                  <div className="w-8 md:w-10 text-sm font-medium">
                    <AnimatePresence mode="wait">
                      {isHovered || isPlaying ? (
                        <motion.div
                          key={
                            isPlaying && isHovered
                              ? "pause"
                              : isPlaying
                                ? "bars"
                                : "play"
                          }
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                        >
                          {isHovered && isPlaying ? (
                            <Pause
                              size={16}
                              fill="currentColor"
                              className="text-[#5A9A8E]"
                            />
                          ) : isPlaying ? (
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
                            <Play size={16} fill="currentColor" />
                          )}
                        </motion.div>
                      ) : (
                        <motion.span
                          key="number"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.4 }}
                          className="text-[#134E48]"
                        >
                          {index + 1}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Description */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-bold text-[15px] md:text-[15px] transition-colors duration-300 truncate ${isPlaying ? "text-[#5A9A8E]" : "text-[#1E2939]"}`}
                    >
                      {sound.title}
                    </h3>
                    <p className="text-[11px] md:text-[14px] opacity-60 text-[#1E2939] truncate">
                      {sound.desc}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-6">
                    <span className="px-3 py-1 bg-black/5 rounded-full text-[9px] md:text-[10px] border border-[#141414]/10 font-bold tracking-widest opacity-60 uppercase text-[#141414]">
                      {sound.category}
                    </span>
                    <div className="hidden md:block opacity-40 font-mono text-[12px] w-8 text-right text-[#1E2939]">
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
