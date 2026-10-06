// Cabeceras de seguridad de server.mjs (produccion). El dev server de Vite no
// las pone: su HMR inyecta scripts en linea que esta politica bloquearia.

// Los juegos del armario viven en iframes del mismo origen y son paginas
// sueltas con scripts en linea, librerias de CDN (esm.sh, cdnjs, el wasm de
// Drive Mad en openprocessing) y Emscripten. Llevan una politica propia mas
// permisiva con los scripts; lo que comparten con la web es que nadie de fuera
// puede enmarcarlas y que no cargan plugins.
export const GAME_PATH_PREFIXES = ["/madrace/", "/cross-road/", "/tower-block/", "/rubiks-cube/", "/space-cadet-pinball/"];

const SITE_POLICY = [
  "default-src 'self'",
  // wasm-unsafe-eval: rapier (fisica del lanyard) compila su wasm desde base64.
  "script-src 'self' 'wasm-unsafe-eval'",
  // unsafe-inline en estilos: el index.html pinta el fondo antes del bundle y
  // varias librerias (three, radix) escriben atributos style.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  // Avatares y decoraciones de Discord, caratulas de Spotify/Steam/SteamGridDB
  // y GIFs del libro de visitas vienen de muchos CDN; las URL de GIF ya se
  // filtran por host en el servidor.
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob: https:",
  // blob: lo usa GLTFLoader para las texturas embebidas del avatar VRM.
  "connect-src 'self' data: blob: https://api.lanyard.rest wss://api.lanyard.rest",
  "frame-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'"
];

const GAME_POLICY = [
  "default-src 'self' https: data: blob:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: https://esm.sh https://cdnjs.cloudflare.com https://deckard.openprocessing.org",
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "media-src 'self' data: blob: https:",
  "connect-src 'self' data: blob: https:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'"
];

const NZP_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval' https://nzp.gay",
  "style-src 'self'",
  "connect-src 'self' https://nzp.gay wss://master.frag-net.com:27950",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'self'"
];

function isSecureRequest(request) {
  return String(request.headers?.["x-forwarded-proto"] || "").split(",")[0].trim() === "https"
    || Boolean(request.socket?.encrypted);
}

export function securityHeaders(request, pathname) {
  const secure = isSecureRequest(request);
  const policy = pathname.startsWith("/nzp/") ? NZP_POLICY : GAME_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ? GAME_POLICY : SITE_POLICY;
  // Solo bajo HTTPS: en http://localhost subiria a https las peticiones del
  // propio servidor local y lo romperia.
  const directives = secure ? [...policy, "upgrade-insecure-requests"] : policy;
  return {
    "Content-Security-Policy": directives.join("; "),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "SAMEORIGIN",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    ...(secure ? { "Strict-Transport-Security": "max-age=15552000" } : {})
  };
}

export function applySecurityHeaders(request, response, pathname) {
  for (const [name, value] of Object.entries(securityHeaders(request, pathname))) response.setHeader(name, value);
}
