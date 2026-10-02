import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { EntrySplash } from "./components/EntrySplash";
import { ChunkBoundary, lazyChunk } from "./lib/chunkRecovery";
import { consumeGateReturn } from "./lib/gateReturn";
import { getSeasonalEvent } from "./lib/seasons";

// La puerta de entrada se pinta desde el chunk de arranque, con solo su propia
// hoja de estilos. Antes vivia dentro de App, asi que no aparecia hasta que se
// descargaban y evaluaban ~1 MB de JS y ~1 MB de CSS del armario entero.
//
// El armario empieza a descargarse en cuanto se evalua este modulo, en
// paralelo con la puerta, y se monta detras de ella dentro del mismo
// .app-shell: la puerta nunca se desmonta al llegar, y el buddy que se lanza
// en paracaidas sigue compartiendo con ella el contexto de apilamiento.
const cabinetModule = import("./App.jsx");
const CabinetApp = lazyChunk(() => cabinetModule);

const EMPTY = [];

function isCabinetPath(pathname) {
  return pathname === "/" || pathname === "/index.html";
}

function CabinetUnavailable() {
  return (
    <p className="cabinet-unavailable" role="alert">
      The cabinet could not load. <button type="button" onClick={() => window.location.reload()}>Try again</button>
    </p>
  );
}

function CabinetShell() {
  const shellRef = useRef(null);
  // Hasta que App mande sus clases, la de temporada ya tinta la puerta.
  const [shellClass, setShellClass] = useState(null);
  const [gateOpen, setGateOpen] = useState(true);
  const [gateReturn, setGateReturn] = useState(null);
  const [gateRevision, setGateRevision] = useState(0);
  const [initialSeason] = useState(getSeasonalEvent);
  // App lo rellena al montarse: estado del buddy para el sprite de la puerta,
  // temporada actual y como lanzar el paracaidas. Hasta entonces la puerta no
  // deja entrar, porque detras aun no hay armario.
  const [bridge, setBridge] = useState(null);

  useEffect(() => {
    const greetRestoredVisitor = (event) => {
      if (!event.persisted) return;
      const context = consumeGateReturn();
      if (!context) return;
      setGateReturn(context);
      setGateRevision((revision) => revision + 1);
      setGateOpen(true);
    };
    window.addEventListener("pageshow", greetRestoredVisitor);
    return () => window.removeEventListener("pageshow", greetRestoredVisitor);
  }, []);

  const enterCabinet = useCallback(() => {
    setGateOpen(false);
    window.setTimeout(() => window.dispatchEvent(new Event("daivr-content-ready")), 50);
    window.requestAnimationFrame(() => document.getElementById("main")?.focus({ preventScroll: true }));
  }, []);

  const launchBuddy = useCallback((start) => bridge?.launchBuddy(start), [bridge]);

  return (
    <div ref={shellRef} className={`app-shell ${shellClass ?? (initialSeason ? `season-${initialSeason}` : "")}`} data-glitch-root>
      {gateOpen ? (
        <EntrySplash
          key={gateRevision}
          cabinetReady={Boolean(bridge)}
          returnContext={gateReturn}
          onBuddyLaunch={launchBuddy}
          onEnter={enterCabinet}
          seasonalEvent={bridge ? bridge.seasonalEvent : initialSeason}
          friendshipLevel={bridge?.friendshipLevel ?? 1}
          inventory={bridge?.inventory ?? EMPTY}
          hiddenGear={bridge?.hiddenGear ?? EMPTY}
          unlockedGear={bridge?.unlockedGear ?? EMPTY}
        />
      ) : null}
      <ChunkBoundary fallback={<CabinetUnavailable />}>
        <Suspense fallback={null}>
          <CabinetApp shellRef={shellRef} gateOpen={gateOpen} onShellClass={setShellClass} onGateBridge={setBridge} />
        </Suspense>
      </ChunkBoundary>
    </div>
  );
}

export function CabinetRoot() {
  // Las paginas de sistema (404/403) no tienen puerta: van directas a App.
  if (!isCabinetPath(window.location.pathname)) {
    return (
      <ChunkBoundary fallback={<CabinetUnavailable />}>
        <Suspense fallback={null}><CabinetApp /></Suspense>
      </ChunkBoundary>
    );
  }
  return <CabinetShell />;
}
