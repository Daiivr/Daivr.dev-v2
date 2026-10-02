import React from "react";
import { createRoot } from "react-dom/client";
// Solo lo que pinta la puerta de entrada. El resto de hojas de estilo viaja con
// App.jsx (mismo orden de siempre) y llega mientras la puerta ya esta en pantalla.
import "./index.css";
import "./styles/screen-buddy.css";
import "./styles/seasonal-splash.css";
import "./styles/entry-avatar.css";
import "./styles/entry-gate.css";
import { installChunkRecovery } from "./lib/chunkRecovery";
import { CabinetRoot } from "./CabinetRoot";

installChunkRecovery();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CabinetRoot />
  </React.StrictMode>
);
