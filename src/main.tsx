import React from "react";
import ReactDOM from "react-dom/client";
import { Home } from "./home.tsx";
import { Map } from "./map.tsx";
import { SupportPage } from "./support-page.tsx";
import { BreathingExercise } from "./breathing-exercise.tsx";
import FilterScreen from "./filter_page.tsx";
import { AchievementSummaryPage } from "./achievement-summary-page.tsx";
import { AchievementsBadgesPage } from "./achievements-badges-page.tsx";
import { PasswordLockPage } from "./password-lock-page.tsx";
import { AuthGate } from "./components/auth-gate.tsx";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
// import AnimatedLayout from "./animated-layout";

const router = createBrowserRouter([
  {
    // public lock page.
    path: "/lock",
    element: <PasswordLockPage />,
  },
  {
    // routes below require auth.
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
          { path: "achievements", element: <AchievementSummaryPage /> },
          { path: "achievements/badges", element: <AchievementsBadgesPage /> },
          { path: "badges", element: <AchievementsBadgesPage /> },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
