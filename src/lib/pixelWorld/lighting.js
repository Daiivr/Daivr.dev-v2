import { Buf, bayer, makeCanvas } from "./core.js";

// Luz del mundo segun la hora de verdad (altura del sol de FooterSky, de -1 a
// 1) y el tiempo: un tinte que multiplica toda la escena, algo de
// desaturacion con mal tiempo, y charcos de luz escalonados (farolas,
// hoguera) que se suman encima.
const WHITE = [1, 1, 1];
const DUSK = [0.94, 0.68, 0.52];
const DAWN = [0.92, 0.74, 0.7];
const NIGHT = [0.27, 0.33, 0.6];
const COVER = {
  cloudy: { mul: [0.9, 0.92, 0.96], desat: 0.12 },
  fog: { mul: [0.9, 0.93, 0.97], desat: 0.26 },
  rain: { mul: [0.66, 0.72, 0.84], desat: 0.3 },
  storm: { mul: [0.58, 0.64, 0.78], desat: 0.36 },
  snow: { mul: [0.95, 0.97, 1.02], desat: 0.1 }
};

const lerp3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function lightingFor({ altitude = 1, phase = "day", cover = "fair" }) {
  const golden = phase === "dawn" ? DAWN : DUSK;
  let tint;
  if (altitude >= 0.3) tint = WHITE;
  else if (altitude >= 0.05) tint = lerp3(golden, WHITE, (altitude - 0.05) / 0.25);
  else if (altitude >= -0.2) tint = lerp3(NIGHT, golden, (altitude + 0.2) / 0.25);
  else tint = NIGHT;
  let desat = altitude < 0.3 && altitude > -0.2 ? 0.08 : 0;
  const weather = COVER[cover];
  if (weather) { tint = tint.map((v, i) => v * weather.mul[i]); desat = Math.max(desat, weather.desat); }
  // Cuanta noche hay (0 de dia, 1 de noche cerrada): escala farolas y charcos.
  const dark = clamp01((0.3 - altitude) / 0.5);
  const wet = cover === "rain" || cover === "storm" || cover === "fog";
  return {
    tint,
    desat,
    dark,
    lamps: Math.max(clamp01((0.14 - altitude) / 0.22), wet ? 0.75 : 0),
    fireflies: clamp01((0.1 - altitude) / 0.3) * (wet ? 0.3 : 1),
    plain: tint.every((v) => v > 0.995) && desat === 0
  };
}

// La luz se aplica con composicion de canvas (va por la GPU) en vez de pixel a
// pixel: un mapa de luz con el tinte de fondo y los charcos de luz sumados
// encima, que multiplica la escena. Cada charco es un sprite escalonado (cinco
// anillos con tramado) guardado por radio y color. El mapa se hace una vez por
// fotograma (map) y se aplica a cada capa del mundo (apply): el fondo y, por
// encima de las farolas y la hoguera, la de Buddy.
export function createLightRig(W, H) {
  const [mapC, mapG] = makeCanvas(W, H);
  const [outC, outG] = makeCanvas(W, H);
  const pools = new Map();
  function pool(r, c) {
    const key = r + "|" + c.join(",");
    let img = pools.get(key);
    if (img) return img;
    const ry = Math.ceil(r / 1.1), b = new Buf(r * 2 + 1, ry * 2 + 1);
    for (let y = -ry; y <= ry; y++) for (let x = -r; x <= r; x++) {
      const d = Math.sqrt(x * x + (y * 1.1) ** 2);
      if (d >= r) continue;
      let f = 1 - d / r; f = f * Math.sqrt(f);
      const q = Math.floor(f * 5 + bayer(x + r, y + ry)) / 5;
      if (q <= 0) continue;
      b.set(x + r, y + ry, "#" + c.map((v) => Math.round(Math.min(1, v * q) * 255).toString(16).padStart(2, "0")).join(""));
    }
    img = { c: b.canvas(), r, ry };
    pools.set(key, img);
    return img;
  }
  const hex = (tint) => "#" + tint.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0")).join("");
  function map(tint, lights) {
    mapG.globalCompositeOperation = "source-over";
    mapG.globalAlpha = 1;
    mapG.fillStyle = hex(tint);
    mapG.fillRect(0, 0, W, H);
    mapG.globalCompositeOperation = "lighter";
    for (const L of lights) {
      const p = pool(Math.max(2, Math.round(L.r)), L.c);
      mapG.globalAlpha = Math.min(1, L.s);
      mapG.drawImage(p.c, Math.round(L.x) - p.r, Math.round(L.y) - p.ry);
    }
    mapG.globalAlpha = 1;
    mapG.globalCompositeOperation = "source-over";
  }
  // Devuelve un lienzo con la capa ya iluminada (lo transparente sigue igual).
  // Se dibuja antes de iluminar la siguiente: el lienzo de salida es el mismo.
  function apply(scene, desat) {
    outG.globalCompositeOperation = "copy";
    outG.drawImage(scene, 0, 0);
    if (desat > 0) {
      outG.globalCompositeOperation = "saturation";
      outG.globalAlpha = Math.min(1, desat);
      outG.fillStyle = "#808080";
      outG.fillRect(0, 0, W, H);
      outG.globalAlpha = 1;
    }
    outG.globalCompositeOperation = "multiply";
    outG.drawImage(mapC, 0, 0);
    // Lo que no era escena (el cielo) vuelve a ser transparente.
    outG.globalCompositeOperation = "destination-in";
    outG.drawImage(scene, 0, 0);
    outG.globalCompositeOperation = "source-over";
    return outC;
  }
  return { map, apply };
}
