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
import { installModalMotionHold } from "./lib/modalMotion";
import { CabinetRoot } from "./CabinetRoot";

installChunkRecovery();
installModalMotionHold();

// El bloqueo de scroll de los modales de Radix pone en body una variable
// (--removed-body-scroll-bar-size) al abrir y la quita al cerrar. Las variables
// se heredan, asi que cada vez se recalculaba el estilo de toda la pagina (unos
// 4000 nodos, 70-80 ms de tiron justo cuando empieza la animacion del modal).
// Fijada en linea con el mismo valor (0px: el scroll vive en .app-shell y body
// no tiene scrollbar) gana a la regla de Radix y el cambio no baja a los hijos.
// Tiene que ser en linea: la misma variable desde una hoja de estilo, aunque
// valga lo mismo, sigue contando como cambio para el navegador.
document.body.style.setProperty("--removed-body-scroll-bar-size", "0px");

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CabinetRoot />
  </React.StrictMode>
);
