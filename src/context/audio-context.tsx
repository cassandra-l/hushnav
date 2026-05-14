import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";

interface AudioContextType {
  playingId: string | null;
  togglePlay: (id: string, url: string) => void;
  volume: number;
  setVolume: (val: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync volume changes to the audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = (id: string, url: string) => {
    // If the same ID is clicked, stop it
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    // If a different ID is clicked or nothing is playing
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const newAudio = new Audio(url);
    newAudio.loop = true;
    newAudio.volume = volume;
    newAudio.play().catch((err) => console.error("Audio play blocked:", err));

    audioRef.current = newAudio;
    setPlayingId(id);
  };

  return (
    <AudioContext.Provider value={{ playingId, togglePlay, volume, setVolume }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context)
    throw new Error("useAudio must be used within an AudioProvider");
  return context;
};
