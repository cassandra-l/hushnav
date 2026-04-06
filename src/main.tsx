import React from "react";
import ReactDOM from "react-dom/client";
import { Home } from "./home.tsx";
import { About } from "./About";
import ToDoList from "./ToDoList.tsx";
import "./index.css";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

const router = createBrowserRouter([
  {
    path: "/",

    children: [
      { index: true, element: <Home /> },
      { path: "about", element: <About /> },
      { path: "todolist", element: <ToDoList /> },
    ],
  },
]);

Amplify.configure(outputs);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
