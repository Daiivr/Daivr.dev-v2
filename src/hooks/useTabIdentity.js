import { useEffect } from "react";
import { useCabinetSignal } from "../lib/cabinetSignals";

// Con sesion de Discord la pestaña lleva la cara y el nombre del visitante: el
// titulo pasa a "<nombre> | Daivr.dev" y el favicon es su avatar recortado en
// circulo con un aro de fosforo. Sin sesion vuelve lo que trae index.html
// (cerrar sesion recarga la pagina, pero se restaura igual por si acaso).
const ICON_SIZE = 64;
const RING_COLOR = "#3fff97";

let defaults = null;

function readDefaults() {
  if (!defaults) {
    defaults = {
      title: document.title,
      icons: [...document.querySelectorAll('link[rel~="icon"]')].map((link) => [link, link.getAttribute("href")])
    };
  }
  return defaults;
}

// Dibuja el avatar en un canvas para recortarlo. El CDN de Discord sirve CORS;
// si una imagen no lo trae, el canvas queda contaminado y se usa la URL tal cual.
function loadAvatarIcon(url) {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = ICON_SIZE;
        canvas.height = ICON_SIZE;
        const context = canvas.getContext("2d");
        const center = ICON_SIZE / 2;
        context.save();
        context.beginPath();
        context.arc(center, center, center - 3, 0, Math.PI * 2);
        context.clip();
        context.drawImage(image, 0, 0, ICON_SIZE, ICON_SIZE);
        context.restore();
        context.beginPath();
        context.arc(center, center, center - 2.5, 0, Math.PI * 2);
        context.lineWidth = 4;
        context.strokeStyle = RING_COLOR;
        context.stroke();
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(url);
      }
    };
    image.onerror = () => resolve(url);
    image.src = url;
  });
}

function setIcons(href) {
  readDefaults().icons.forEach(([link, original]) => {
    link.setAttribute("href", href || original);
  });
}

export function useTabIdentity() {
  const user = useCabinetSignal("player")?.user || null;
  const name = String(user?.username || "").trim();
  const avatarUrl = user?.avatarUrl || "";

  useEffect(() => {
    const { title } = readDefaults();
    const siteName = title.split(" | ").pop();
    document.title = name ? `${name} | ${siteName}` : title;
  }, [name]);

  useEffect(() => {
    if (!avatarUrl) {
      setIcons(null);
      return undefined;
    }
    let cancelled = false;
    loadAvatarIcon(avatarUrl).then((href) => {
      if (!cancelled) setIcons(href);
    });
    return () => {
      cancelled = true;
    };
  }, [avatarUrl]);
}
