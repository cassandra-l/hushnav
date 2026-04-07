import { useState } from "react";
import { MicButton } from "./components/mic-button";
import { PopUp } from "./components/pop-up";

export function Map() {
  // Pop-up state
  const [isPopUpOpen, setIsPopUpOpen] = useState(false);

  return (
    <main>
      <h1>Map Page</h1>
      <MicButton onClick={() => setIsPopUpOpen(true)} />
      {isPopUpOpen && <PopUp onClose={() => setIsPopUpOpen(false)} />}
    </main>
  );
}
