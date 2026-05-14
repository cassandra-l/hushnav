import { useState } from "react";
import { useAudio } from "./context/audio-context";
import {
  Play,
  Pause,
  CloudRain,
  Waves,
  Flame,
  Menu,
  Bird,
  Droplet,
  AudioLines,
} from "lucide-react";
import { motion } from "framer-motion";
import { Navbar } from "./components/nav-bar";
import { MobileMenu } from "./components/hamburger-menu";

const soundLibrary = [
  {
    id: "brownNoise",
    title: "Brown Noise",
    desc: "Consistent low-frequency sound",
    icon: AudioLines,
    file: "/audio/brown_noise.mp3",
  },
  {
    id: "rain",
    title: "Rain",
    desc: "Gentle rainfall",
    icon: CloudRain,
    file: "/audio/rain.mp3",
  },
  {
    id: "waves",
    title: "Ocean Waves",
    desc: "Calming coastal sounds",
    icon: Waves,
    file: "/audio/waves.mp3",
  },
  {
    id: "fire",
    title: "Fireplace",
    desc: "Crackling wood fire",
    icon: Flame,
    file: "/audio/fireplace.mp3",
  },
  {
    id: "chirping",
    title: "Chirping Birds",
    desc: "Natural bird sounds",
    icon: Bird,
    file: "/audio/chirping.mp3",
  },
  {
    id: "stream",
    title: "Stream",
    desc: "Gentle flowing water",
    icon: Droplet,
    file: "/audio/stream.mp3",
  },
];

export function Soundscape() {
  const { playingId, togglePlay } = useAudio();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex flex-col h-dvh overflow-hidden font-sans">
      {/* Mobile Menu */}
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div className="fixed inset-0 -z-10 bg-[#f2f8f6]" aria-hidden="true" />

      {/* Desktop Navbar */}
      <Navbar
        className="left-1/2 -translate-x-1/2 top-8 w-auto hidden lg:flex"
        showLogo={false}
      />

      {/* Hamburger Menu */}
      <header className="lg:hidden sticky top-0 z-20 flex items-center border-b border-slate-200 bg-white px-5 py-4">
        <button
          className="p-4 bg-white/40 backdrop-blur-md rounded-full border border-white/20 text-[#1E2939] shadow-sm cursor-pointer"
          onClick={() => setIsMenuOpen(true)}
        >
          <Menu size={20} />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-[#1e293b] mr-10">
          Soundscapes
        </h1>
      </header>

      {/* Animated entrance*/}
      <main className="flex-1 overflow-y-auto pt-10 lg:pt-32 pb-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-2xl mx-auto flex flex-col"
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#5A9A8E]">
            Calming Tools
          </span>
          <h1 className="text-5xl font-bold text-[#1E2939] mt-4 mb-2">
            Soundscapes
          </h1>
          <p className="text-gray-400 mb-12">
            Immersive audio environments designed to ground you in the present.
          </p>

          <div className="space-y-4">
            {soundLibrary.map((sound) => {
              const isPlaying = playingId === sound.id;
              return (
                <div
                  key={sound.id}
                  className="flex items-center justify-between p-6 bg-white/60 backdrop-blur-xl rounded-[32px] border border-white/20 shadow-sm transition-all hover:bg-white/80"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-[#f8fafc] rounded-3xl flex items-center justify-center text-[#5A9A8E]">
                      <sound.icon size={28} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-[#1E2939]">
                        {sound.title}
                      </h3>
                      <p className="text-sm text-gray-400">{sound.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => togglePlay(sound.id, sound.file)}
                    className="w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center hover:bg-[#F0F7F4] transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    {isPlaying ? (
                      <Pause
                        size={20}
                        fill="#1E2939"
                        className="text-[#1E2939]"
                      />
                    ) : (
                      <Play
                        size={20}
                        fill="#1E2939"
                        className="text-[#1E2939] ml-1"
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
