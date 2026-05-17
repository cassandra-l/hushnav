import React from "react";
import ReactDOM from "react-dom/client";
import { Home } from "./home.tsx";
import { Map } from "./map.tsx";
// import { SensoryProfile } from "./sensory-profile/sensory-profile.tsx";
import { SupportPage } from "./support-page.tsx";
import { BreathingExercise } from "./breathing-exercise.tsx";
import FilterScreen from "./filter_page.tsx";
import { AchievementSummaryPage } from "./achievement-summary-page.tsx";
import { AchievementsBadgesPage } from "./achievements-badges-page.tsx";
import { PasswordLockPage } from "./password-lock-page.tsx";
import { AuthGate } from "./components/auth-gate.tsx";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AudioProvider } from "./context/audio-provider.tsx";
import { Soundscape } from "./soundscape.tsx";
import SensoryProfileParent from "./sensory-profile/sensory-profile-parent.tsx";

// import AnimatedLayout from "./animated-layout";

const router = createBrowserRouter([
  {
    // Public lock page.
    path: "/lock",
    element: <PasswordLockPage />,
  },
  {
    // Routes below require auth.
    element: <AuthGate />,
    children: [
      {
        path: "/",
        children: [
          { index: true, element: <Home /> },
          { path: "map", element: <Map /> },
          { path: "support", element: <SupportPage /> },
          { path: "breathing-exercise", element: <BreathingExercise /> },
          { path: "filter_page", element: <FilterScreen /> },
          { path: "sensory-profile", element: <SensoryProfileParent /> },
          { path: "achievements", element: <AchievementSummaryPage /> },
          { path: "achievements/badges", element: <AchievementsBadgesPage /> },
          { path: "badges", element: <AchievementsBadgesPage /> },
          { path: "soundscape", element: <Soundscape /> },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AudioProvider>
      <RouterProvider router={router} />
    </AudioProvider>
  </React.StrictMode>,
);
