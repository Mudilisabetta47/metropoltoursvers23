import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/cockpit-light.css";
import { cleanupStaleAppShellServiceWorkers } from "./lib/pwaCleanup";

void cleanupStaleAppShellServiceWorkers();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
