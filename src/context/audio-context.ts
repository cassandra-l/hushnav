import { createContext } from "react";

export interface AudioContextType {
  playingId: string | null;
  togglePlay: (id: string, url: string) => void;
  volume: number;
  setVolume: (val: number) => void;
}

export const AudioContext = createContext<AudioContextType | undefined>(
  undefined,
);
