// Rebote desde una pagina de sistema (404 / 403).
//
// Cuando alguien aterriza en una ruta muerta y vuelve a la puerta, repetirle el
// "oh — hey, didn't hear you walk up" es raro: acaba de estar aqui y acaba de
// chocarse con algo. La pagina de sistema deja una nota al montarse y el splash
// la lee una sola vez para saludar en consecuencia.
//
// Va en sessionStorage porque es memoria de una visita, no del navegador: en
// una pestana nueva el visitante no viene de ningun sitio.

const GATE_RETURN_KEY = "daivr.gateReturn.v1";

// Pasado este margen la nota ya no describe "de donde vengo", solo algo que
// paso en algun momento de la sesion, asi que se ignora.
const GATE_RETURN_TTL_MS = 10 * 60 * 1000;

// La ruta se pinta dentro de la burbuja del saludo. React escapa el texto, pero
// una ruta larguisima rompe la caja, asi que se recorta a algo pronunciable.
const MAX_PATH = 28;

function trimPath(pathname) {
  if (typeof pathname !== "string" || !pathname) return "/unknown";
  const clean = pathname.split(/[?#]/)[0] || "/unknown";
  return clean.length > MAX_PATH ? `${clean.slice(0, MAX_PATH - 1)}…` : clean;
}

export function recordGateReturn(variant, pathname) {
  try {
    window.sessionStorage.setItem(GATE_RETURN_KEY, JSON.stringify({
      variant: variant === "denied" ? "denied" : "missing",
      path: trimPath(pathname),
      at: Date.now()
    }));
  } catch {
    // Modo privado o almacenamiento lleno: el saludo normal sigue funcionando.
  }
}

// Se consume: leer borra la nota, para que el guion especial salga una vez y no
// en cada recarga posterior de la portada.
export function consumeGateReturn() {
  let raw = null;
  try {
    raw = window.sessionStorage.getItem(GATE_RETURN_KEY);
    if (raw) window.sessionStorage.removeItem(GATE_RETURN_KEY);
  } catch {
    return null;
  }

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || (parsed.variant !== "missing" && parsed.variant !== "denied")) return null;
    if (typeof parsed.at !== "number" || Date.now() - parsed.at > GATE_RETURN_TTL_MS) return null;
    return { variant: parsed.variant, path: typeof parsed.path === "string" ? parsed.path : "/unknown" };
  } catch {
    return null;
  }
}
