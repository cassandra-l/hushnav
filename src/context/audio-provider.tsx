import React, { useState, useRef, useEffect } from "react";
import { AudioContext } from "./audio-context";

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = (id: string, url: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

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
