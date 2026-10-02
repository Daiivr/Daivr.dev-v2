import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useCabinetSignal } from "../lib/cabinetSignals";
import {
  checkForUpdate,
  reloadIntoUpdate,
  UPDATE_CHECK_MS,
  UPDATE_FIRST_CHECK_MS,
  UPDATE_MIN_GAP_MS,
  UPDATE_SNOOZE_MS
} from "../lib/buildUpdate";

// Tras pescar, el aviso espera a que se vea la captura antes de recargar.
const AFTER_CATCH_MS = 2600;

/*
  Aviso de version nueva. Hay quien deja la pestaña abierta horas (Buddy
  pescando) y se queda con el codigo de un deploy viejo hasta que recarga.
  - Mira /api/version al rato de entrar, cada 10 minutos con la pestaña a la
    vista, al volver a ella, al recuperar la conexion y cuando el stream del
    libro de visitas se reconecta (un deploy reinicia el servidor y corta
    todas las conexiones: asi se entera casi al momento).
  - Nunca recarga solo. "Later" lo encoge a una pastilla que vuelve a abrirse
    a la media hora; con Buddy pescando ofrece recargar cuando saque la pieza.
  - Al recargar, la puerta cuenta que trae la version nueva y el armario
    vuelve a donde estaba (lib/buildUpdate.js).
  El comando `version` de la consola y `daivr-update-found` (pruebas) lo abren
  tambien.
*/
export function UpdateNotice({ hidden = false, shellRef }) {
  const [update, setUpdate] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [buddyEvent, setBuddyEvent] = useState(() => document.documentElement.dataset.buddyEvent || "");
  const [armed, setArmed] = useState(false);
  const hello = useCabinetSignal("visitHello");
  const checkRef = useRef(null);
  const announcedRef = useRef("");

  useEffect(() => {
    let disposed = false;
    let lastCheck = 0;
    let inFlight = false;

    async function check() {
      if (disposed || inFlight || Date.now() - lastCheck < UPDATE_MIN_GAP_MS) return;
      if (navigator.onLine === false) return;
      inFlight = true;
      lastCheck = Date.now();
      try {
        const found = await checkForUpdate();
        if (!disposed && found) setUpdate((previous) => (previous?.build === found.build ? previous : found));
      } catch {
        // Sin respuesta no se sabe nada: se vuelve a mirar en la siguiente.
      } finally {
        inFlight = false;
      }
    }
    checkRef.current = check;

    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    const onFound = (event) => {
      if (!event.detail?.build) return;
      setUpdate(event.detail);
      setCollapsed(false);
    };
    const onBuddyEvent = (event) => setBuddyEvent(event.detail?.active ? event.detail.name || "" : "");

    const first = window.setTimeout(check, UPDATE_FIRST_CHECK_MS);
    const interval = window.setInterval(onVisible, UPDATE_CHECK_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", check);
    window.addEventListener("daivr-update-found", onFound);
    window.addEventListener("daivr-buddy-event-state", onBuddyEvent);
    return () => {
      disposed = true;
      window.clearTimeout(first);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", check);
      window.removeEventListener("daivr-update-found", onFound);
      window.removeEventListener("daivr-buddy-event-state", onBuddyEvent);
    };
  }, []);

  // Stream reconectado (token nuevo): a lo mejor fue un deploy. Con algo de
  // azar para que no pregunten todas las pestañas en el mismo instante.
  useEffect(() => {
    if (!hello?.token) return undefined;
    const timer = window.setTimeout(() => checkRef.current?.(), 1500 + Math.random() * 6000);
    return () => window.clearTimeout(timer);
  }, [hello?.token]);

  // Buddy lo comenta una vez por version (ScreenBuddy).
  useEffect(() => {
    if (!update || announcedRef.current === update.build) return;
    announcedRef.current = update.build;
    setCollapsed(false);
    window.dispatchEvent(new CustomEvent("daivr-update-available", { detail: update }));
  }, [update]);

  // "Later": pastilla, y a la media hora se vuelve a abrir.
  useEffect(() => {
    if (!collapsed) return undefined;
    const timer = window.setTimeout(() => setCollapsed(false), UPDATE_SNOOZE_MS);
    return () => window.clearTimeout(timer);
  }, [collapsed]);

  const fishing = buddyEvent === "fishing";

  // "Reload after the catch": en cuanto Buddy termina, y se ve la pieza.
  useEffect(() => {
    if (!armed || fishing) return undefined;
    const timer = window.setTimeout(() => reloadIntoUpdate({ shell: shellRef?.current }), AFTER_CATCH_MS);
    return () => window.clearTimeout(timer);
  }, [armed, fishing, shellRef]);

  if (!update || hidden) return null;

  const reload = () => reloadIntoUpdate({ shell: shellRef?.current });
  const title = update.newRelease ? update.version : "A fresh build just shipped";

  if (collapsed) {
    return (
      <aside className="update-notice is-collapsed" aria-label="New version available">
        <button className="update-notice-chip" type="button" onClick={() => setCollapsed(false)}>
          <RefreshCw aria-hidden="true" size={13} strokeWidth={2.6} />
          Update ready
        </button>
      </aside>
    );
  }

  return (
    <aside className="update-notice" aria-labelledby="update-notice-title" aria-live="polite">
      <p className="update-notice-kicker">
        <span className="update-notice-led" aria-hidden="true" />
        New build live
      </p>
      <h2 className="update-notice-title" id="update-notice-title">
        {title}
        {update.newRelease && update.codename ? <span>{update.codename}</span> : null}
      </h2>
      {update.newRelease && update.summary ? <p className="update-notice-summary">{update.summary}</p> : null}
      <p className="update-notice-copy">
        You&apos;re on an older version of the cabinet. Reload to get the latest. Your Buddy, catches and progress are saved.
      </p>
      {fishing && !armed ? (
        <p className="update-notice-hint">Buddy&apos;s line is out. Reload after the catch so you don&apos;t lose it.</p>
      ) : null}
      <div className="update-notice-actions">
        {armed ? (
          <>
            <span className="update-notice-waiting" role="status">
              <RefreshCw aria-hidden="true" size={13} strokeWidth={2.6} />
              {fishing ? "Reloading after the catch…" : "Reloading…"}
            </span>
            <button className="update-notice-button is-quiet" type="button" onClick={() => setArmed(false)}>Cancel</button>
          </>
        ) : (
          <>
            {fishing ? (
              <button className="update-notice-button is-primary" type="button" onClick={() => setArmed(true)}>Reload after the catch</button>
            ) : null}
            <button className={`update-notice-button ${fishing ? "" : "is-primary"}`} type="button" onClick={reload}>
              <RefreshCw aria-hidden="true" size={13} strokeWidth={2.6} />
              Reload now
            </button>
            <button className="update-notice-button is-quiet" type="button" onClick={() => setCollapsed(true)}>Later</button>
          </>
        )}
      </div>
    </aside>
  );
}
