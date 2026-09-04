import { useClock } from "../hooks/useClock.js";
import { useFps } from "../hooks/useFps.js";

// El contador de fotogramas se remuestrea cada 750ms y el reloj cada 30s.
// Colgados de la raiz obligaban a re-renderizar el arbol entero -- unos 2.000
// nodos -- para repintar dos numeros de la esquina. Viven aqui, en una hoja,
// asi que cada muestra solo toca estas dos etiquetas.
export function CabinetTelemetry() {
  const time = useClock();
  const fps = useFps();

  return (
    <>
      <span className="border border-phosphor/25 px-3 py-2 text-phosphor-soft">FPS <b className="tabular-nums">{fps}</b></span>
      <span className="border border-phosphor/25 px-3 py-2 text-phosphor-soft">{time}</span>
    </>
  );
}
