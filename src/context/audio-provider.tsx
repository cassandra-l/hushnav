import React, { useState, useRef, useEffect } from "react";
import { AudioContext } from "./audio-context";

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const pauseAudio = () => {
    audioRef.current?.pause();
    setIsPaused(true);
  };

  const resumeAudio = () => {
    audioRef.current?.play();
    setIsPaused(false);
  };

  const togglePlay = (id: string, url: string) => {
    if (playingId === id) {
      if (isPaused) {
        audioRef.current?.play();
        setIsPaused(false);
      } else {
        audioRef.current?.pause();
        setIsPaused(true);
      }
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
    setIsPaused(false);

    sessionStorage.setItem("hushnav-audio-used", "true");
  };

  return (
    <AudioContext.Provider
      value={{
        playingId,
        togglePlay,
        volume,
        setVolume,
        isPaused,
        pauseAudio,
        resumeAudio,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};
