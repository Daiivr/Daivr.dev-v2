import { Component, lazy } from "react";

// Cada despliegue en Render reconstruye dist/ y borra los chunks con hash de la
// version anterior. Una pestana que se abrio antes y carga un modulo perezoso
// despues pediria un archivo que ya no existe. En vez de meter todo en el
// paquete principal (lo que se hizo con la habitacion de Buddy en la v2.51),
// la pagina se recarga una vez para recoger la version nueva.
//
// Una recarga por minuto como mucho: si el chunk sigue sin aparecer despues de
// recargar, el error es otro y se deja ver en vez de entrar en bucle.

const RELOAD_KEY = "daivr.chunkReload.v1";
const RELOAD_WINDOW_MS = 60_000;

export function reloadForNewBuild() {
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_KEY)) || 0;
    if (Date.now() - last < RELOAD_WINDOW_MS) return false;
    window.sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Sin sessionStorage no hay forma de evitar el bucle: mejor no recargar.
    return false;
  }
  window.location.reload();
  return true;
}

// Vite avisa con este evento cuando falla la precarga de un chunk o de su CSS.
export function installChunkRecovery() {
  window.addEventListener("vite:preloadError", (event) => {
    if (reloadForNewBuild()) event.preventDefault();
  });
}

// lazy() que recarga una vez si el chunk ya no existe.
export function lazyChunk(load, pick = (module) => module.default) {
  return lazy(() => load().then(
    (module) => ({ default: pick(module) }),
    (error) => {
      if (reloadForNewBuild()) return new Promise(() => {});
      throw error;
    }
  ));
}

// Si un modulo perezoso no carga ni recargando, se pierde esa pieza y no la
// pagina entera.
export class ChunkBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("[chunk]", error);
  }

  render() {
    return this.state.failed ? this.props.fallback ?? null : this.props.children;
  }
}
