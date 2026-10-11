/**
 * Frontend entry point: mounts the React tree into `#root` (see index.html)
 * and loads the global stylesheet (Tailwind + design tokens).
 */
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "@/app/App";
import "@/styles/index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  // StrictMode runs effects twice in development to surface missing cleanups.
  // Hooks like usePdfDocument / useOpenedFiles are written to survive that.
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
