import { useState } from "react";
import { MicButton } from "./components/mic-button";
import { PopUp } from "./components/pop-up";
import { VolumeBar } from "./components/noise-volume-bar";

export function Map() {
  // Pop-up state
  const [isPopUpOpen, setIsPopUpOpen] = useState(false);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Map */}
      <div className="absolute inset-0"></div>
      {/* Features */}
      <div className="absolute bottom-10">
        {/* Volume Bar */}
        <VolumeBar />
        {/* Mic Button with pop-up */}
        <MicButton onClick={() => setIsPopUpOpen(true)} />
        {isPopUpOpen && <PopUp onClose={() => setIsPopUpOpen(false)} />}
      </div>
    </div>
  );
}
