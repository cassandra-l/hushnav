import React from "react";
import ReactDOM from "react-dom/client";
import { Home } from "./home.tsx";
import { Map } from "./map.tsx";
import { SupportPage } from "./support-page.tsx";
import { BreathingExercise } from "./breathing-exercise.tsx";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    children: [
      { index: true, element: <Home /> },
      { path: "map", element: <Map /> },
      { path: "support", element: <SupportPage /> },
      { path: "breathing-exercise", element: <BreathingExercise /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);