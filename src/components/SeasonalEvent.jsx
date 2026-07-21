import { useEffect, useMemo, useRef, useState } from "react";

const VALID_PREVIEWS = new Set(["halloween", "winter", "birthday", "anniversary", "april-fools"]);

export function getSeasonalEvent(date = new Date()) {
  const preview = new URLSearchParams(window.location.search).get("season");
  if (VALID_PREVIEWS.has(preview)) return preview;

  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (month === 4 && day === 1) return "april-fools";
  if (month === 7 && day >= 1 && day <= 3) return "anniversary";
  if (month === 8 && day >= 23 && day <= 25) return "birthday";
  if ((month === 10 && day >= 25) || (month === 11 && day === 1)) return "halloween";
  if (month === 12 || (month === 1 && day <= 7)) return "winter";
  return null;
}

const EVENT_COPY = {
  halloween: ["CORRUPTED CABINET", "Spectral process detected in memory sector 0x31."],
  winter: ["WINTER SIGNAL", "Aurora online // snow packets accumulating."],
  birthday: ["DAI BIRTHDAY EVENT", "August 24 // party protocol and bonus XP online."],
  anniversary: ["CABINET ANNIVERSARY", "Dai.exe v2 launched July 2 // another year in the arcade."],
  "april-fools": ["CRITICAL UPDATE", "A completely trustworthy operating system upgrade."]
};

const EVENT_ICONS = {
  halloween: "☠",
  winter: "❄",
  birthday: "★",
  anniversary: "02",
  "april-fools": "!"
};

/* Aviso del evento activo, mostrado en el splash de entrada: el visitante se
   entera de que hay temporada ANTES de entrar, no con un toast a posteriori. */
export function SeasonalSplashNotice({ event }) {
  const copy = EVENT_COPY[event];
  if (!copy) return null;
  return (
    <aside className={`splash-season-notice is-${event}`}>
      <span className="splash-season-notice-icon" aria-hidden="true">{EVENT_ICONS[event]}</span>
      <div>
        <span className="splash-season-notice-kicker"><i aria-hidden="true" />event active</span>
        <strong>{copy[0]}</strong>
        <small>{copy[1]}</small>
      </div>
    </aside>
  );
}

const UPDATE_MESSAGES = [
  [0, "Preparing DaiOS 95"],
  [12, "Reticulating splines"],
  [24, "Installing more RAM"],
  [38, "Deleting System32 (just kidding)"],
  [50, "Un-deleting System32 (it got weird)"],
  [62, "Teaching Buddy spreadsheets"],
  [74, "Convincing pixels to align"],
  [86, "Downloading the internet"],
  [93, "Downloading more internet"],
  [97, "Almost done. Probably."]
];

const APRIL_DIALOGS = [
  ["DaiOS error", "Success failed successfully.", "OK"],
  ["System notice", "productivity.exe is not responding.", "Wait forever"],
  ["Helpful tip", "Press OK to continue pressing OK.", "OK"]
];

function makeParticles(count, prefix) {
  return Array.from({ length: count }, (_, index) => (
    <i
      key={`${prefix}-${index}`}
      style={{
        "--delay": `${-((index * 1.73) % 17)}s`,
        "--drift": `${((index * 37) % 180) - 90}px`,
        "--duration": `${7 + (index % 9)}s`,
        "--hue": (index * 47) % 360,
        "--left": `${(index * 41) % 101}%`,
        "--size": `${3 + (index % 6)}px`,
        "--top": `${(index * 29) % 88}%`
      }}
    />
  ));
}

function HalloweenScene() {
  return (
    <div className="seasonal-halloween-scene">
      <span className="seasonal-halloween-lightning" />
      <span className="seasonal-moon" />
      <div className="seasonal-bats"><i /><i /><i /><i /><i /></div>
      <div className="seasonal-fog fog-a" /><div className="seasonal-fog fog-b" />
      <div className="seasonal-corruption-band"><span>0x31</span><i /><i /><i /></div>
    </div>
  );
}

function WinterScene() {
  return (
    <div className="seasonal-winter-scene">
      <div className="seasonal-aurora"><i /><i /><i /></div>
      <div className="seasonal-icicles">{Array.from({ length: 18 }, (_, index) => <i key={index} style={{ "--ice": index }} />)}</div>
    </div>
  );
}

/* Superficies estaticas donde los eventos pueden decorar (nieve, telaranas...).
   Los elementos con interaccion fuerte (consola arrastrable, cartas con
   tilt/flip, botones que se elevan) quedan fuera: nada cuaja sobre cosas
   que se mueven. Compartido por los motores de invierno y halloween. */
const EVENT_SURFACE_SELECTOR = [
  ".now-card",
  ".status-sidecar",
  ".link-console",
  ".project-console",
  ".discord-presence-shell",
  ".game-shelf",
  ".patch-console",
  ".comments-console",
  ".panel",
  ".panel-strong"
].join(",");

const EVENT_EXCLUDE_SELECTOR = [
  ".hero-console",
  ".game-card",
  ".project-card",
  ".project-modal",
  ".attract-mode",
  ".konami-library-backdrop",
  ".madrace-backdrop",
  ".tower-modal-backdrop",
  ".arcade-embed-backdrop",
  "[aria-modal='true']",
  "dialog"
].join(",");

const SNOW = {
  binWidth: 9,          // ancho en px de cada columna del manto
  repose: 2.3,          // desnivel tolerado entre columnas vecinas (talud)
  edgeHold: .35,        // altura que una esquina retiene antes de derramarse
  flowRate: 13,         // fraccion de exceso que fluye por segundo
  clumpMass: 1.2,       // masa acumulada que desprende un bloque por el borde
  maxClumps: 26,
  maxFlakes: 150
};

function fract(value) {
  return value - Math.floor(value);
}

function resizeSnowBins(previous, count) {
  if (!previous?.length) return Array.from({ length: count }, () => 0);
  return Array.from({ length: count }, (_, index) => {
    const source = (index / Math.max(1, count - 1)) * (previous.length - 1);
    const left = Math.floor(source);
    const mix = source - left;
    return previous[left] * (1 - mix) + (previous[Math.min(previous.length - 1, left + 1)] || 0) * mix;
  });
}

/* Los paneles del sitio recortan sus esquinas con clip-path poligonal; el
   borde superior util empieza tras ese corte diagonal. Algunos paneles
   (p.ej. la consola de comentarios) llevan clip-path:none y dibujan la caja
   recortada en su pseudo ::before, asi que hay que mirar ambos. */
function parseTopInsets(clipPath) {
  if (!clipPath?.startsWith("polygon(")) return null;
  const points = clipPath.slice(8, -1).split(/,\s*/);
  const firstX = points[0]?.trim().split(/\s+/)[0] || "0";
  const secondPoint = points[1]?.trim() || "100% 0";
  const left = firstX.endsWith("px") ? Math.max(0, Number.parseFloat(firstX) || 0) : 0;
  const rightMatch = secondPoint.match(/100%\s*-\s*([\d.]+)px/);
  return { left, right: rightMatch ? Number.parseFloat(rightMatch[1]) || 0 : 0 };
}

function readTopInsets(element) {
  return parseTopInsets(window.getComputedStyle(element).clipPath)
    || parseTopInsets(window.getComputedStyle(element, "::before").clipPath)
    || { left: 0, right: 0 };
}

/* Esquinas realmente rectas de un panel: el poligono debe tener un vertice
   exacto en esa esquina. Las esquinas achaflanadas (corte diagonal del
   lenguaje visual del sitio) NO cuentan — una telarana ahi pelea con la
   arquitectura del panel. */
function parseSquareCorners(clipPath) {
  if (!clipPath || clipPath === "none" || !clipPath.startsWith("polygon(")) return null;
  const points = clipPath.slice(8, -1).split(/,\s*/).map((point) => point.trim().split(/\s+/));
  const isZero = (value) => value === "0" || value === "0px" || value === "0%";
  const isFull = (value) => value === "100%";
  const has = (checkX, checkY) => points.some(([px, py]) => px && py && checkX(px) && checkY(py));
  return {
    bl: has(isZero, isFull),
    br: has(isFull, isFull),
    tl: has(isZero, isZero),
    tr: has(isFull, isZero)
  };
}

function readSquareCorners(element) {
  return parseSquareCorners(window.getComputedStyle(element).clipPath)
    || parseSquareCorners(window.getComputedStyle(element, "::before").clipPath)
    || { bl: true, br: true, tl: true, tr: true };
}

/* Un panel esta "anclado al viewport" si el o algun ancestro es fixed/sticky
   (p.ej. la barra lateral lg:sticky o el aviso del evento). Su nieve NO puede
   ir en el lienzo de documento —que el compositor desplaza con el scroll—,
   porque el panel se queda quieto en pantalla; va en el lienzo fijo. */
function isViewportAnchored(element) {
  let node = element;
  while (node && node !== document.body) {
    const position = window.getComputedStyle(node).position;
    if (position === "fixed" || position === "sticky") return true;
    node = node.parentElement;
  }
  return false;
}

function WinterSnowPhysics({ active }) {
  const flakeCanvasRef = useRef(null);
  const pileCanvasRef = useRef(null);

  useEffect(() => {
    const flakeCanvas = flakeCanvasRef.current;
    const pileCanvas = pileCanvasRef.current;
    const shell = document.querySelector(".app-shell");
    if (!active || !flakeCanvas || !pileCanvas || !shell) return undefined;
    const context = flakeCanvas.getContext("2d", { alpha: true });
    const pileContext = pileCanvas.getContext("2d", { alpha: true });
    if (!context || !pileContext) return undefined;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let frame = 0;
    let manualClock = null;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let pileWidth = 1;
    let lastFrame = performance.now();
    let lastScan = -1e9;
    let headerBottom = 68;
    let spawnBudget = 0;
    let frameCost = .016;
    let sweepFlip = false;
    let tracked = [];
    const surfaces = [];
    const piles = new Map();
    const flakes = [];
    const clumps = [];
    const glints = [];
    const gust = { level: 0, target: 0, nextShift: 0 };
    const pointer = { x: -1e4, y: -1e4, vx: 0, vy: 0, speed: 0, stamp: 0 };

    // Lienzo de copos: fijo al viewport (los copos caen respecto a la pantalla).
    function resizeCanvas() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      flakeCanvas.width = Math.round(width * ratio);
      flakeCanvas.height = Math.round(height * ratio);
      flakeCanvas.style.width = `${width}px`;
      flakeCanvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    /* Lienzo de mantos: absoluto dentro de .app-shell y del tamano del
       contenido, para que el compositor lo desplace en bloque con los paneles
       durante el scroll. Asi la nieve queda clavada al panel sin arrastre de
       un frame. Ratio limitado a 1 (los mantos son borrosos) para acotar la
       memoria en paginas muy largas. */
    function resizePileCanvas() {
      const content = document.querySelector(".cabinet-layout");
      const cssWidth = Math.max(1, shell.clientWidth);
      const cssHeight = Math.max(1, content ? content.offsetHeight : shell.scrollHeight);
      const ratio = Math.min(1, 16000 / cssHeight, 16000 / cssWidth);
      const backingWidth = Math.round(cssWidth * ratio);
      const backingHeight = Math.round(cssHeight * ratio);
      pileWidth = cssWidth;
      if (pileCanvas.width === backingWidth && pileCanvas.height === backingHeight) return;
      pileCanvas.width = backingWidth;
      pileCanvas.height = backingHeight;
      pileCanvas.style.width = `${cssWidth}px`;
      pileCanvas.style.height = `${cssHeight}px`;
      pileContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function trackPointer(event) {
      const elapsed = Math.max(8, event.timeStamp - pointer.stamp);
      if (pointer.stamp) {
        pointer.vx = ((event.clientX - pointer.x) / elapsed) * 1000;
        pointer.vy = ((event.clientY - pointer.y) / elapsed) * 1000;
        pointer.speed = Math.hypot(pointer.vx, pointer.vy);
      }
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.stamp = event.timeStamp;
    }

    function shear(bins, index, flow) {
      const diff = bins[index] - bins[index + 1];
      if (diff > SNOW.repose) {
        const moved = (diff - SNOW.repose) * .5 * flow;
        bins[index] -= moved;
        bins[index + 1] += moved;
      } else if (diff < -SNOW.repose) {
        const moved = (-diff - SNOW.repose) * .5 * flow;
        bins[index] += moved;
        bins[index + 1] -= moved;
      }
    }

    function relaxBins(bins, delta) {
      const flow = Math.min(.34, delta * SNOW.flowRate);
      if (sweepFlip) {
        for (let index = 0; index < bins.length - 1; index += 1) shear(bins, index, flow);
      } else {
        for (let index = bins.length - 2; index >= 0; index -= 1) shear(bins, index, flow);
      }
    }

    function seedBins(count, pile) {
      // Ventisqueros iniciales suaves: el evento se ve vivo desde el arranque.
      const bins = Array.from({ length: count }, (_, index) => {
        const wave = .34
          + .24 * Math.sin(index * .31 + pile.seed)
          + .17 * Math.sin(index * .83 + pile.seed * 1.7)
          + .09 * Math.sin(index * 2.09 + pile.seed * 3.1);
        const taper = Math.min(1, Math.min(index, count - 1 - index) / 7);
        return Math.max(0, pile.maxDepth * .62 * wave * taper * taper);
      });
      for (let pass = 0; pass < 16; pass += 1) relaxBins(bins, 1 / 60);
      return bins;
    }

    function resamplePile(pile, edgeWidth, seedFresh = false) {
      const binCount = Math.min(240, Math.max(10, Math.round(edgeWidth / SNOW.binWidth)));
      pile.maxDepth = Math.min(22, Math.max(9, edgeWidth * .05));
      pile.edgeWidth = edgeWidth;
      pile.bins = seedFresh ? seedBins(binCount, pile) : resizeSnowBins(pile.bins, binCount);
    }

    function makePile(element, rect) {
      const insets = readTopInsets(element);
      const pile = {
        anchored: isViewportAnchored(element),
        bins: [],
        edgeWidth: 0,
        insetLeft: insets.left,
        insetRight: insets.right,
        maxDepth: 12,
        outLeft: 0,
        outRight: 0,
        seed: Math.random() * 100
      };
      resamplePile(pile, Math.max(40, rect.width - insets.left - insets.right), true);
      return pile;
    }

    function rescan(now) {
      lastScan = now;
      headerBottom = document.querySelector(".cart-slot")?.getBoundingClientRect().bottom ?? 68;
      tracked = [...document.querySelectorAll(EVENT_SURFACE_SELECTOR)]
        .filter((element) => !element.closest(EVENT_EXCLUDE_SELECTOR));
      for (const [element, pile] of piles) {
        if (!element.isConnected) piles.delete(element);
        else pile.anchored = isViewportAnchored(element); // reevaluar por si cambio el breakpoint
      }
      // El alto del contenido cambia al cargar imagenes o desplegar secciones.
      resizePileCanvas();
    }

    /* Los rects se releen cada frame: los mantos siguen a sus paneles durante
       scroll, hover-lift y elementos sticky sin desincronizarse jamas. */
    function updateSurfaces() {
      surfaces.length = 0;
      const cutoffTop = headerBottom - 30;
      for (const element of tracked) {
        if (!element.isConnected) continue;
        const rect = element.getBoundingClientRect();
        if (rect.width < 90 || rect.top < cutoffTop || rect.top > height - 8 || rect.right < 24 || rect.left > width - 24) continue;
        let pile = piles.get(element);
        if (!pile) {
          pile = makePile(element, rect);
          piles.set(element, pile);
        }
        if (pile.releasing) continue;
        const left = rect.left + pile.insetLeft;
        const right = rect.right - pile.insetRight;
        const edgeWidth = right - left;
        if (edgeWidth < 60) continue;
        if (Math.abs(edgeWidth - pile.edgeWidth) > 14) resamplePile(pile, edgeWidth);
        surfaces.push({ element, pile, top: rect.top, left, right, width: edgeWidth });
      }
      surfaces.sort((a, b) => a.top - b.top);
    }

    function binIndexAt(surface, x) {
      const count = surface.pile.bins.length;
      return Math.min(count - 1, Math.max(0, Math.floor(((x - surface.left) / surface.width) * count)));
    }

    function snowTopAt(surface, x) {
      return surface.top - surface.pile.bins[binIndexAt(surface, x)];
    }

    function deposit(surface, x, amount) {
      const { pile } = surface;
      const count = pile.bins.length;
      const index = binIndexAt(surface, x);
      pile.bins[index] += amount * .58;
      if (index > 0) pile.bins[index - 1] += amount * .21;
      else pile.outLeft += amount * .21;
      if (index < count - 1) pile.bins[index + 1] += amount * .21;
      else pile.outRight += amount * .21;
    }

    function windAt(now, delta) {
      if (now >= gust.nextShift) {
        gust.target = Math.random() < .42
          ? (Math.random() < .5 ? -1 : 1) * (14 + Math.random() * 13)
          : (Math.random() - .5) * 8;
        gust.nextShift = now + 2600 + Math.random() * 7000;
      }
      gust.level += (gust.target - gust.level) * Math.min(1, delta * .9);
      return Math.sin(now / 3900) * 8 + Math.sin(now / 1150) * 3.5 + gust.level;
    }

    function makeFlake(initial, overrides = {}) {
      const far = overrides.far ?? Math.random() < .45;
      const radius = overrides.radius ?? (far ? .7 + Math.random() : 1.5 + Math.random() * 1.9);
      return {
        x: overrides.x ?? Math.random() * width,
        y: overrides.y ?? (initial ? Math.random() * height : -14),
        vx: overrides.vx ?? -6 + Math.random() * 12,
        vy: overrides.vy ?? 16 + radius * 11 + Math.random() * 10,
        radius,
        far,
        ephemeral: overrides.ephemeral ?? false,
        sway: .6 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() - .5) * 1.8,
        opacity: far ? .22 + Math.random() * .3 : .5 + Math.random() * .42
      };
    }

    function spawnPuff(x, y, count) {
      for (let puff = 0; puff < count; puff += 1) {
        if (flakes.length >= SNOW.maxFlakes) return;
        flakes.push(makeFlake(false, {
          x: x + (Math.random() - .5) * 9,
          y,
          vx: (Math.random() - .5) * 64,
          vy: -26 - Math.random() * 42,
          radius: .7 + Math.random() * 1.1,
          far: true,
          ephemeral: true
        }));
      }
    }

    function spawnClump(surface, direction, mass, wind) {
      if (clumps.length >= SNOW.maxClumps) return;
      const bins = surface.pile.bins;
      const edgeHeight = direction < 0 ? bins[0] : bins[bins.length - 1];
      clumps.push({
        x: (direction < 0 ? surface.left : surface.right) + direction * 2,
        y: surface.top - edgeHeight - 1,
        vx: direction * (7 + Math.random() * 20) + wind * .35,
        vy: -4 + Math.random() * 8,
        mass: Math.min(4.2, mass),
        radius: Math.min(5.6, 1.9 + mass * .85),
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - .5) * 5
      });
    }

    /* Al desmontar una superficie (el aviso de invierno), su manto no se
       borra: se trocea siguiendo la masa real de los bins y cada bloque vuelve
       al solver con gravedad. Al marcar el pile como releasing evitamos que
       los bloques vuelvan a aterrizar en el elemento durante el mismo frame en
       que React lo retira del DOM. */
    function releaseSurfaceSnow(event) {
      const element = event.detail?.element;
      const pile = element ? piles.get(element) : null;
      if (!element || !pile || pile.releasing) return;
      const surface = surfaces.find((item) => item.element === element);
      const rect = element.getBoundingClientRect();
      const left = surface?.left ?? rect.left + pile.insetLeft;
      const right = surface?.right ?? rect.right - pile.insetRight;
      const top = surface?.top ?? rect.top;
      const widthAvailable = Math.max(1, right - left);
      const count = pile.bins.length;
      const groupSize = Math.max(3, Math.ceil(count / 13));
      const wind = windAt(performance.now(), 1 / 60);
      pile.releasing = true;

      for (let start = 0; start < count; start += groupSize) {
        if (clumps.length >= SNOW.maxClumps) break;
        const end = Math.min(count, start + groupSize);
        let heightMass = 0;
        let peak = 0;
        for (let index = start; index < end; index += 1) {
          heightMass += pile.bins[index];
          peak = Math.max(peak, pile.bins[index]);
          pile.bins[index] = 0;
        }
        if (heightMass < .35) continue;
        const centerIndex = (start + end - 1) / 2;
        const x = left + ((centerIndex + .5) / count) * widthAvailable;
        const mass = Math.min(5.2, Math.max(.5, heightMass * .2));
        clumps.push({
          x,
          y: top - peak - 1,
          vx: wind * .28 + (Math.random() - .5) * 24,
          vy: 14 + Math.random() * 24,
          mass,
          radius: Math.min(6.4, 1.9 + mass * .82),
          rotation: Math.random() * Math.PI * 2,
          spin: (Math.random() - .5) * 5.5
        });
        spawnPuff(x, top - peak - 2, Math.min(3, Math.ceil(mass)));
      }

      pile.outLeft = 0;
      pile.outRight = 0;
      piles.delete(element);
      const surfaceIndex = surfaces.findIndex((item) => item.element === element);
      if (surfaceIndex >= 0) surfaces.splice(surfaceIndex, 1);
    }

    function shedClumps(surface, wind) {
      const { pile } = surface;
      if (pile.outLeft >= SNOW.clumpMass) {
        spawnClump(surface, -1, pile.outLeft, wind);
        pile.outLeft = 0;
      }
      if (pile.outRight >= SNOW.clumpMass) {
        spawnClump(surface, 1, pile.outRight, wind);
        pile.outRight = 0;
      }
    }

    /* Fisica del manto: talud granular, derrame por esquinas (nada de paredes
       de 90 grados), tope de espesor, arrastre del viento y barrido del cursor. */
    function relaxSurface(surface, wind, delta) {
      const { pile } = surface;
      const bins = pile.bins;
      const count = bins.length;
      relaxBins(bins, delta);

      const flow = Math.min(.4, delta * SNOW.flowRate);
      const excessLeft = bins[0] - SNOW.edgeHold;
      if (excessLeft > 0) {
        const moved = excessLeft * flow * .6;
        bins[0] -= moved;
        pile.outLeft += moved;
      }
      const excessRight = bins[count - 1] - SNOW.edgeHold;
      if (excessRight > 0) {
        const moved = excessRight * flow * .6;
        bins[count - 1] -= moved;
        pile.outRight += moved;
      }

      for (let index = 0; index < count; index += 1) {
        const over = bins[index] - pile.maxDepth;
        if (over > 0) {
          bins[index] = pile.maxDepth;
          if (index > 0) bins[index - 1] += over * .5;
          else pile.outLeft += over * .5;
          if (index < count - 1) bins[index + 1] += over * .5;
          else pile.outRight += over * .5;
        }
      }

      if (Math.abs(wind) > 15) {
        const direction = wind > 0 ? 1 : -1;
        for (let hit = 0; hit < 3; hit += 1) {
          const index = Math.floor(Math.random() * count);
          const target = index + direction;
          if (target < 0 || target >= count || bins[index] < 1.4) continue;
          const moved = Math.min(.1, bins[index] * .03);
          bins[index] -= moved;
          bins[target] += moved;
        }
        // Ventisca: las rachas levantan polvo de nieve de las crestas.
        if (Math.abs(wind) > 19 && Math.random() < .05 && flakes.length < SNOW.maxFlakes) {
          const index = Math.floor(Math.random() * count);
          if (bins[index] > 4.5) {
            bins[index] -= .25;
            flakes.push(makeFlake(false, {
              x: surface.left + (index + .5) * (surface.width / count),
              y: surface.top - bins[index] - 2,
              vx: wind * 1.5,
              vy: -10 - Math.random() * 14,
              radius: .7 + Math.random() * .9,
              far: true,
              ephemeral: true
            }));
          }
        }
      }

      // Pasar el cursor rapido por un manto lo barre y desprende un bloque.
      if (pointer.speed > 260 && pointer.x > surface.left - 8 && pointer.x < surface.right + 8) {
        const localTop = surface.top - pile.maxDepth - 8;
        if (pointer.y > localTop && pointer.y < surface.top + 6) {
          const center = binIndexAt(surface, pointer.x);
          const reach = 2;
          let carved = 0;
          for (let offset = -reach; offset <= reach; offset += 1) {
            const index = center + offset;
            if (index < 0 || index >= count) continue;
            const bite = Math.min(bins[index], (.28 + Math.min(1.1, pointer.speed / 900)) * (1 - Math.abs(offset) / (reach + 1)));
            bins[index] -= bite;
            carved += bite;
          }
          if (carved > .7 && clumps.length < SNOW.maxClumps) {
            clumps.push({
              x: pointer.x,
              y: snowTopAt(surface, pointer.x) - 2,
              vx: pointer.vx * .22,
              vy: Math.min(0, pointer.vy * .18) - 24,
              mass: Math.min(3.4, carved),
              radius: Math.min(5, 1.6 + carved * .8),
              rotation: Math.random() * Math.PI * 2,
              spin: pointer.vx * .01
            });
            spawnPuff(pointer.x, snowTopAt(surface, pointer.x) - 2, 2);
          }
        }
      }
    }

    function updateFlakes(now, delta, wind) {
      const flakeCap = Math.round((width < 700 ? 40 : 96) * (frameCost > .024 ? .55 : frameCost > .019 ? .8 : 1));
      spawnBudget += delta * (width < 700 ? 6.5 : 11);
      while (spawnBudget >= 1) {
        spawnBudget -= 1;
        if (flakes.length < flakeCap) flakes.push(makeFlake(false));
      }

      for (let index = flakes.length - 1; index >= 0; index -= 1) {
        const flake = flakes[index];
        const previousY = flake.y;
        const terminal = (30 + flake.radius * 18) * (flake.far ? .6 : 1);
        flake.vy += (terminal - flake.vy) * Math.min(1, delta * 2.2);
        flake.vx += (wind * (flake.far ? .5 : .9) - flake.vx) * Math.min(1, delta * 1.6);
        flake.x += (flake.vx + Math.sin(now / 640 + flake.phase) * 7 * flake.sway * (flake.far ? .5 : 1)) * delta;
        flake.y += flake.vy * delta;
        flake.rot += flake.spin * delta;

        let landed = false;
        if (flake.vy > 0) {
          for (const surface of surfaces) {
            if (flake.x < surface.left || flake.x > surface.right) continue;
            const snowTop = snowTopAt(surface, flake.x);
            const crossed = previousY <= snowTop + 1 && flake.y + flake.radius >= snowTop;
            const swept = flake.y >= snowTop - 1 && flake.y <= surface.top + 9;
            if (crossed || swept) {
              if (!flake.ephemeral) {
                deposit(surface, flake.x, .7 + flake.radius * .42);
                if (!flake.far && Math.random() < .3) glints.push({ x: flake.x, y: snowTop - 1, life: .35, max: .35, size: 1.6 });
              }
              landed = true;
              break;
            }
          }
        }
        if (landed || flake.y > height + 16 || flake.x < -50 || flake.x > width + 50) flakes.splice(index, 1);
      }
    }

    function updateClumps(delta, wind) {
      for (let index = clumps.length - 1; index >= 0; index -= 1) {
        const clump = clumps[index];
        const previousY = clump.y;
        clump.vy = Math.min(340, clump.vy + 460 * delta);
        clump.vx += (wind * .4 - clump.vx * .6) * delta;
        clump.x += clump.vx * delta;
        clump.y += clump.vy * delta;
        clump.rotation += clump.spin * delta;

        let landed = false;
        if (clump.vy > 0) {
          for (const surface of surfaces) {
            if (surface.pile.releasing) continue;
            if (surface.top < previousY - 2 || clump.x < surface.left || clump.x > surface.right) continue;
            const snowTop = snowTopAt(surface, clump.x);
            if (previousY <= snowTop + 2 && clump.y + clump.radius * .6 >= snowTop) {
              deposit(surface, clump.x, clump.mass * .55);
              deposit(surface, clump.x - 5, clump.mass * .18);
              deposit(surface, clump.x + 5, clump.mass * .18);
              glints.push({ x: clump.x, y: snowTop - 2, life: .5, max: .5, size: 2.4 });
              spawnPuff(clump.x, snowTop - 3, 3);
              landed = true;
              break;
            }
          }
        }
        if (landed || clump.y > height + 40 || clump.x < -60 || clump.x > width + 60) clumps.splice(index, 1);
      }
    }

    // Dibuja el manto sobre el lienzo indicado. Los paneles normales van al
    // lienzo de documento (ox/oy = desplazamiento de scroll) que el compositor
    // mueve con la pagina; los anclados (barra lateral sticky, aviso fixed) van
    // al lienzo fijo (ox/oy = 0) para no separarse del panel al hacer scroll.
    function drawPile(ctx, surface, now, ox, oy) {
      const bins = surface.pile.bins;
      const count = bins.length;
      let maxHeight = 0;
      for (let index = 0; index < count; index += 1) {
        if (bins[index] > maxHeight) maxHeight = bins[index];
      }
      if (maxHeight < .45) return;

      const left = surface.left + ox;
      const right = surface.right + ox;
      const top = surface.top + oy;
      const step = surface.width / (count - 1);
      const baseY = top + 1.6;
      const gradient = ctx.createLinearGradient(0, top - Math.max(10, maxHeight), 0, baseY);
      gradient.addColorStop(0, "rgba(252,254,255,.98)");
      gradient.addColorStop(.62, "rgba(219,244,255,.93)");
      gradient.addColorStop(1, "rgba(128,199,235,.45)");

      ctx.save();
      // Confinar la nieve (y su halo) al ancho util del panel: asi el resplandor
      // no se derrama por la esquina recortada dejando una linea azulada suelta.
      ctx.beginPath();
      ctx.rect(left, top - maxHeight - 14, right - left, maxHeight + 17);
      ctx.clip();
      ctx.shadowColor = "rgba(150,220,255,.5)";
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.moveTo(left, baseY);
      ctx.lineTo(left, top - bins[0]);
      for (let index = 1; index < count - 1; index += 1) {
        const x = left + index * step;
        const y = top - bins[index];
        const nextY = top - bins[index + 1];
        ctx.quadraticCurveTo(x, y, x + step / 2, (y + nextY) / 2);
      }
      ctx.lineTo(right, top - bins[count - 1]);
      ctx.lineTo(right, baseY);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Destellos: la nieve chispea con puntitos que titilan.
      const sparkCount = Math.min(9, Math.max(2, Math.floor(surface.width / 110)));
      ctx.fillStyle = "rgba(255,255,255,.92)";
      for (let spark = 0; spark < sparkCount; spark += 1) {
        const u = fract(Math.sin(surface.pile.seed + spark * 12.9898) * 43758.5453);
        const index = Math.floor(u * count);
        const depth = bins[index];
        if (depth < 2.2) continue;
        const twinkle = Math.sin((now / 300) * (.6 + u) + spark * 2.7);
        if (twinkle < .55) continue;
        ctx.globalAlpha = ((twinkle - .55) / .45) * .85;
        ctx.fillRect(left + (index + .5) * step, top - depth * (.25 + u * .55), 1.4, 1.4);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    function drawClumps() {
      context.fillStyle = "rgba(246,252,255,.94)";
      for (const clump of clumps) {
        context.save();
        context.translate(clump.x, clump.y);
        context.rotate(clump.rotation);
        context.beginPath();
        context.arc(0, 0, clump.radius, 0, Math.PI * 2);
        context.arc(clump.radius * .55, -clump.radius * .3, clump.radius * .7, 0, Math.PI * 2);
        context.arc(-clump.radius * .5, clump.radius * .25, clump.radius * .62, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }
    }

    // Copos lejanos: puntos suaves. Copos cercanos: dendritas de seis brazos
    // con ramitas, girando lentamente mientras caen.
    function drawFlakes() {
      context.fillStyle = "#eefaff";
      context.strokeStyle = "#eefaff";
      for (const flake of flakes) {
        if (flake.far) {
          context.globalAlpha = flake.opacity;
          context.beginPath();
          context.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
          context.fill();
          continue;
        }
        const arm = flake.radius * 2.3;
        context.globalAlpha = flake.opacity * .16;
        context.beginPath();
        context.arc(flake.x, flake.y, arm, 0, Math.PI * 2);
        context.fill();
        context.globalAlpha = flake.opacity;
        context.lineWidth = Math.max(.8, flake.radius * .34);
        context.beginPath();
        for (let armIndex = 0; armIndex < 6; armIndex += 1) {
          const angle = flake.rot + (armIndex * Math.PI) / 3;
          const cosA = Math.cos(angle);
          const sinA = Math.sin(angle);
          context.moveTo(flake.x, flake.y);
          context.lineTo(flake.x + cosA * arm, flake.y + sinA * arm);
          const branchX = flake.x + cosA * arm * .55;
          const branchY = flake.y + sinA * arm * .55;
          const branch = arm * .34;
          context.moveTo(branchX, branchY);
          context.lineTo(branchX + Math.cos(angle + Math.PI / 3.2) * branch, branchY + Math.sin(angle + Math.PI / 3.2) * branch);
          context.moveTo(branchX, branchY);
          context.lineTo(branchX + Math.cos(angle - Math.PI / 3.2) * branch, branchY + Math.sin(angle - Math.PI / 3.2) * branch);
        }
        context.stroke();
        context.beginPath();
        context.arc(flake.x, flake.y, Math.max(.7, flake.radius * .4), 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
    }

    function drawGlints(delta) {
      context.strokeStyle = "#fff";
      context.lineWidth = 1;
      for (let index = glints.length - 1; index >= 0; index -= 1) {
        const glint = glints[index];
        glint.life -= delta;
        if (glint.life <= 0) {
          glints.splice(index, 1);
          continue;
        }
        const fade = glint.life / glint.max;
        const reach = glint.size * (2.4 - fade * 1.4);
        context.globalAlpha = fade * .9;
        context.beginPath();
        context.moveTo(glint.x - reach, glint.y);
        context.lineTo(glint.x + reach, glint.y);
        context.moveTo(glint.x, glint.y - reach);
        context.lineTo(glint.x, glint.y + reach);
        context.stroke();
      }
      context.globalAlpha = 1;
    }

    function tick(now) {
      const rawDelta = (now - lastFrame) / 1000;
      const delta = Math.min(.05, Math.max(.001, rawDelta));
      lastFrame = now;
      if (rawDelta > 0 && rawDelta < .5) frameCost = frameCost * .94 + rawDelta * .06;
      if (now - lastScan >= 700) rescan(now);
      updateSurfaces();
      const wind = reducedMotion ? 0 : windAt(now, delta);

      if (!reducedMotion) {
        updateFlakes(now, delta, wind);
        sweepFlip = !sweepFlip;
        for (const surface of surfaces) {
          relaxSurface(surface, wind, delta);
          shedClumps(surface, wind);
        }
        updateClumps(delta, wind);
        pointer.speed *= Math.max(0, 1 - delta * 6);
      }

      // Mantos de paneles normales: lienzo de documento (el compositor lo
      // desplaza con la pagina). Solo se limpia/repinta la franja visible.
      const shellRect = shell.getBoundingClientRect();
      const ox = shell.scrollLeft - shellRect.left;
      const oy = shell.scrollTop - shellRect.top;
      pileContext.clearRect(0, oy - 60, pileWidth, shell.clientHeight + 120);
      for (const surface of surfaces) {
        if (!surface.pile.anchored) drawPile(pileContext, surface, now, ox, oy);
      }

      // Lienzo fijo al viewport: mantos anclados (sticky/fixed) + copos + bloques.
      context.clearRect(0, 0, width, height);
      for (const surface of surfaces) {
        if (surface.pile.anchored) drawPile(context, surface, now, 0, 0);
      }
      if (!reducedMotion) {
        drawClumps();
        drawFlakes();
        drawGlints(delta);
      }
    }

    function loop(now) {
      tick(now);
      frame = window.requestAnimationFrame(loop);
    }

    resizeCanvas();
    resizePileCanvas();
    rescan(performance.now());
    if (!reducedMotion) {
      const initialCount = width < 700 ? 20 : 44;
      for (let index = 0; index < initialCount; index += 1) flakes.push(makeFlake(true));
    }
    frame = window.requestAnimationFrame(loop);
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("resize", resizePileCanvas);
    window.addEventListener("pointermove", trackPointer, { passive: true });
    window.addEventListener("daivr-snow-release", releaseSurfaceSnow);

    if (import.meta.env.DEV) {
      // Gancho de depuracion: permite avanzar la simulacion sin rAF.
      window.__daivrSnow = {
        step(ms = 16) {
          window.cancelAnimationFrame(frame);
          manualClock = (manualClock ?? lastFrame) + ms;
          tick(manualClock);
          return { flakes: flakes.length, clumps: clumps.length, surfaces: surfaces.length };
        },
        resume() {
          manualClock = null;
          lastFrame = performance.now();
          window.cancelAnimationFrame(frame);
          frame = window.requestAnimationFrame(loop);
        },
        depths() {
          return surfaces.map((surface) => ({
            tag: surface.element.className.split(" ")[0],
            top: Math.round(surface.top),
            left: Math.round(surface.left),
            right: Math.round(surface.right),
            max: Number(Math.max(...surface.pile.bins).toFixed(2)),
            first: Number(surface.pile.bins[0].toFixed(2)),
            last: Number(surface.pile.bins[surface.pile.bins.length - 1].toFixed(2))
          }));
        }
      };
    }

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("resize", resizePileCanvas);
      window.removeEventListener("pointermove", trackPointer);
      window.removeEventListener("daivr-snow-release", releaseSurfaceSnow);
      context.clearRect(0, 0, width, height);
      pileContext.clearRect(0, 0, pileCanvas.width, pileCanvas.height);
      if (import.meta.env.DEV) delete window.__daivrSnow;
    };
  }, [active]);

  return (
    <>
      <canvas className="winter-snow-piles" ref={pileCanvasRef} aria-hidden="true" />
      <canvas className="winter-snow-physics" ref={flakeCanvasRef} aria-hidden="true" />
    </>
  );
}

/* ---- Motor de decorado de Halloween -------------------------------------
   Mismo esquema que la nieve: lienzo de documento para lo pegado a paneles
   (telaranas, aranas, calabazas) y lienzo fijo para lo que vuela respecto a
   la pantalla (murcielagos) y los paneles anclados (sidebar sticky). */

function buildCornerWeb(seed, radius, dirX, dirY) {
  const spokeCount = 5 + Math.floor(fract(seed * 3.17) * 3);
  const spokes = [];
  for (let index = 0; index < spokeCount; index += 1) {
    const t = index / (spokeCount - 1);
    const edge = index === 0 || index === spokeCount - 1;
    const jitter = edge ? 0 : (fract(seed * (7.7 + index * 1.31)) - .5) * .14;
    spokes.push({
      angle: (t * Math.PI) / 2 + jitter,
      length: radius * (.8 + .2 * fract(seed * (2.9 + index * .77)))
    });
  }
  const ringCount = 4 + Math.floor(fract(seed * 9.43) * 2);
  const rings = [];
  for (let ring = 1; ring <= ringCount; ring += 1) {
    rings.push((ring / ringCount) * (.84 + .12 * fract(seed * (4.21 + ring))));
  }
  // Huecos rotos: una telarana perfecta no se la cree nadie.
  const torn = new Set();
  const tornCount = Math.floor(fract(seed * 6.67) * 3);
  for (let gap = 0; gap < tornCount; gap += 1) {
    const ringIndex = Math.floor(fract(seed * (13.7 + gap * 3.3)) * ringCount);
    const segmentIndex = Math.floor(fract(seed * (17.3 + gap * 2.1)) * (spokeCount - 1));
    torn.add(`${ringIndex}:${segmentIndex}`);
  }
  return { alpha: .2 + .12 * fract(seed * 5.51), dirX, dirY, glintSeed: fract(seed * 3.77) * 10, radius, rings, spokes, torn };
}

function makeWebSpider(seed) {
  const baseLen = 34 + fract(seed * 11.31) * 66;
  return {
    ax: 0,
    ay: 0,
    baseLen,
    len: baseLen * .55,
    nextMoveAt: 0,
    phase: fract(seed * 2.37) * Math.PI * 2,
    scaredUntil: 0,
    size: .8 + .5 * fract(seed * 6.91),
    swingAmp: .05 + .08 * fract(seed * 4.73),
    swingW: .8 + .9 * fract(seed * 8.19),
    targetLen: baseLen,
    x: 0,
    y: 0
  };
}

function HalloweenDecorPhysics({ active }) {
  const fixedCanvasRef = useRef(null);
  const docCanvasRef = useRef(null);

  useEffect(() => {
    const fixedCanvas = fixedCanvasRef.current;
    const docCanvas = docCanvasRef.current;
    const shell = document.querySelector(".app-shell");
    if (!active || !fixedCanvas || !docCanvas || !shell) return undefined;
    const context = fixedCanvas.getContext("2d", { alpha: true });
    const docContext = docCanvas.getContext("2d", { alpha: true });
    if (!context || !docContext) return undefined;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let frame = 0;
    let manualClock = null;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let docWidth = 1;
    let lastFrame = performance.now();
    let lastScan = -1e9;
    let headerBottom = 68;
    let headerLeft = 0;
    let headerRight = window.innerWidth;
    let nextFlockAt = 0;
    let tracked = [];
    const surfaces = [];
    const decorations = new Map();
    const bats = [];
    const pointer = { x: -1e4, y: -1e4 };

    // Telarana grande en la esquina superior izquierda de la pantalla (desktop).
    const cornerSeed = Math.random() * 1000;
    const cornerWeb = buildCornerWeb(cornerSeed, 126 + fract(cornerSeed * 3.7) * 32, 1, 1);
    const cornerSpider = fract(cornerSeed * 5.3) < .82 ? makeWebSpider(cornerSeed + 9) : null;

    // Aranas colgando de la barra superior sticky; huyen hilo arriba al pasar
    // el cursor por encima.
    const headerSpiders = [];
    {
      const spiderCount = 2 + (fract(cornerSeed * 9.31) < .5 ? 1 : 0);
      for (let index = 0; index < spiderCount; index += 1) {
        const spider = makeWebSpider(cornerSeed + 20 + index * 7.3);
        spider.baseLen *= .75;
        spider.targetLen = spider.baseLen;
        spider.x01 = .1 + .82 * fract(cornerSeed * (3.37 + index * 5.71));
        headerSpiders.push(spider);
      }
    }

    // Fantasmitas que vagan por la pantalla en orbitas lentas, apareciendo
    // y desvaneciendose. Van en el lienzo fijo, delante de los paneles.
    const ghosts = [];
    if (!reducedMotion) {
      const ghostCount = (width < 700 ? 2 : 3) + (fract(cornerSeed * 11.7) < .4 ? 1 : 0);
      for (let index = 0; index < ghostCount; index += 1) {
        ghosts.push({
          alpha: .3 + .15 * fract(cornerSeed * (13.9 + index * 3.7)),
          initialized: false,
          phase: fract(cornerSeed * (5.3 + index * 9.1)) * Math.PI * 2,
          seed: fract(cornerSeed * (2.9 + index * 4.3)) * 10,
          size: 9 + 7 * fract(cornerSeed * (8.3 + index * 6.1)),
          speed: .7 + .6 * fract(cornerSeed * (4.7 + index * 2.9)),
          vx: 0,
          vy: 0,
          x: 0,
          y: 0
        });
      }
    }

    function updateGhosts(now, delta) {
      const t = now / 1000;
      for (const ghost of ghosts) {
        const nx = width * (.5 + .38 * Math.sin(t * .11 * ghost.speed + ghost.seed * 1.7) + .16 * Math.sin(t * .23 * ghost.speed + ghost.seed * 3.1));
        const ny = height * (.44 + .28 * Math.sin(t * .13 * ghost.speed + ghost.seed * 2.3) + .12 * Math.sin(t * .29 * ghost.speed + ghost.seed * 4.7))
          + Math.sin(t * 2.1 + ghost.phase) * 5;
        if (ghost.initialized) {
          // Velocidad suavizada: la tela reacciona al movimiento sin nervios.
          const safeDelta = Math.max(.001, delta);
          ghost.vx += ((nx - ghost.x) / safeDelta - ghost.vx) * Math.min(1, delta * 6);
          ghost.vy += ((ny - ghost.y) / safeDelta - ghost.vy) * Math.min(1, delta * 6);
        } else {
          ghost.initialized = true;
        }
        ghost.x = nx;
        ghost.y = ny;
      }
    }

    // Contorno del fantasma en coordenadas locales (cabeza en el origen).
    // La sabana arrastra hacia atras del movimiento (drag) y el bajo ondea
    // con una fase viajera que se acelera cuanto mas rapido va.
    function ghostBodyPath(ctx, ghost, t, s, drag, rippleSpeed, rippleAmp) {
      const hemY = s * 1.15;
      const rightX = s * .92 + drag;
      const leftX = -s * .92 + drag;
      ctx.beginPath();
      ctx.moveTo(-s, 0);
      ctx.arc(0, 0, s, Math.PI, 0);
      ctx.quadraticCurveTo(s + drag * .35, hemY * .55, rightX, hemY);
      for (let segment = 0; segment < 4; segment += 1) {
        const from = rightX - ((rightX - leftX) * segment) / 4;
        const to = rightX - ((rightX - leftX) * (segment + 1)) / 4;
        const dip = s * (.26 + rippleAmp * Math.sin(t * rippleSpeed - segment * 1.9 + ghost.phase));
        ctx.quadraticCurveTo((from + to) / 2, hemY + dip, to, hemY - s * .12);
      }
      ctx.quadraticCurveTo(-s - drag * .2, hemY * .5, -s, 0);
      ctx.closePath();
    }

    function drawGhost(ctx, ghost, now) {
      const t = now / 1000;
      const s = ghost.size;
      const speed = Math.hypot(ghost.vx, ghost.vy);
      // Se inclina hacia donde va y la tela cuelga hacia atras.
      const lean = Math.max(-.32, Math.min(.32, ghost.vx * .004));
      const drag = Math.max(-s * .6, Math.min(s * .6, -ghost.vx * .05)) + Math.sin(t * 4.7 + ghost.phase) * s * .06;
      const rippleSpeed = 2.6 + Math.min(4.5, speed * .05);
      const rippleAmp = .1 + Math.min(.15, speed * .0012);
      const presence = .4 + .6 * (.5 + .5 * Math.sin(t * .33 + ghost.seed * 5.9));

      ctx.save();
      ctx.translate(ghost.x, ghost.y);
      ctx.rotate(lean);
      ctx.fillStyle = "#e4f4ff";

      // Estela: un eco tenue que queda por detras cuando acelera.
      if (speed > 26) {
        ctx.globalAlpha = ghost.alpha * presence * .28;
        ctx.translate(-ghost.vx * .045, -ghost.vy * .045);
        ghostBodyPath(ctx, ghost, t - .08, s, drag * 1.3, rippleSpeed, rippleAmp);
        ctx.fill();
        ctx.translate(ghost.vx * .045, ghost.vy * .045);
      }

      ctx.globalAlpha = ghost.alpha * presence;
      ghostBodyPath(ctx, ghost, t, s, drag, rippleSpeed, rippleAmp);
      ctx.fill();

      // Ojos que miran hacia donde va y parpadean de vez en cuando.
      const look = Math.max(-s * .1, Math.min(s * .1, ghost.vx * .002));
      const blinkT = fract((t + ghost.seed * 2.7) / (3.4 + fract(ghost.seed * 3.3) * 2));
      const blink = blinkT < .07 ? Math.max(.12, Math.abs(Math.cos((blinkT / .07) * Math.PI))) : 1;
      ctx.fillStyle = "rgba(12,6,20,.85)";
      ctx.beginPath();
      ctx.ellipse(-s * .34 + look, s * .05, s * .11, s * .16 * blink, 0, 0, Math.PI * 2);
      ctx.ellipse(s * .34 + look, s * .05, s * .11, s * .16 * blink, 0, 0, Math.PI * 2);
      ctx.fill();
      if (s > 12) {
        // La boca se abre un poco mas cuando coge carrerilla.
        ctx.beginPath();
        ctx.ellipse(look * .6, s * .46, s * .1, s * (.12 + Math.min(.08, speed * .0006)), 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    function resizeCanvas() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      fixedCanvas.width = Math.round(width * ratio);
      fixedCanvas.height = Math.round(height * ratio);
      fixedCanvas.style.width = `${width}px`;
      fixedCanvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function resizeDocCanvas() {
      const content = document.querySelector(".cabinet-layout");
      const cssWidth = Math.max(1, shell.clientWidth);
      const cssHeight = Math.max(1, content ? content.offsetHeight : shell.scrollHeight);
      const ratio = Math.min(1, 16000 / cssHeight, 16000 / cssWidth);
      const backingWidth = Math.round(cssWidth * ratio);
      const backingHeight = Math.round(cssHeight * ratio);
      docWidth = cssWidth;
      if (docCanvas.width === backingWidth && docCanvas.height === backingHeight) return;
      docCanvas.width = backingWidth;
      docCanvas.height = backingHeight;
      docCanvas.style.width = `${cssWidth}px`;
      docCanvas.style.height = `${cssHeight}px`;
      docContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function trackPointer(event) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }

    function buildDecor(deco, edgeWidth) {
      deco.edgeWidth = edgeWidth;
      deco.webs = [];
      const seed = deco.seed;
      const corners = deco.squareCorners;
      const radius = Math.min(74, Math.max(30, edgeWidth * .11));
      // Solo esquinas a 90 grados: las achaflanadas quedan libres de seda.
      const candidates = [
        ["tl", corners.tl, fract(seed * 7.13) < .8, 1, 1, .85 + .3 * fract(seed * 3.9)],
        ["tr", corners.tr, fract(seed * 3.71) < .6, -1, 1, .7 + .35 * fract(seed * 8.3)],
        ["bl", corners.bl, fract(seed * 8.87) < .3, 1, -1, .55 + .3 * fract(seed * 5.2)],
        ["br", corners.br, fract(seed * 12.43) < .25, -1, -1, .55 + .3 * fract(seed * 9.8)]
      ];
      let webSeedOffset = 1;
      for (const [corner, square, roll, dirX, dirY, scale] of candidates) {
        if (!square || !roll || deco.webs.length >= 2) continue;
        deco.webs.push({ corner, web: buildCornerWeb(seed + webSeedOffset, radius * scale, dirX, dirY) });
        webSeedOffset += 1;
      }
      // Sombreros de bruja: posados en esquinas rectas superiores sin telarana.
      deco.hats = [];
      for (const corner of ["tl", "tr"]) {
        if (!corners[corner] || deco.webs.some((entry) => entry.corner === corner)) continue;
        if (fract(seed * (corner === "tl" ? 17.9 : 21.3)) < .5) {
          deco.hats.push({
            corner,
            size: 18 + 9 * fract(seed * (corner === "tl" ? 5.9 : 8.7)),
            tilt: (fract(seed * 14.3) - .5) * .4
          });
          break;
        }
      }
      // La telarana de cortesia de los paneles anchos respeta el sombrero.
      if (!deco.webs.length && !deco.hats.length && edgeWidth > 460) {
        if (corners.tr) deco.webs.push({ corner: "tr", web: buildCornerWeb(seed + 3, radius, -1, 1) });
        else if (corners.tl) deco.webs.push({ corner: "tl", web: buildCornerWeb(seed + 3, radius, 1, 1) });
      }
      const topWebs = deco.webs.filter((entry) => entry.corner === "tl" || entry.corner === "tr");
      const hostIndex = Math.floor(fract(seed * 9.7) * topWebs.length);
      deco.spider = topWebs.length && fract(seed * 11.3) < .55
        ? { corner: topWebs[hostIndex].corner, ...makeWebSpider(seed + 4) }
        : null;
      deco.pumpkin = edgeWidth > 270 && fract(seed * 5.77) < .5
        ? { seed: fract(seed * 3.33) * 10, size: 9 + 5 * fract(seed * 7.31), x01: .16 + .68 * fract(seed * 12.9) }
        : null;
      // Bolsa de caramelos junto a la calabaza, al lado contrario de las velas.
      const candlesLeft = fract(seed * 4.9) < .5;
      deco.candyBag = deco.pumpkin && fract(seed * 13.1) < .65
        ? { seed: fract(seed * 6.17) * 10, side: candlesLeft ? 1 : -1, size: 7 + 4 * fract(seed * 9.71) }
        : null;
      // Velas sobre la repisa: acompanan a la calabaza y a menudo van solas.
      deco.candles = [];
      if (deco.pumpkin) {
        deco.candles.push({
          count: 1 + Math.floor(fract(seed * 9.13) * 3),
          seed: fract(seed * 8.81) * 10,
          x01: Math.min(.9, Math.max(.08, deco.pumpkin.x01 + (candlesLeft ? -.08 : .08)))
        });
      }
      if (edgeWidth > 240 && fract(seed * 15.7) < .6) {
        deco.candles.push({
          count: 2 + Math.floor(fract(seed * 11.9) * 3),
          seed: fract(seed * 2.71) * 10,
          x01: .12 + .72 * fract(seed * 6.13)
        });
      }
      if (edgeWidth > 620 && fract(seed * 19.3) < .4) {
        deco.candles.push({
          count: 2 + Math.floor(fract(seed * 7.57) * 2),
          seed: fract(seed * 5.39) * 10,
          x01: .1 + .78 * fract(seed * 10.7)
        });
      }
    }

    function makeDecor(element, rect) {
      const insets = readTopInsets(element);
      const deco = {
        anchored: isViewportAnchored(element),
        candles: [],
        candyBag: null,
        edgeWidth: 0,
        hats: [],
        insetLeft: insets.left,
        insetRight: insets.right,
        pumpkin: null,
        seed: Math.random() * 1000,
        spider: null,
        squareCorners: readSquareCorners(element),
        webs: []
      };
      buildDecor(deco, Math.max(60, rect.width - insets.left - insets.right));
      return deco;
    }

    function rescan(now) {
      lastScan = now;
      const headerRect = document.querySelector(".cart-slot")?.getBoundingClientRect();
      headerBottom = headerRect?.bottom ?? 68;
      headerLeft = headerRect?.left ?? 0;
      headerRight = headerRect?.right ?? width;
      tracked = [...document.querySelectorAll(EVENT_SURFACE_SELECTOR)]
        .filter((element) => !element.closest(EVENT_EXCLUDE_SELECTOR));
      for (const [element, deco] of decorations) {
        if (!element.isConnected) decorations.delete(element);
        else deco.anchored = isViewportAnchored(element);
      }
      resizeDocCanvas();
    }

    /* Igual que la nieve: rects releidos por frame. El corte se evalua contra
       el borde INFERIOR: los paneles altos siguen decorados (telarana de
       esquina baja incluida) mientras cualquier parte siga a la vista, y lo
       que quede bajo el header lo tapa el propio header (z-40). */
    function updateSurfaces() {
      surfaces.length = 0;
      const cutoffBottom = headerBottom - 150;
      for (const element of tracked) {
        if (!element.isConnected) continue;
        const rect = element.getBoundingClientRect();
        if (rect.width < 90 || rect.bottom < cutoffBottom || rect.top > height + 30 || rect.right < 24 || rect.left > width - 24) continue;
        let deco = decorations.get(element);
        if (!deco) {
          deco = makeDecor(element, rect);
          decorations.set(element, deco);
        }
        const left = rect.left + deco.insetLeft;
        const right = rect.right - deco.insetRight;
        const edgeWidth = right - left;
        if (edgeWidth < 60) continue;
        if (Math.abs(edgeWidth - deco.edgeWidth) > 14) buildDecor(deco, edgeWidth);
        surfaces.push({
          bottom: rect.bottom,
          deco,
          element,
          left,
          rawLeft: rect.left,
          rawRight: rect.right,
          right,
          top: rect.top,
          width: edgeWidth
        });
      }
    }

    function updateSpiderSprite(spider, anchorX, anchorY, now, delta) {
      spider.ax = anchorX;
      spider.ay = anchorY;
      if (reducedMotion) {
        spider.len = spider.baseLen * .6;
        spider.x = anchorX;
        spider.y = anchorY + spider.len;
        return;
      }
      const scared = spider.scaredUntil > now;
      if (!scared && now >= spider.nextMoveAt) {
        spider.targetLen = spider.baseLen * (.35 + .8 * Math.random());
        spider.nextMoveAt = now + 6000 + Math.random() * 9000;
      }
      const goal = scared ? 9 : spider.targetLen;
      spider.len += (goal - spider.len) * Math.min(1, delta * (scared ? 5.5 : 1.1));
      const angle = spider.swingAmp * (scared ? 1.5 : 1) * Math.sin((now / 1000) * spider.swingW + spider.phase);
      spider.x = anchorX + Math.sin(angle) * spider.len;
      spider.y = anchorY + Math.cos(angle) * spider.len;
      // Si el cursor se acerca, la arana trepa a toda prisa por su hilo.
      if (!scared && Math.hypot(pointer.x - spider.x, pointer.y - spider.y) < 48) {
        spider.scaredUntil = now + 2400 + Math.random() * 1800;
        spider.nextMoveAt = now + 4200;
      }
    }

    function spawnFlock(now) {
      nextFlockAt = now + 9000 + Math.random() * 13000;
      const cap = width < 700 ? 10 : 22;
      const direction = Math.random() < .5 ? 1 : -1;
      const count = (width < 700 ? 2 : 3) + Math.floor(Math.random() * (width < 700 ? 3 : 5));
      const baseY = height * (.1 + Math.random() * .34);
      const speed = (130 + Math.random() * 90) * direction;
      for (let index = 0; index < count; index += 1) {
        if (bats.length >= cap) return;
        bats.push({
          baseY: baseY + (Math.random() - .5) * 70,
          born: now,
          driftY: (Math.random() - .5) * 9,
          flapW: 4.5 + Math.random() * 3,
          phase: Math.random() * 9,
          scale: .55 + Math.random() * .75,
          vx: speed * (.9 + Math.random() * .2),
          wobAmp: 8 + Math.random() * 18,
          wobW: 1.1 + Math.random() * 1.5,
          x: direction > 0 ? -50 - index * (26 + Math.random() * 34) : width + 50 + index * (26 + Math.random() * 34)
        });
      }
    }

    function updateBats(now, delta) {
      for (let index = bats.length - 1; index >= 0; index -= 1) {
        const bat = bats[index];
        bat.x += bat.vx * delta;
        bat.y = bat.baseY + Math.sin((now / 1000) * bat.wobW + bat.phase) * bat.wobAmp + ((now - bat.born) / 1000) * bat.driftY;
        // Solo desaparecen por el lado de SALIDA: la bandada entra escalonada
        // desde mas alla del borde y no hay que matarla antes de que asome.
        if ((bat.vx < 0 && bat.x < -90) || (bat.vx > 0 && bat.x > width + 90)) bats.splice(index, 1);
      }
    }

    function drawCornerWeb(ctx, web, cx, cy, now) {
      ctx.strokeStyle = `rgba(224,214,255,${web.alpha})`;
      ctx.lineWidth = .9;
      ctx.beginPath();
      for (const spoke of web.spokes) {
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(spoke.angle) * spoke.length * web.dirX, cy + Math.sin(spoke.angle) * spoke.length * web.dirY);
      }
      // Anillos con comba hacia la esquina: seda vencida por su propio peso.
      for (let ring = 0; ring < web.rings.length; ring += 1) {
        const rr = web.rings[ring];
        for (let segment = 0; segment < web.spokes.length - 1; segment += 1) {
          if (web.torn.has(`${ring}:${segment}`)) continue;
          const a = web.spokes[segment];
          const b = web.spokes[segment + 1];
          const midAngle = (a.angle + b.angle) / 2;
          const sag = ((a.length + b.length) / 2) * rr * .82;
          ctx.moveTo(cx + Math.cos(a.angle) * a.length * rr * web.dirX, cy + Math.sin(a.angle) * a.length * rr * web.dirY);
          ctx.quadraticCurveTo(
            cx + Math.cos(midAngle) * sag * web.dirX,
            cy + Math.sin(midAngle) * sag * web.dirY,
            cx + Math.cos(b.angle) * b.length * rr * web.dirX,
            cy + Math.sin(b.angle) * b.length * rr * web.dirY
          );
        }
      }
      ctx.stroke();
      // Reflejos: la seda atrapa la luz de la luna a ratos.
      if (!reducedMotion) {
        ctx.fillStyle = "rgba(240,236,255,.92)";
        for (let glint = 0; glint < 2; glint += 1) {
          const u = fract(web.glintSeed * (13.7 + glint * 7.9));
          const twinkle = Math.sin((now / 420) * (.7 + u) + glint * 2.6 + web.glintSeed * 6);
          if (twinkle < .62) continue;
          const spoke = web.spokes[Math.floor(u * web.spokes.length)];
          const rr = web.rings[Math.floor(fract(u * 7.3) * web.rings.length)];
          ctx.globalAlpha = ((twinkle - .62) / .38) * .85;
          ctx.fillRect(
            cx + Math.cos(spoke.angle) * spoke.length * rr * web.dirX - .7,
            cy + Math.sin(spoke.angle) * spoke.length * rr * web.dirY - .7,
            1.4,
            1.4
          );
        }
        ctx.globalAlpha = 1;
      }
    }

    function drawSpiderSprite(ctx, spider, ox, oy) {
      const ax = spider.ax + ox;
      const ay = spider.ay + oy;
      const x = spider.x + ox;
      const y = spider.y + oy;
      const s = spider.size;
      ctx.strokeStyle = "rgba(224,214,255,.32)";
      ctx.lineWidth = .8;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.strokeStyle = "rgba(185,134,255,.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const side of [-1, 1]) {
        for (let leg = 0; leg < 4; leg += 1) {
          ctx.moveTo(x + side * 1.6 * s, y + .4 * s);
          ctx.quadraticCurveTo(
            x + side * (4.6 + leg * .5) * s,
            y - 2.6 * s + leg * 2 * s,
            x + side * (6.4 + leg * .8) * s,
            y + (leg - 1.5) * 2.4 * s + 1.2 * s
          );
        }
      }
      ctx.stroke();
      ctx.fillStyle = "#241436";
      ctx.strokeStyle = "rgba(185,134,255,.55)";
      ctx.lineWidth = .8;
      ctx.beginPath();
      ctx.ellipse(x, y + 1.8 * s, 2.6 * s, 3.1 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y - 1.6 * s, 1.7 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255,159,28,.9)";
      ctx.fillRect(x - 1.1 * s, y - 2 * s, .9, .9);
      ctx.fillRect(x + .3 * s, y - 2 * s, .9, .9);
    }

    function drawPumpkin(ctx, pumpkin, x, edgeY, now) {
      const flick = reducedMotion
        ? .75
        : .55 + .45 * (.5 + .5 * Math.sin(now / 137 + pumpkin.seed * 9)) * (.6 + .4 * Math.sin(now / 43 + pumpkin.seed * 31));
      const s = pumpkin.size;
      const cy = edgeY - s * .62;
      ctx.fillStyle = `rgba(255,140,26,${(.05 + .08 * flick).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, cy, s * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#b95c10";
      ctx.beginPath();
      ctx.ellipse(x, cy, s * .98, s * .68, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e8760f";
      ctx.beginPath();
      ctx.ellipse(x, cy, s * .72, s * .7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f98a1b";
      ctx.beginPath();
      ctx.ellipse(x, cy, s * .4, s * .72, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2c7a3f";
      ctx.fillRect(x - 1.2, cy - s * .72 - 3.2, 2.4, 3.6);
      // Cara tallada, iluminada por la vela interior.
      ctx.fillStyle = `rgba(255,196,84,${(.45 + .55 * flick).toFixed(3)})`;
      const eyeY = cy - s * .16;
      ctx.beginPath();
      ctx.moveTo(x - s * .46, eyeY);
      ctx.lineTo(x - s * .16, eyeY);
      ctx.lineTo(x - s * .31, eyeY - s * .26);
      ctx.closePath();
      ctx.moveTo(x + s * .46, eyeY);
      ctx.lineTo(x + s * .16, eyeY);
      ctx.lineTo(x + s * .31, eyeY - s * .26);
      ctx.closePath();
      ctx.fill();
      const mouthY = cy + s * .18;
      ctx.beginPath();
      ctx.moveTo(x - s * .5, mouthY);
      ctx.lineTo(x - s * .25, mouthY + s * .18);
      ctx.lineTo(x, mouthY);
      ctx.lineTo(x + s * .25, mouthY + s * .18);
      ctx.lineTo(x + s * .5, mouthY);
      ctx.lineTo(x + s * .3, mouthY + s * .4);
      ctx.lineTo(x - s * .3, mouthY + s * .4);
      ctx.closePath();
      ctx.fill();
    }

    function drawBat(ctx, bat, now) {
      const s = bat.scale;
      const wingLift = Math.sin((now / 1000) * bat.flapW * Math.PI * 2 + bat.phase) * 7 * s;
      const x = bat.x;
      const y = bat.y;
      ctx.fillStyle = "#150a24";
      ctx.strokeStyle = "rgba(185,134,255,.38)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y - 1.4 * s);
      ctx.quadraticCurveTo(x - 6.5 * s, y - 6 * s - wingLift * .5, x - 13 * s, y - 1.5 * s - wingLift);
      ctx.quadraticCurveTo(x - 8.5 * s, y + 2.6 * s - wingLift * .3, x - 5 * s, y + 1.6 * s);
      ctx.quadraticCurveTo(x - 2.6 * s, y + 3.4 * s, x, y + 2.2 * s);
      ctx.quadraticCurveTo(x + 2.6 * s, y + 3.4 * s, x + 5 * s, y + 1.6 * s);
      ctx.quadraticCurveTo(x + 8.5 * s, y + 2.6 * s - wingLift * .3, x + 13 * s, y - 1.5 * s - wingLift);
      ctx.quadraticCurveTo(x + 6.5 * s, y - 6 * s - wingLift * .5, x, y - 1.4 * s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 1.7 * s, y - 1.8 * s);
      ctx.lineTo(x - .7 * s, y - 4 * s);
      ctx.lineTo(x - .1 * s, y - 2 * s);
      ctx.moveTo(x + 1.7 * s, y - 1.8 * s);
      ctx.lineTo(x + .7 * s, y - 4 * s);
      ctx.lineTo(x + .1 * s, y - 2 * s);
      ctx.fill();
      if (s > .85) {
        ctx.fillStyle = "rgba(255,159,28,.85)";
        ctx.fillRect(x - 1.3 * s, y - 1 * s, 1, 1);
        ctx.fillRect(x + .5 * s, y - 1 * s, 1, 1);
      }
    }

    function drawCandles(ctx, cluster, x, edgeY, now) {
      for (let index = 0; index < cluster.count; index += 1) {
        const cx = x + (index - (cluster.count - 1) / 2) * 6.4;
        // Surtido de velas: altas y finas, bajas y gruesas tipo pilar.
        const waxHeight = 4.5 + fract(cluster.seed * (3.1 + index * 1.7)) * 8.5;
        const waxWidth = 2.2 + fract(cluster.seed * (7.9 + index * 2.3)) * 2;
        const flick = reducedMotion
          ? .8
          : (.55 + .45 * Math.sin(now / 85 + cluster.seed * 9 + index * 2.4)) * (.7 + .3 * Math.sin(now / 31 + index * 1.3));
        const flameHeight = (2.2 + waxHeight * .3 + waxWidth * .4) * (.7 + .5 * flick);
        const sway = reducedMotion ? 0 : Math.sin(now / 240 + cluster.seed * 3 + index * 1.7) * .6;
        // Resplandor de la llama sobre la repisa.
        ctx.fillStyle = `rgba(255,170,60,${(.05 + .07 * flick).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(cx, edgeY - waxHeight - 3, 7 + waxWidth + 2 * flick, 0, Math.PI * 2);
        ctx.fill();
        // Cera con sombra lateral y pabilo.
        ctx.fillStyle = "#e3dbc8";
        ctx.fillRect(cx - waxWidth / 2, edgeY - waxHeight, waxWidth, waxHeight);
        ctx.fillStyle = "rgba(40,24,12,.25)";
        ctx.fillRect(cx + waxWidth / 2 - waxWidth * .3, edgeY - waxHeight, waxWidth * .3, waxHeight);
        ctx.fillStyle = "#3a2c22";
        ctx.fillRect(cx - .4, edgeY - waxHeight - 1.5, .8, 1.5);
        // Llama exterior e interior, con vaiven de vela.
        ctx.fillStyle = `rgba(255,150,40,${(.5 + .4 * flick).toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(cx + sway, edgeY - waxHeight - 1.6 - flameHeight / 2, 1.1 + waxWidth * .22, flameHeight / 2 + 1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,228,140,.85)";
        ctx.beginPath();
        ctx.ellipse(cx + sway * .7, edgeY - waxHeight - 1.2 - flameHeight * .28, .6 + waxWidth * .12, flameHeight * .28 + .4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Sombrero de bruja posado en una esquina recta del panel.
    function drawWitchHat(ctx, hat, cornerX, edgeY, inward) {
      const s = hat.size;
      ctx.save();
      ctx.translate(cornerX + inward * s * .55, edgeY);
      ctx.rotate(hat.tilt);
      ctx.fillStyle = "#1d1130";
      ctx.strokeStyle = "rgba(185,134,255,.45)";
      ctx.lineWidth = .8;
      ctx.beginPath();
      ctx.ellipse(0, -1.2, s * .78, s * .2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Cono con la punta vencida, como manda la tradicion.
      ctx.beginPath();
      ctx.moveTo(-s * .38, -1.8);
      ctx.quadraticCurveTo(-s * .1, -s * .62, s * .02, -s * .94);
      ctx.quadraticCurveTo(s * .28, -s * 1.12, s * .34, -s * .9);
      ctx.quadraticCurveTo(s * .18, -s * .86, s * .12, -s * .62);
      ctx.quadraticCurveTo(s * .3, -s * .3, s * .38, -1.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Banda morada con hebilla dorada.
      ctx.fillStyle = "#4a2a6e";
      ctx.fillRect(-s * .32, -s * .3, s * .64, s * .15);
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(-s * .08, -s * .31, s * .16, s * .17);
      ctx.fillStyle = "#1d1130";
      ctx.fillRect(-s * .04, -s * .27, s * .08, s * .09);
      ctx.restore();
    }

    // Cubo de truco-o-trato con caramelos asomando y uno caido al lado.
    function drawCandyBag(ctx, bag, x, edgeY) {
      const s = bag.size;
      const candyColors = ["#ffd166", "#ff3d9d", "#45d8ff", "#b8ff52"];
      ctx.strokeStyle = "rgba(210,190,255,.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, edgeY - s + 1, s * .34, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = "#5b2d86";
      ctx.beginPath();
      ctx.moveTo(x - s * .48, edgeY - s * .78);
      ctx.lineTo(x + s * .48, edgeY - s * .78);
      ctx.lineTo(x + s * .38, edgeY);
      ctx.lineTo(x - s * .38, edgeY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(185,134,255,.5)";
      ctx.lineWidth = .8;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,159,28,.8)";
      ctx.fillRect(x - s * .42, edgeY - s * .52, s * .84, s * .16);
      for (let candy = 0; candy < 3; candy += 1) {
        ctx.fillStyle = candyColors[Math.floor(fract(bag.seed * (3.7 + candy)) * candyColors.length)];
        ctx.beginPath();
        ctx.arc(x - s * .22 + candy * s * .22, edgeY - s * .84, s * .11, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = candyColors[Math.floor(fract(bag.seed * 8.9) * candyColors.length)];
      ctx.beginPath();
      ctx.arc(x + s * .72, edgeY - s * .1, s * .1, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawSurfaceDecor(ctx, surface, now, ox, oy) {
      const deco = surface.deco;
      const anchors = {
        bl: [surface.rawLeft, surface.bottom],
        br: [surface.rawRight, surface.bottom],
        tl: [surface.left, surface.top],
        tr: [surface.right, surface.top]
      };
      for (const entry of deco.webs) {
        const [anchorX, anchorY] = anchors[entry.corner];
        drawCornerWeb(ctx, entry.web, anchorX + ox, anchorY + oy, now);
      }
      for (const hat of deco.hats) {
        drawWitchHat(ctx, hat, (hat.corner === "tl" ? surface.left : surface.right) + ox, surface.top + oy, hat.corner === "tl" ? 1 : -1);
      }
      if (deco.spider) drawSpiderSprite(ctx, deco.spider, ox, oy);
      if (deco.pumpkin) {
        const pumpkinX = surface.left + deco.pumpkin.x01 * surface.width;
        drawPumpkin(ctx, deco.pumpkin, pumpkinX + ox, surface.top + oy, now);
        if (deco.candyBag) {
          drawCandyBag(ctx, deco.candyBag, pumpkinX + deco.candyBag.side * (deco.pumpkin.size * 1.9 + deco.candyBag.size * .9) + ox, surface.top + oy);
        }
      }
      for (const cluster of deco.candles) {
        drawCandles(ctx, cluster, surface.left + cluster.x01 * surface.width + ox, surface.top + oy, now);
      }
    }

    function tick(now) {
      const rawDelta = (now - lastFrame) / 1000;
      const delta = Math.min(.05, Math.max(.001, rawDelta));
      lastFrame = now;
      if (now - lastScan >= 700) rescan(now);
      updateSurfaces();

      if (!reducedMotion) {
        if (now >= nextFlockAt) spawnFlock(now);
        updateBats(now, delta);
        updateGhosts(now, delta);
      }
      for (const surface of surfaces) {
        const spider = surface.deco.spider;
        if (!spider) continue;
        const anchorX = spider.corner === "tl" ? surface.left + 7 : surface.right - 7;
        updateSpiderSprite(spider, anchorX, surface.top + 3, now, delta);
      }
      if (cornerSpider && width >= 1024) updateSpiderSprite(cornerSpider, 42, 26, now, delta);
      for (const spider of headerSpiders) {
        updateSpiderSprite(spider, headerLeft + spider.x01 * Math.max(1, headerRight - headerLeft), headerBottom - 2, now, delta);
      }

      // Decorado de paneles normales: lienzo de documento (viaja con el scroll).
      // La franja a limpiar se calcula del alcance real de las superficies,
      // que ahora pueden asomar por su borde inferior desde muy arriba.
      const shellRect = shell.getBoundingClientRect();
      const ox = shell.scrollLeft - shellRect.left;
      const oy = shell.scrollTop - shellRect.top;
      let clearTop = 0;
      let clearBottom = shell.clientHeight;
      for (const surface of surfaces) {
        if (surface.top - 240 < clearTop) clearTop = surface.top - 240;
        if (surface.bottom + 240 > clearBottom) clearBottom = surface.bottom + 240;
      }
      docContext.clearRect(0, oy + clearTop, docWidth, clearBottom - clearTop);
      for (const surface of surfaces) {
        if (!surface.deco.anchored) drawSurfaceDecor(docContext, surface, now, ox, oy);
      }

      // Lienzo fijo: telarana de esquina de pantalla, aranas del header,
      // paneles anclados y murcielagos.
      context.clearRect(0, 0, width, height);
      if (width >= 1024) {
        drawCornerWeb(context, cornerWeb, -4, -4, now);
        if (cornerSpider) drawSpiderSprite(context, cornerSpider, 0, 0);
      }
      for (const spider of headerSpiders) drawSpiderSprite(context, spider, 0, 0);
      for (const surface of surfaces) {
        if (surface.deco.anchored) drawSurfaceDecor(context, surface, now, 0, 0);
      }
      if (!reducedMotion) {
        for (const ghost of ghosts) drawGhost(context, ghost, now);
        for (const bat of bats) drawBat(context, bat, now);
      }
    }

    function loop(now) {
      tick(now);
      frame = window.requestAnimationFrame(loop);
    }

    resizeCanvas();
    resizeDocCanvas();
    rescan(performance.now());
    frame = window.requestAnimationFrame(loop);
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("resize", resizeDocCanvas);
    window.addEventListener("pointermove", trackPointer, { passive: true });

    if (import.meta.env.DEV) {
      // Gancho de depuracion: permite avanzar la simulacion sin rAF.
      window.__daivrHalloween = {
        step(ms = 16) {
          window.cancelAnimationFrame(frame);
          manualClock = (manualClock ?? lastFrame) + ms;
          tick(manualClock);
          return { bats: bats.length, surfaces: surfaces.length };
        },
        resume() {
          manualClock = null;
          lastFrame = performance.now();
          window.cancelAnimationFrame(frame);
          frame = window.requestAnimationFrame(loop);
        },
        summary() {
          return {
            bats: bats.length,
            cornerSpider: cornerSpider ? { len: Math.round(cornerSpider.len), x: Math.round(cornerSpider.x), y: Math.round(cornerSpider.y) } : null,
            ghosts: ghosts.map((ghost) => ({ x: Math.round(ghost.x), y: Math.round(ghost.y) })),
            headerSpiders: headerSpiders.map((spider) => ({ len: Math.round(spider.len), x: Math.round(spider.x), y: Math.round(spider.y) })),
            surfaces: surfaces.map((surface) => ({
              anchored: surface.deco.anchored,
              candles: surface.deco.candles.length,
              candyBag: !!surface.deco.candyBag,
              corners: surface.deco.squareCorners,
              hats: surface.deco.hats.map((hat) => hat.corner),
              pumpkin: !!surface.deco.pumpkin,
              spider: surface.deco.spider
                ? { len: Math.round(surface.deco.spider.len), x: Math.round(surface.deco.spider.x), y: Math.round(surface.deco.spider.y) }
                : null,
              tag: surface.element.className.split(" ")[0],
              top: Math.round(surface.top),
              webs: surface.deco.webs.map((entry) => entry.corner)
            }))
          };
        }
      };
    }

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("resize", resizeDocCanvas);
      window.removeEventListener("pointermove", trackPointer);
      context.clearRect(0, 0, width, height);
      docContext.clearRect(0, 0, docCanvas.width, docCanvas.height);
      if (import.meta.env.DEV) delete window.__daivrHalloween;
    };
  }, [active]);

  return (
    <>
      <canvas className="halloween-decor-piles" ref={docCanvasRef} aria-hidden="true" />
      <canvas className="halloween-decor-physics" ref={fixedCanvasRef} aria-hidden="true" />
    </>
  );
}

/* ---- Fabrica de motores de decorado de repisa ---------------------------
   April y cumpleanos comparten esqueleto: lienzo de documento para lo pegado
   a paneles (viaja con el scroll) y lienzo fijo para lo que flota en pantalla,
   con enrutado de paneles anclados igual que nieve/halloween. El contenido lo
   aporta cada evento via config. */
function createLedgeDecorEngine(config) {
  return function LedgeDecorEngine({ active }) {
    const fixedCanvasRef = useRef(null);
    const docCanvasRef = useRef(null);

    useEffect(() => {
      const fixedCanvas = fixedCanvasRef.current;
      const docCanvas = docCanvasRef.current;
      const shell = document.querySelector(".app-shell");
      if (!active || !fixedCanvas || !docCanvas || !shell) return undefined;
      const context = fixedCanvas.getContext("2d", { alpha: true });
      const docContext = docCanvas.getContext("2d", { alpha: true });
      if (!context || !docContext) return undefined;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let frame = 0;
      let manualClock = null;
      let width = window.innerWidth;
      let height = window.innerHeight;
      let docWidth = 1;
      let lastFrame = performance.now();
      let lastScan = -1e9;
      let headerBottom = 68;
      let tracked = [];
      const surfaces = [];
      const decorations = new Map();
      const pointer = { x: -1e4, y: -1e4, vx: 0, vy: 0, speed: 0, stamp: 0 };
      const env = {
        get height() { return height; },
        get width() { return width; },
        pointer,
        reducedMotion,
        state: {},
        surfaces
      };
      if (config.init) config.init(env);

      function resizeCanvas() {
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        fixedCanvas.width = Math.round(width * ratio);
        fixedCanvas.height = Math.round(height * ratio);
        fixedCanvas.style.width = `${width}px`;
        fixedCanvas.style.height = `${height}px`;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
      }

      function resizeDocCanvas() {
        const content = document.querySelector(".cabinet-layout");
        const cssWidth = Math.max(1, shell.clientWidth);
        const cssHeight = Math.max(1, content ? content.offsetHeight : shell.scrollHeight);
        const ratio = Math.min(1, 16000 / cssHeight, 16000 / cssWidth);
        const backingWidth = Math.round(cssWidth * ratio);
        const backingHeight = Math.round(cssHeight * ratio);
        docWidth = cssWidth;
        if (docCanvas.width === backingWidth && docCanvas.height === backingHeight) return;
        docCanvas.width = backingWidth;
        docCanvas.height = backingHeight;
        docCanvas.style.width = `${cssWidth}px`;
        docCanvas.style.height = `${cssHeight}px`;
        docContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      }

      function trackPointer(event) {
        const elapsed = Math.max(8, event.timeStamp - pointer.stamp);
        if (pointer.stamp) {
          pointer.vx = ((event.clientX - pointer.x) / elapsed) * 1000;
          pointer.vy = ((event.clientY - pointer.y) / elapsed) * 1000;
          pointer.speed = Math.hypot(pointer.vx, pointer.vy);
        }
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        pointer.stamp = event.timeStamp;
      }

      function makeDecor(element, rect) {
        const insets = readTopInsets(element);
        const deco = {
          anchored: isViewportAnchored(element),
          edgeWidth: 0,
          insetLeft: insets.left,
          insetRight: insets.right,
          seed: Math.random() * 1000,
          squareCorners: readSquareCorners(element)
        };
        deco.edgeWidth = Math.max(60, rect.width - insets.left - insets.right);
        config.buildDecor(deco, deco.edgeWidth);
        return deco;
      }

      function rescan(now) {
        lastScan = now;
        headerBottom = document.querySelector(".cart-slot")?.getBoundingClientRect().bottom ?? 68;
        tracked = [...document.querySelectorAll(EVENT_SURFACE_SELECTOR)]
          .filter((element) => !element.closest(EVENT_EXCLUDE_SELECTOR));
        for (const [element, deco] of decorations) {
          if (!element.isConnected) decorations.delete(element);
          else deco.anchored = isViewportAnchored(element);
        }
        resizeDocCanvas();
      }

      function updateSurfaces() {
        surfaces.length = 0;
        const cutoffBottom = headerBottom - 150;
        for (const element of tracked) {
          if (!element.isConnected) continue;
          const rect = element.getBoundingClientRect();
          if (rect.width < 90 || rect.bottom < cutoffBottom || rect.top > height + 30 || rect.right < 24 || rect.left > width - 24) continue;
          let deco = decorations.get(element);
          if (!deco) {
            deco = makeDecor(element, rect);
            decorations.set(element, deco);
          }
          const left = rect.left + deco.insetLeft;
          const right = rect.right - deco.insetRight;
          const edgeWidth = right - left;
          if (edgeWidth < 60) continue;
          if (Math.abs(edgeWidth - deco.edgeWidth) > 14) {
            deco.edgeWidth = edgeWidth;
            config.buildDecor(deco, edgeWidth);
          }
          surfaces.push({
            bottom: rect.bottom,
            deco,
            element,
            left,
            rawLeft: rect.left,
            rawRight: rect.right,
            right,
            top: rect.top,
            width: edgeWidth
          });
        }
      }

      function tick(now) {
        const rawDelta = (now - lastFrame) / 1000;
        const delta = Math.min(.05, Math.max(.001, rawDelta));
        lastFrame = now;
        if (now - lastScan >= 700) rescan(now);
        updateSurfaces();
        if (config.update) config.update(env, now, delta);
        pointer.speed *= Math.max(0, 1 - delta * 6);

        const shellRect = shell.getBoundingClientRect();
        const ox = shell.scrollLeft - shellRect.left;
        const oy = shell.scrollTop - shellRect.top;
        let clearTop = 0;
        let clearBottom = shell.clientHeight;
        for (const surface of surfaces) {
          if (surface.top - 240 < clearTop) clearTop = surface.top - 240;
          if (surface.bottom + 240 > clearBottom) clearBottom = surface.bottom + 240;
        }
        docContext.clearRect(0, oy + clearTop, docWidth, clearBottom - clearTop);
        for (const surface of surfaces) {
          if (!surface.deco.anchored) config.drawSurface(docContext, surface, now, ox, oy, env);
        }
        context.clearRect(0, 0, width, height);
        for (const surface of surfaces) {
          if (surface.deco.anchored) config.drawSurface(context, surface, now, 0, 0, env);
        }
        if (config.drawAir) config.drawAir(context, now, env);
      }

      function loop(now) {
        tick(now);
        frame = window.requestAnimationFrame(loop);
      }

      resizeCanvas();
      resizeDocCanvas();
      rescan(performance.now());
      frame = window.requestAnimationFrame(loop);
      window.addEventListener("resize", resizeCanvas);
      window.addEventListener("resize", resizeDocCanvas);
      window.addEventListener("pointermove", trackPointer, { passive: true });

      if (import.meta.env.DEV) {
        window[config.hookName] = {
          step(ms = 16) {
            window.cancelAnimationFrame(frame);
            manualClock = (manualClock ?? lastFrame) + ms;
            tick(manualClock);
            return { surfaces: surfaces.length };
          },
          resume() {
            manualClock = null;
            lastFrame = performance.now();
            window.cancelAnimationFrame(frame);
            frame = window.requestAnimationFrame(loop);
          },
          summary() {
            return config.summary(env);
          }
        };
      }

      return () => {
        window.cancelAnimationFrame(frame);
        window.removeEventListener("resize", resizeCanvas);
        window.removeEventListener("resize", resizeDocCanvas);
        window.removeEventListener("pointermove", trackPointer);
        context.clearRect(0, 0, width, height);
        docContext.clearRect(0, 0, docCanvas.width, docCanvas.height);
        if (import.meta.env.DEV) delete window[config.hookName];
      };
    }, [active]);

    return (
      <>
        <canvas className={`${config.classPrefix}-piles`} ref={docCanvasRef} aria-hidden="true" />
        <canvas className={`${config.classPrefix}-physics`} ref={fixedCanvasRef} aria-hidden="true" />
      </>
    );
  };
}

/* ---- April fools: cabina rota -------------------------------------------
   Cristal reventado con facetas y esquirlas caidas (nada de rayitas planas),
   bandas de corrupcion que rasgan paneles, cables pelados que chispean,
   cinta de peligro y dialogos de error posados de cualquier manera. */

/* Geometria del reventon precalculada una vez por panel: rayos con quiebro y
   ramitas, facetas entre rayos y una esquirla desprendida que deja hueco. */
function buildShatterWeb(seed) {
  const rayCount = 7 + Math.floor(fract(seed * 11.7) * 4);
  const rays = [];
  for (let ray = 0; ray < rayCount; ray += 1) {
    rays.push({
      angle: (ray / rayCount) * Math.PI * 2 + (fract(seed * (3.1 + ray)) - .5) * .62,
      branch: fract(seed * (14.9 + ray * 2.7)) < .5,
      kinkTurn: (fract(seed * (9.1 + ray)) - .5) * .58,
      length: .55 + .45 * fract(seed * (7.7 + ray * 1.3)),
      mid: .4 + .24 * fract(seed * (5.3 + ray))
    });
  }
  return {
    glintSeed: fract(seed * 4.91) * 10,
    missing: fract(seed * 6.67) < .6 ? Math.floor(fract(seed * 8.23) * rayCount) : -1,
    rays
  };
}

function drawShatter(ctx, crack, surface, now, ox, oy, reducedMotion) {
  const x = surface.left + crack.x01 * surface.width + ox;
  const y = surface.top + (surface.bottom - surface.top) * crack.y01 + oy;
  const radius = crack.radius;
  const { missing, rays } = crack.web;
  const rayTip = (ray, scale) => [x + Math.cos(ray.angle) * ray.length * radius * scale, y + Math.sin(ray.angle) * ray.length * radius * scale];
  ctx.save();
  // El reventon vive EN el panel: se recorta a su caja.
  ctx.beginPath();
  ctx.rect(surface.rawLeft + ox, surface.top + oy, surface.rawRight - surface.rawLeft, surface.bottom - surface.top);
  ctx.clip();

  // Facetas: cunas de cristal que atrapan la luz con brillos desiguales.
  for (let index = 0; index < rays.length; index += 1) {
    if (index === missing) continue;
    const shade = fract(crack.seed * (3.7 + index * 1.7));
    if (shade < .48) continue;
    const [ax, ay] = rayTip(rays[index], .74);
    const [bx, by] = rayTip(rays[(index + 1) % rays.length], .74);
    const glow = ctx.createLinearGradient(x, y, (ax + bx) / 2, (ay + by) / 2);
    glow.addColorStop(0, `rgba(215,240,255,${(.05 + shade * .07).toFixed(3)})`);
    glow.addColorStop(1, "rgba(215,240,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.closePath();
    ctx.fill();
  }

  // Hueco de esquirla caida: se ve el vacio oscuro del interior de la cabina,
  // con el canto fracturado brillando alrededor.
  if (missing >= 0) {
    const a = rays[missing];
    const b = rays[(missing + 1) % rays.length];
    const [ax, ay] = rayTip(a, .58);
    const [bx, by] = rayTip(b, .58);
    const jagAngle = (a.angle + b.angle) / 2 + (a.angle > b.angle ? Math.PI : 0);
    const [jx, jy] = [x + Math.cos(jagAngle) * radius * .78, y + Math.sin(jagAngle) * radius * .78];
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(ax, ay);
    ctx.lineTo(jx, jy);
    ctx.lineTo(bx, by);
    ctx.closePath();
    ctx.fillStyle = "rgba(2,8,14,.9)";
    ctx.fill();
    ctx.strokeStyle = "rgba(225,245,255,.55)";
    ctx.lineWidth = .9;
    ctx.stroke();
  }

  // Rayos: gruesos junto al impacto, finos al morir, con quiebro y ramita.
  for (const ray of rays) {
    const length = ray.length * radius;
    const [mx, my] = [x + Math.cos(ray.angle) * length * ray.mid, y + Math.sin(ray.angle) * length * ray.mid];
    const kink = ray.angle + ray.kinkTurn;
    const [ex, ey] = [mx + Math.cos(kink) * length * (1 - ray.mid), my + Math.sin(kink) * length * (1 - ray.mid)];
    ctx.strokeStyle = "rgba(222,244,255,.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(mx, my);
    ctx.stroke();
    ctx.strokeStyle = "rgba(198,232,255,.34)";
    ctx.lineWidth = .7;
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.lineTo(ex, ey);
    if (ray.branch) {
      const branchAngle = kink + (ray.kinkTurn > 0 ? -.9 : .9);
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + Math.cos(branchAngle) * length * .3, my + Math.sin(branchAngle) * length * .3);
    }
    ctx.stroke();
  }

  // Anillos concentricos parciales cosiendo rayos vecinos.
  ctx.strokeStyle = "rgba(205,235,255,.28)";
  ctx.lineWidth = .7;
  ctx.beginPath();
  for (const ringScale of [.3, .55]) {
    for (let ray = 0; ray < rays.length; ray += 1) {
      if (ray === missing || fract(crack.seed * (13.7 + ray * 2.1 + ringScale * 10)) < .3) continue;
      const [ax, ay] = rayTip(rays[ray], ringScale);
      const [bx, by] = rayTip(rays[(ray + 1) % rays.length], ringScale);
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
    }
  }
  ctx.stroke();

  // Nucleo del impacto: punto blanco con halo polvoriento.
  const core = ctx.createRadialGradient(x, y, 0, x, y, 7);
  core.addColorStop(0, "rgba(245,252,255,.9)");
  core.addColorStop(.4, "rgba(225,245,255,.28)");
  core.addColorStop(1, "rgba(225,245,255,0)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();

  // Esquirlas caidas: cristalitos tumbados en el borde inferior del panel.
  const chipBase = surface.bottom + oy - 1.4;
  for (let chip = 0; chip < 4; chip += 1) {
    const u = fract(crack.seed * (17.3 + chip * 3.9));
    if (chip > 1 && u < .4) continue;
    const chipX = x + (u - .5) * radius * 2.6;
    const chipW = 3 + u * 4;
    const chipH = 2 + fract(u * 7.7) * 2.5;
    ctx.fillStyle = "rgba(210,238,255,.3)";
    ctx.strokeStyle = "rgba(235,250,255,.5)";
    ctx.lineWidth = .6;
    ctx.beginPath();
    ctx.moveTo(chipX - chipW / 2, chipBase);
    ctx.lineTo(chipX + chipW / 2, chipBase);
    ctx.lineTo(chipX + chipW * (fract(u * 13.1) - .5) * .5, chipBase - chipH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Destello especular: cada pocos segundos una luz recorre la zona rota.
  if (!reducedMotion) {
    const phase = ((now / 1000) * .16 + crack.web.glintSeed) % 1;
    if (phase < .1) {
      const sweep = phase / .1;
      const alpha = Math.sin(sweep * Math.PI) * .5;
      const glintAngle = -.7;
      const offset = (sweep - .5) * radius * 2.2;
      const [gx, gy] = [x + Math.cos(glintAngle + Math.PI / 2) * offset, y + Math.sin(glintAngle + Math.PI / 2) * offset];
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(235,250,255,${alpha.toFixed(3)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(gx - Math.cos(glintAngle) * radius, gy - Math.sin(glintAngle) * radius);
      ctx.lineTo(gx + Math.cos(glintAngle) * radius, gy + Math.sin(glintAngle) * radius);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/* Bandas de corrupcion: el panel "rasga" medio segundo cada varios segundos,
   con cortes RGB desplazados que saltan de sitio a golpe de reloj. */
function drawGlitchBands(ctx, glitch, surface, now, ox, oy) {
  const cycle = (now + glitch.phase * 10000) % glitch.period;
  if (cycle > 520) return;
  const step = Math.floor(now / 90);
  const panelTop = surface.top + oy;
  const panelHeight = surface.bottom - surface.top;
  ctx.save();
  ctx.beginPath();
  ctx.rect(surface.rawLeft + ox, panelTop, surface.rawRight - surface.rawLeft, panelHeight);
  ctx.clip();
  ctx.globalCompositeOperation = "lighter";
  for (let band = 0; band < glitch.bands; band += 1) {
    const u = fract(Math.sin(step * 7.13 + band * 91.7 + glitch.seed) * 43758.5453);
    const bandY = panelTop + panelHeight * (.08 + .84 * u);
    const bandH = 2 + fract(u * 57.3) * 4;
    const bandW = surface.width * (.3 + .7 * fract(u * 13.7));
    const bandX = surface.left + ox + (surface.width - bandW) * fract(u * 29.3);
    const shift = (fract(u * 91.1) - .5) * 26;
    ctx.fillStyle = "rgba(69,216,255,.13)";
    ctx.fillRect(bandX + shift, bandY, bandW, bandH);
    ctx.fillStyle = "rgba(255,61,157,.11)";
    ctx.fillRect(bandX - shift, bandY + bandH * .4, bandW, bandH * .7);
    ctx.fillStyle = "rgba(255,255,255,.2)";
    ctx.fillRect(bandX + shift * 1.4, bandY + bandH * .3, bandW * .38, 1);
  }
  // Bloques de pixel corrupto junto al borde derecho.
  const blockU = fract(Math.sin(step * 3.77 + glitch.seed * 7) * 43758.5453);
  ctx.fillStyle = "rgba(111,210,255,.16)";
  ctx.fillRect(surface.right + ox - 26 - blockU * 30, panelTop + panelHeight * blockU, 7 + blockU * 9, 4);
  ctx.fillRect(surface.right + ox - 14, panelTop + panelHeight * fract(blockU * 3.3), 5, 3);
  ctx.restore();
}

/* Cables pelados asomando por un boquete del borde superior; el cable vivo
   escupe un chispazo de vez en cuando. */
const WIRE_COLORS = ["#d98038", "#3d6fd9", "#2a2f3a"];

function drawWires(ctx, wires, surface, now, ox, oy, reducedMotion) {
  const isLeft = wires.corner === "tl";
  const baseX = (isLeft ? surface.left + 16 + wires.offset : surface.right - 16 - wires.offset) + ox;
  const topY = surface.top + oy;
  const t = reducedMotion ? 0 : now / 1000;
  // Boquete oscuro con canto irregular.
  ctx.fillStyle = "rgba(3,7,10,.92)";
  ctx.beginPath();
  ctx.moveTo(baseX - 11, topY);
  ctx.lineTo(baseX - 6, topY + 4 + fract(wires.seed * 3.1) * 3);
  ctx.lineTo(baseX - 1, topY + 2.5);
  ctx.lineTo(baseX + 4, topY + 6 + fract(wires.seed * 5.7) * 3);
  ctx.lineTo(baseX + 9, topY + 3);
  ctx.lineTo(baseX + 12, topY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(140,190,220,.28)";
  ctx.lineWidth = .8;
  ctx.stroke();

  let liveX = baseX;
  let liveY = topY;
  for (let wire = 0; wire < wires.count; wire += 1) {
    const sway = reducedMotion ? 0 : Math.sin(t * (1.1 + wire * .37) + wires.seed * 3 + wire * 2.1) * (2 + wire * 1.3);
    const length = wires.length * (.6 + .4 * fract(wires.seed * (3.3 + wire)));
    const endX = baseX + (wire - (wires.count - 1) / 2) * 5.5 + sway;
    const endY = topY + length;
    ctx.strokeStyle = WIRE_COLORS[wire % WIRE_COLORS.length];
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(baseX + (wire - (wires.count - 1) / 2) * 2.5, topY + 2);
    ctx.quadraticCurveTo(baseX + (wire - (wires.count - 1) / 2) * 7 + sway * .4, topY + length * .62, endX, endY);
    ctx.stroke();
    // Punta pelada de cobre.
    ctx.fillStyle = "#e8c26a";
    ctx.fillRect(endX - 1.2, endY - 1, 2.4, 3.4);
    if (wire === wires.count - 1) {
      liveX = endX;
      liveY = endY + 2;
    }
  }

  if (!reducedMotion) {
    const sparkPeriod = 2.4 + fract(wires.seed * 7.7) * 3.2;
    const sparkPhase = (t * .55 + wires.seed) % sparkPeriod;
    if (sparkPhase < .13) {
      const flash = Math.sin((sparkPhase / .13) * Math.PI);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = flash;
      ctx.fillStyle = "rgba(255,244,180,.9)";
      ctx.beginPath();
      ctx.arc(liveX, liveY, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,238,150,.95)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (let tick = 0; tick < 5; tick += 1) {
        const tickAngle = fract(Math.sin(Math.floor(now / 60) * 3.3 + tick * 17.9 + wires.seed) * 43758.5453) * Math.PI * 2;
        const reach = 4 + fract(tickAngle * 9.31) * 6;
        ctx.moveTo(liveX + Math.cos(tickAngle) * 2, liveY + Math.sin(tickAngle) * 2);
        ctx.lineTo(liveX + Math.cos(tickAngle) * reach, liveY + Math.sin(tickAngle) * reach);
      }
      ctx.stroke();
      ctx.restore();
    }
  }
}

function drawTape(ctx, tape, surface, ox, oy) {
  const isLeft = tape.corner === "tl";
  const anchorX = (isLeft ? surface.rawLeft : surface.rawRight) + ox;
  ctx.save();
  ctx.translate(anchorX, surface.top + oy + 5);
  ctx.rotate(isLeft ? tape.angle : -tape.angle);
  const start = isLeft ? -tape.length * .35 : -tape.length * .65;
  ctx.fillStyle = "rgba(255,209,102,.82)";
  ctx.fillRect(start, -6.5, tape.length, 13);
  ctx.fillStyle = "rgba(10,10,8,.85)";
  for (let stripe = 2; stripe < tape.length - 6; stripe += 14) {
    ctx.beginPath();
    ctx.moveTo(start + stripe, 6.5);
    ctx.lineTo(start + stripe + 7, -6.5);
    ctx.lineTo(start + stripe + 12, -6.5);
    ctx.lineTo(start + stripe + 5, 6.5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(20,16,4,.6)";
  ctx.lineWidth = 1;
  ctx.strokeRect(start, -6.5, tape.length, 13);
  ctx.restore();
}

function drawBrokenDialog(ctx, dialog, surface, now, ox, oy, reducedMotion) {
  const x = surface.left + dialog.x01 * surface.width + ox;
  const t = now / 1000;
  // Resbalon periodico: pierde agarre un instante y se recoloca.
  const pulse = reducedMotion ? 0 : Math.max(0, Math.sin(t * .35 + dialog.seed * 7) - .985) / .015;
  const w = dialog.w;
  const h = dialog.h;
  ctx.save();
  ctx.translate(x, surface.top + oy + pulse * 2);
  ctx.rotate(dialog.tilt * (1 + pulse * .3));
  ctx.fillStyle = "rgba(6,26,44,.95)";
  ctx.fillRect(-w / 2, -h, w, h);
  ctx.strokeStyle = "rgba(111,210,255,.55)";
  ctx.lineWidth = .8;
  ctx.strokeRect(-w / 2, -h, w, h);
  ctx.fillStyle = "#0878d1";
  ctx.fillRect(-w / 2, -h, w, 7);
  ctx.fillStyle = "#ff5f68";
  ctx.fillRect(w / 2 - 7, -h + 1.5, 4.5, 4);
  ctx.fillStyle = "rgba(160,200,230,.5)";
  ctx.fillRect(-w / 2 + 5, -h + 11, w * .5, 2.5);
  ctx.fillRect(-w / 2 + 5, -h + 16, w * .36, 2.5);
  ctx.strokeStyle = "#ff5f68";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 14, -h + 11);
  ctx.lineTo(w / 2 - 7, -h + 18);
  ctx.moveTo(w / 2 - 7, -h + 11);
  ctx.lineTo(w / 2 - 14, -h + 18);
  ctx.stroke();
  ctx.restore();
}

const AprilDecorPhysics = createLedgeDecorEngine({
  classPrefix: "april-decor",
  hookName: "__daivrApril",
  buildDecor(deco, edgeWidth) {
    const seed = deco.seed;
    deco.crack = edgeWidth > 240 && fract(seed * 7.31) < .5
      ? {
        radius: 20 + 26 * fract(seed * 5.51),
        seed: fract(seed * 2.91) * 10,
        web: buildShatterWeb(fract(seed * 3.53) * 100),
        x01: .18 + .64 * fract(seed * 3.17),
        y01: .18 + .38 * fract(seed * 9.73)
      }
      : null;
    deco.tape = fract(seed * 13.9) < .32
      ? {
        angle: .24 + .14 * fract(seed * 8.13),
        corner: fract(seed * 4.7) < .5 ? "tl" : "tr",
        length: 84 + 46 * fract(seed * 6.29)
      }
      : null;
    deco.dialog = edgeWidth > 300 && fract(seed * 17.3) < .38
      ? {
        h: 25 + 9 * fract(seed * 2.63),
        seed: fract(seed * 6.11) * 10,
        tilt: (fract(seed * 12.7) < .5 ? -1 : 1) * (.1 + .16 * fract(seed * 9.41)),
        w: 46 + 18 * fract(seed * 7.91),
        x01: .14 + .7 * fract(seed * 5.87)
      }
      : null;
    deco.glitch = fract(seed * 19.3) < .42
      ? {
        bands: 2 + Math.floor(fract(seed * 21.9) * 3),
        period: 6200 + fract(seed * 27.7) * 7000,
        phase: fract(seed * 31.3),
        seed: fract(seed * 23.9) * 10
      }
      : null;
    deco.wires = edgeWidth > 220 && fract(seed * 23.1) < .3
      ? {
        corner: fract(seed * 29.7) < .5 ? "tl" : "tr",
        count: 2 + (fract(seed * 33.1) < .5 ? 1 : 0),
        length: 26 + 22 * fract(seed * 37.9),
        offset: 10 * fract(seed * 41.3),
        seed: fract(seed * 3.71) * 10
      }
      : null;
    // Cinta y cables no comparten esquina: la cinta taparia el boquete.
    if (deco.wires && deco.tape && deco.wires.corner === deco.tape.corner) {
      deco.wires.corner = deco.tape.corner === "tl" ? "tr" : "tl";
    }
  },
  drawSurface(ctx, surface, now, ox, oy, env) {
    const deco = surface.deco;
    if (deco.glitch && !env.reducedMotion) drawGlitchBands(ctx, deco.glitch, surface, now, ox, oy);
    if (deco.crack) drawShatter(ctx, deco.crack, surface, now, ox, oy, env.reducedMotion);
    if (deco.tape) drawTape(ctx, deco.tape, surface, ox, oy);
    if (deco.wires) drawWires(ctx, deco.wires, surface, now, ox, oy, env.reducedMotion);
    if (deco.dialog) drawBrokenDialog(ctx, deco.dialog, surface, now, ox, oy, env.reducedMotion);
  },
  summary(env) {
    return env.surfaces.map((surface) => ({
      anchored: surface.deco.anchored,
      crack: !!surface.deco.crack,
      dialog: !!surface.deco.dialog,
      glitch: !!surface.deco.glitch,
      tag: surface.element.className.split(" ")[0],
      tape: !!surface.deco.tape,
      top: Math.round(surface.top),
      wires: !!surface.deco.wires
    }));
  }
});

/* ---- Cumpleanos: fiesta en la sala de maquinas --------------------------
   Regalos y velas de fiesta en las repisas, una tarta en los paneles anchos,
   confeti ambiental con reventones de petardo, globos que suben y un pop de
   confeti al barrer rapido con el cursor. */

const PARTY_COLORS = ["#ff3d9d", "#45d8ff", "#ffd166", "#3fff97", "#b986ff"];

function drawGiftBox(ctx, baseY, s, bodyColor, ribbonColor) {
  const w = s * 1.15;
  const h = s * .95;
  ctx.fillStyle = bodyColor;
  ctx.fillRect(-w / 2, baseY - h, w, h);
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.fillRect(w / 2 - w * .28, baseY - h, w * .28, h);
  ctx.fillStyle = "rgba(255,255,255,.2)";
  ctx.fillRect(-w / 2 - 1.5, baseY - h, w + 3, s * .22);
  ctx.fillStyle = ribbonColor;
  ctx.fillRect(-s * .1, baseY - h + s * .22, s * .2, h - s * .22);
  ctx.beginPath();
  ctx.ellipse(-s * .16, baseY - h - s * .08, s * .16, s * .09, -.5, 0, Math.PI * 2);
  ctx.ellipse(s * .16, baseY - h - s * .08, s * .16, s * .09, .5, 0, Math.PI * 2);
  ctx.fill();
}

function drawGift(ctx, gift, x, edgeY) {
  ctx.save();
  ctx.translate(x, edgeY);
  ctx.rotate(gift.tilt);
  const bodyColor = PARTY_COLORS[gift.color];
  const ribbonColor = PARTY_COLORS[gift.ribbon];
  drawGiftBox(ctx, 0, gift.size, bodyColor, ribbonColor);
  if (gift.stacked) drawGiftBox(ctx, -gift.size * .95, gift.size * .55, ribbonColor, bodyColor);
  ctx.restore();
}

function drawPartyCandles(ctx, cluster, x, edgeY, now, reducedMotion) {
  for (let index = 0; index < cluster.count; index += 1) {
    const cx = x + (index - (cluster.count - 1) / 2) * 6;
    const waxHeight = 7 + fract(cluster.seed * (3.7 + index * 1.9)) * 7;
    const color = PARTY_COLORS[Math.floor(fract(cluster.seed * (5.3 + index)) * PARTY_COLORS.length)];
    const flick = reducedMotion ? .8 : .6 + .4 * Math.sin(now / 90 + cluster.seed * 8 + index * 2.1);
    ctx.fillStyle = "#f6f2ff";
    ctx.fillRect(cx - 1.3, edgeY - waxHeight, 2.6, waxHeight);
    ctx.fillStyle = color;
    for (let stripe = 1; stripe < waxHeight; stripe += 3.4) {
      ctx.fillRect(cx - 1.3, edgeY - waxHeight + stripe, 2.6, 1.4);
    }
    ctx.fillStyle = "#3a2c22";
    ctx.fillRect(cx - .4, edgeY - waxHeight - 1.4, .8, 1.4);
    const flameHeight = 3 + 1.6 * flick;
    ctx.fillStyle = `rgba(255,170,60,${(.55 + .35 * flick).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(cx, edgeY - waxHeight - 1.4 - flameHeight / 2, 1.2, flameHeight / 2 + .6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,235,150,.9)";
    ctx.beginPath();
    ctx.ellipse(cx, edgeY - waxHeight - 1.2 - flameHeight * .26, .6, flameHeight * .26 + .3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

const CAKE_BODIES = ["#f7d9ea", "#fbe7f3", "#efd3f2"];

/* Vela con llama parpadeante y halo de luz calida. */
function drawCakeCandle(ctx, cx, baseY, waxHeight, color, now, seed, reducedMotion) {
  ctx.fillStyle = color;
  ctx.fillRect(cx - 1.1, baseY - waxHeight, 2.2, waxHeight);
  ctx.fillStyle = "rgba(255,255,255,.5)";
  ctx.fillRect(cx - 1.1, baseY - waxHeight, .8, waxHeight);
  ctx.fillStyle = "#3a2c22";
  ctx.fillRect(cx - .35, baseY - waxHeight - 1.5, .7, 1.5);
  const flick = reducedMotion ? .8 : .6 + .4 * Math.sin(now / 90 + seed * 8);
  const flameHeight = 3.2 + 1.8 * flick;
  const flameY = baseY - waxHeight - 1.5 - flameHeight / 2;
  const halo = ctx.createRadialGradient(cx, flameY, 0, cx, flameY, 7);
  halo.addColorStop(0, `rgba(255,190,90,${(.2 + .12 * flick).toFixed(3)})`);
  halo.addColorStop(1, "rgba(255,190,90,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, flameY, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255,170,60,${(.6 + .3 * flick).toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(cx, flameY, 1.3, flameHeight / 2 + .5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,240,170,.95)";
  ctx.beginPath();
  ctx.ellipse(cx, flameY + .6, .6, flameHeight * .24, 0, 0, Math.PI * 2);
  ctx.fill();
}

/* Piso de tarta: bizcocho, sombra lateral, glaseado con goterones desiguales
   y confetis de azucar. */
function drawCakeTier(ctx, x, baseY, w, h, body, seed) {
  ctx.fillStyle = body;
  ctx.fillRect(x - w / 2, baseY - h, w, h);
  ctx.fillStyle = "rgba(120,40,80,.16)";
  ctx.fillRect(x + w / 2 - w * .2, baseY - h, w * .2, h);
  ctx.fillStyle = "#fff";
  ctx.fillRect(x - w / 2 - 1, baseY - h, w + 2, h * .24);
  const dripCount = Math.max(3, Math.round(w / 9));
  for (let drip = 0; drip < dripCount; drip += 1) {
    const u = fract(seed * (3.3 + drip * 1.7));
    const dripX = x - w / 2 + ((drip + .5) / dripCount) * w;
    const dripLen = h * (.1 + u * .32);
    ctx.fillRect(dripX - 1.5, baseY - h + h * .24 - 1, 3, dripLen);
    ctx.beginPath();
    ctx.arc(dripX, baseY - h + h * .24 + dripLen - 1, 1.5, 0, Math.PI);
    ctx.fill();
  }
  for (let sprinkle = 0; sprinkle < dripCount + 2; sprinkle += 1) {
    const u = fract(seed * (7.9 + sprinkle * 2.3));
    if (u < .3) continue;
    ctx.fillStyle = PARTY_COLORS[Math.floor(u * 31) % PARTY_COLORS.length];
    ctx.fillRect(x - w / 2 + u * (w - 4) + 2, baseY - h * .52 + fract(u * 13.7) * h * .36, 2, 1.2);
  }
}

/* Tarta de cumpleanos por pisos sobre plato, con velas encendidas arriba. */
function drawCake(ctx, cake, x, edgeY, now, reducedMotion) {
  const s = cake.size;
  ctx.fillStyle = "#cfd8e6";
  ctx.beginPath();
  ctx.ellipse(x, edgeY - 1.2, s * 1.55, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.beginPath();
  ctx.ellipse(x, edgeY - 1.8, s * 1.38, 1.2, 0, 0, Math.PI * 2);
  ctx.fill();

  const tierHeights = [s * .85, s * .66, s * .52];
  let baseY = edgeY - 2.2;
  let w = s * 2.5;
  for (let tier = 0; tier < cake.tiers; tier += 1) {
    drawCakeTier(ctx, x, baseY, w, tierHeights[tier], CAKE_BODIES[(tier + Math.floor(cake.seed)) % CAKE_BODIES.length], cake.seed + tier * 3.7);
    baseY -= tierHeights[tier];
    w *= .68;
  }

  for (let candle = 0; candle < 3; candle += 1) {
    const cx = x + (candle - 1) * w * .34;
    const waxHeight = s * .46 + fract(cake.seed * (2.9 + candle)) * s * .18;
    drawCakeCandle(ctx, cx, baseY, waxHeight, PARTY_COLORS[(candle * 2 + Math.floor(cake.seed)) % PARTY_COLORS.length], now, cake.seed + candle * 2.4, reducedMotion);
  }
}

/* Porcion de tarta en platito: cuna con capas de bizcocho y guinda arriba. */
function drawCakeSlice(ctx, slice, x, edgeY) {
  const s = slice.size;
  const w = s * 1.6;
  const h = s * 1.1;
  ctx.fillStyle = "#cfd8e6";
  ctx.beginPath();
  ctx.ellipse(x, edgeY - 1, s * 1.15, 1.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(x, edgeY - 1.6);
  ctx.rotate(slice.tilt);
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.lineTo(w / 2, 0);
  ctx.lineTo(w / 2, -h);
  ctx.closePath();
  ctx.fillStyle = "#fbe7f3";
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = "#e26fa8";
  ctx.fillRect(-w / 2, -h * .4, w, 1.8);
  ctx.fillRect(-w / 2, -h * .68, w, 1.4);
  ctx.restore();
  // Glaseado siguiendo la hipotenusa.
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-w / 2 - .5, -1);
  ctx.lineTo(w / 2 - .5, -h - 1);
  ctx.stroke();
  // Guinda con brillo en la esquina alta.
  ctx.fillStyle = "#ff4155";
  ctx.beginPath();
  ctx.arc(w / 2 - 1.5, -h - 3, 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.6)";
  ctx.beginPath();
  ctx.arc(w / 2 - 2.2, -h - 3.7, .7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* Magdalena: capsula plisada, remolino de frosting y guinda. */
function drawCupcake(ctx, cup, x, edgeY) {
  const s = cup.size;
  ctx.fillStyle = PARTY_COLORS[cup.wrap];
  ctx.beginPath();
  ctx.moveTo(-s * .8 + x, edgeY - s);
  ctx.lineTo(s * .8 + x, edgeY - s);
  ctx.lineTo(s * .55 + x, edgeY);
  ctx.lineTo(-s * .55 + x, edgeY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.28)";
  ctx.lineWidth = .8;
  ctx.beginPath();
  for (let pleat = -1; pleat <= 1; pleat += 1) {
    ctx.moveTo(x + pleat * s * .32, edgeY - s + 1);
    ctx.lineTo(x + pleat * s * .24, edgeY - 1);
  }
  ctx.stroke();
  ctx.fillStyle = "#fdeef7";
  for (const [dy, r] of [[1.05, .78], [1.5, .56], [1.86, .34]]) {
    ctx.beginPath();
    ctx.arc(x, edgeY - s * dy, s * r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let sprinkle = 0; sprinkle < 5; sprinkle += 1) {
    const u = fract(cup.seed * (5.1 + sprinkle * 1.9));
    ctx.fillStyle = PARTY_COLORS[Math.floor(u * 29) % PARTY_COLORS.length];
    ctx.fillRect(x + (u - .5) * s * 1.1, edgeY - s * (1 + u * .8), 1.6, 1);
  }
  ctx.fillStyle = "#ff4155";
  ctx.beginPath();
  ctx.arc(x, edgeY - s * 2.06, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.6)";
  ctx.beginPath();
  ctx.arc(x - .6, edgeY - s * 2.12, .6, 0, Math.PI * 2);
  ctx.fill();
}

const BirthdayDecorPhysics = createLedgeDecorEngine({
  classPrefix: "birthday-decor",
  hookName: "__daivrBirthday",
  init(env) {
    env.state = { balloons: [], confetti: [], lastPopAt: 0, nextBalloonAt: 0, nextBurstAt: 0, rings: [], spawn: 0 };
  },
  buildDecor(deco, edgeWidth) {
    const seed = deco.seed;
    deco.gifts = [];
    if (edgeWidth > 260 && fract(seed * 5.19) < .6) {
      const count = 1 + (fract(seed * 9.87) < .35 ? 1 : 0);
      for (let index = 0; index < count; index += 1) {
        const color = Math.floor(fract(seed * (7.61 + index)) * PARTY_COLORS.length);
        deco.gifts.push({
          color,
          ribbon: (color + 1 + Math.floor(fract(seed * (11.3 + index)) * 3)) % PARTY_COLORS.length,
          size: 10 + 8 * fract(seed * (3.29 + index * 2.3)),
          stacked: fract(seed * (8.77 + index)) < .35,
          tilt: (fract(seed * (4.99 + index)) - .5) * .14,
          x01: .12 + .74 * fract(seed * (6.43 + index * 3.7))
        });
      }
    }
    deco.candles = edgeWidth > 240 && fract(seed * 13.37) < .5
      ? { count: 2 + Math.floor(fract(seed * 3.91) * 3), seed: fract(seed * 7.13) * 10, x01: .1 + .78 * fract(seed * 9.29) }
      : null;
    // Tartas por todas partes: los paneles medios ya califican, y las anchas
    // pueden venir con tres pisos.
    deco.cake = edgeWidth > 340 && fract(seed * 15.73) < .45
      ? {
        seed: fract(seed * 4.51) * 10,
        size: Math.min(14 + 7 * fract(seed * 6.67), edgeWidth * .045),
        tiers: 2 + (edgeWidth > 480 && fract(seed * 9.19) < .45 ? 1 : 0),
        x01: .22 + .56 * fract(seed * 2.87)
      }
      : null;
    deco.slice = !deco.cake && edgeWidth > 200 && fract(seed * 25.3) < .4
      ? {
        size: 8 + 4 * fract(seed * 12.43),
        tilt: (fract(seed * 14.7) - .5) * .14,
        x01: .14 + .7 * fract(seed * 10.61)
      }
      : null;
    deco.cupcake = edgeWidth > 170 && fract(seed * 27.9) < .32
      ? {
        seed: fract(seed * 5.87) * 10,
        size: 6.5 + 3 * fract(seed * 16.91),
        wrap: Math.floor(fract(seed * 18.23) * PARTY_COLORS.length),
        x01: .1 + .8 * fract(seed * 20.51)
      }
      : null;
  },
  update(env, now, delta) {
    if (env.reducedMotion) return;
    const state = env.state;
    const cap = env.width < 700 ? 46 : 90;

    function spawnConfetti(x, y, burstSpeed) {
      if (state.confetti.length >= cap + 40) return;
      const angle = Math.random() * Math.PI * 2;
      const speed = burstSpeed ? burstSpeed * (.4 + Math.random() * .6) : 0;
      const roll = Math.random();
      state.confetti.push({
        color: Math.floor(Math.random() * PARTY_COLORS.length),
        flutterA: 14 + Math.random() * 26,
        flutterW: 2 + Math.random() * 2.5,
        h: 2 + Math.random() * 1.5,
        len: 8 + Math.random() * 8,
        phase: Math.random() * Math.PI * 2,
        rot: Math.random() * Math.PI * 2,
        shape: roll < .18 ? "streamer" : roll < .5 ? "circle" : "rect",
        spin: (Math.random() - .5) * 9,
        vx: Math.cos(angle) * speed,
        vy: burstSpeed ? Math.sin(angle) * speed - burstSpeed * .3 : 20 + Math.random() * 40,
        w: 3 + Math.random() * 3,
        x,
        y
      });
    }

    state.spawn += delta * (env.width < 700 ? 3.5 : 6);
    while (state.spawn >= 1) {
      state.spawn -= 1;
      if (state.confetti.length < cap) spawnConfetti(Math.random() * env.width, -12, 0);
    }
    // Reventones de petardo desde puntos altos aleatorios.
    if (now >= state.nextBurstAt) {
      state.nextBurstAt = now + 7000 + Math.random() * 8000;
      const burstX = env.width * (.15 + Math.random() * .7);
      const burstY = env.height * (.08 + Math.random() * .3);
      for (let piece = 0; piece < 26; piece += 1) spawnConfetti(burstX, burstY, 200);
      state.rings.push({ life: .4, max: .4, x: burstX, y: burstY });
    }
    // Pop de confeti al barrer rapido con el cursor.
    if (env.pointer.speed > 520 && now - state.lastPopAt > 700) {
      state.lastPopAt = now;
      for (let piece = 0; piece < 10; piece += 1) spawnConfetti(env.pointer.x, env.pointer.y, 130);
      state.rings.push({ life: .3, max: .3, x: env.pointer.x, y: env.pointer.y });
    }
    if (now >= state.nextBalloonAt) {
      state.nextBalloonAt = now + 14000 + Math.random() * 12000;
      const balloonCount = 1 + Math.floor(Math.random() * 3);
      for (let balloon = 0; balloon < balloonCount; balloon += 1) {
        state.balloons.push({
          color: Math.floor(Math.random() * PARTY_COLORS.length),
          phase: Math.random() * Math.PI * 2,
          size: 12 + Math.random() * 5,
          vy: -26 - Math.random() * 14,
          x: env.width * (.08 + Math.random() * .84),
          y: env.height + 40 + balloon * 30
        });
      }
    }

    const t = now / 1000;
    for (let index = state.confetti.length - 1; index >= 0; index -= 1) {
      const piece = state.confetti[index];
      piece.vy += (55 - piece.vy) * Math.min(1, delta * 1.4);
      piece.vx *= Math.max(0, 1 - delta * 1.1);
      piece.x += (piece.vx + Math.cos(t * piece.flutterW + piece.phase) * piece.flutterA) * delta;
      piece.y += piece.vy * delta;
      piece.rot += piece.spin * delta;
      if (piece.y > env.height + 24 || piece.x < -50 || piece.x > env.width + 50) state.confetti.splice(index, 1);
    }
    for (let index = state.balloons.length - 1; index >= 0; index -= 1) {
      const balloon = state.balloons[index];
      balloon.y += balloon.vy * delta;
      balloon.x += Math.sin(t * .8 + balloon.phase) * 14 * delta;
      if (balloon.y < -90) state.balloons.splice(index, 1);
    }
    for (let index = state.rings.length - 1; index >= 0; index -= 1) {
      state.rings[index].life -= delta;
      if (state.rings[index].life <= 0) state.rings.splice(index, 1);
    }
  },
  drawSurface(ctx, surface, now, ox, oy, env) {
    const deco = surface.deco;
    if (deco.cake) drawCake(ctx, deco.cake, surface.left + deco.cake.x01 * surface.width + ox, surface.top + oy, now, env.reducedMotion);
    for (const gift of deco.gifts) drawGift(ctx, gift, surface.left + gift.x01 * surface.width + ox, surface.top + oy);
    if (deco.slice) drawCakeSlice(ctx, deco.slice, surface.left + deco.slice.x01 * surface.width + ox, surface.top + oy);
    if (deco.cupcake) drawCupcake(ctx, deco.cupcake, surface.left + deco.cupcake.x01 * surface.width + ox, surface.top + oy);
    if (deco.candles) drawPartyCandles(ctx, deco.candles, surface.left + deco.candles.x01 * surface.width + ox, surface.top + oy, now, env.reducedMotion);
  },
  drawAir(ctx, now, env) {
    if (env.reducedMotion) return;
    const state = env.state;
    const t = now / 1000;
    // Globos por detras del confeti.
    for (const balloon of state.balloons) {
      const color = PARTY_COLORS[balloon.color];
      ctx.globalAlpha = .85;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(balloon.x, balloon.y, balloon.size * .62, balloon.size * .78, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.4)";
      ctx.beginPath();
      ctx.ellipse(balloon.x - balloon.size * .2, balloon.y - balloon.size * .26, balloon.size * .16, balloon.size * .22, -.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(balloon.x, balloon.y + balloon.size * .74);
      ctx.lineTo(balloon.x - 2.4, balloon.y + balloon.size * .74 + 4);
      ctx.lineTo(balloon.x + 2.4, balloon.y + balloon.size * .74 + 4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.35)";
      ctx.lineWidth = .8;
      ctx.beginPath();
      ctx.moveTo(balloon.x, balloon.y + balloon.size * .74 + 4);
      const sway = Math.sin(t * 1.6 + balloon.phase) * 5;
      ctx.quadraticCurveTo(balloon.x + sway, balloon.y + balloon.size * .74 + 18, balloon.x + sway * .4, balloon.y + balloon.size * .74 + 32);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // Confeti.
    for (const piece of state.confetti) {
      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate(piece.rot);
      ctx.globalAlpha = .85;
      ctx.fillStyle = PARTY_COLORS[piece.color];
      if (piece.shape === "rect") {
        ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
      } else if (piece.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, piece.w * .45, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = PARTY_COLORS[piece.color];
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, -piece.len / 2);
        ctx.quadraticCurveTo(3 * Math.sin(t * 6 + piece.phase), 0, 0, piece.len / 2);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    // Anillos de reventon.
    ctx.lineWidth = 1.4;
    for (const ring of state.rings) {
      const fade = ring.life / ring.max;
      ctx.globalAlpha = fade * .7;
      ctx.strokeStyle = "#fff";
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, 8 + (1 - fade) * 34, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },
  summary(env) {
    return {
      balloons: env.state.balloons.length,
      confetti: env.state.confetti.length,
      surfaces: env.surfaces.map((surface) => ({
        anchored: surface.deco.anchored,
        cake: !!surface.deco.cake,
        candles: !!surface.deco.candles,
        cupcake: !!surface.deco.cupcake,
        gifts: surface.deco.gifts.length,
        slice: !!surface.deco.slice,
        tag: surface.element.className.split(" ")[0],
        top: Math.round(surface.top)
      }))
    };
  }
});

/* ---- Aniversario: espectaculo de fuegos y guirnaldas --------------------
   Cohetes con fisica real que estallan en peonia, anillo, estrella o sauce
   dorado — y de vez en cuando un cohete especial dibuja "02" en el cielo con
   chispas doradas. Banderines, trofeos, serpentinas y botellas de champan que
   descorchan solas en las repisas. Un barrido rapido lanza un cohete. */

/* Muestrea "02" sobre un lienzo fuera de pantalla y devuelve offsets de pixel
   encendido centrados en el origen: los objetivos de las chispas del cohete
   conmemorativo. */
function sampleShapePoints(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 56;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  ctx.font = "900 44px 'Arial Black',Arial,sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 48, 30);
  const data = ctx.getImageData(0, 0, 96, 56).data;
  const points = [];
  for (let py = 0; py < 56; py += 3) {
    for (let px = 0; px < 96; px += 3) {
      if (data[(py * 96 + px) * 4 + 3] > 128) {
        points.push({ x: (px - 48) * 2.1, y: (py - 30) * 2.1 });
      }
    }
  }
  return points;
}

function drawChampagne(ctx, bottle, x, edgeY, now, reducedMotion) {
  const s = bottle.size;
  ctx.save();
  ctx.translate(x, edgeY);
  // Cuerpo verde botella con hombros, cuello y capuchon dorado.
  ctx.fillStyle = "#173f2a";
  ctx.beginPath();
  ctx.moveTo(-s * .32, 0);
  ctx.lineTo(-s * .32, -s * .78);
  ctx.quadraticCurveTo(-s * .3, -s * 1.02, -s * .09, -s * 1.12);
  ctx.lineTo(-s * .09, -s * 1.34);
  ctx.lineTo(s * .09, -s * 1.34);
  ctx.lineTo(s * .09, -s * 1.12);
  ctx.quadraticCurveTo(s * .3, -s * 1.02, s * .32, -s * .78);
  ctx.lineTo(s * .32, 0);
  ctx.closePath();
  ctx.fill();
  // Brillo del cristal.
  ctx.fillStyle = "rgba(190,255,215,.3)";
  ctx.fillRect(-s * .22, -s * .95, s * .09, s * .84);
  // Etiqueta.
  ctx.fillStyle = "#f3e9d0";
  ctx.fillRect(-s * .24, -s * .62, s * .48, s * .3);
  ctx.fillStyle = "#a8842e";
  ctx.fillRect(-s * .24, -s * .52, s * .48, s * .05);
  // Boca abierta tras el descorche; capuchon dorado mientras siga cerrada.
  if (now < bottle.poppedUntil) {
    ctx.fillStyle = "#0c2418";
    ctx.fillRect(-s * .09, -s * 1.36, s * .18, s * .06);
  } else {
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(-s * .11, -s * 1.44, s * .22, s * .12);
    ctx.fillStyle = "rgba(255,255,255,.35)";
    ctx.fillRect(-s * .11, -s * 1.44, s * .07, s * .12);
  }
  // Burbujitas saliendo de la boca tras el descorche.
  if (!reducedMotion && now < bottle.foamUntil) {
    const age = 1 - (bottle.foamUntil - now) / 900;
    ctx.fillStyle = "rgba(255,250,220,.8)";
    for (let bubble = 0; bubble < 5; bubble += 1) {
      const u = fract(bottle.seed * (3.1 + bubble * 1.7));
      const rise = age * (14 + u * 16) + bubble * 2;
      ctx.globalAlpha = Math.max(0, .8 - age * .8);
      ctx.beginPath();
      ctx.arc((u - .5) * 8, -s * 1.4 - rise, .9 + u, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawBunting(ctx, bunting, surface, now, ox, oy, reducedMotion) {
  const t = now / 1000;
  const left = surface.left + ox;
  const topY = surface.top + oy + 2;
  const w = surface.width;
  ctx.strokeStyle = "rgba(255,240,220,.5)";
  ctx.lineWidth = 1;
  for (let segment = 0; segment < bunting.segments; segment += 1) {
    const x0 = left + w * (.055 + (segment * .89) / bunting.segments);
    const x1 = left + w * (.055 + ((segment + 1) * .89) / bunting.segments);
    const sag = bunting.sag * (1 + (reducedMotion ? 0 : Math.sin(t * .7 + bunting.seed + segment) * .08));
    const controlX = (x0 + x1) / 2 + (reducedMotion ? 0 : Math.sin(t * .5 + bunting.seed * 2 + segment) * 3);
    const controlY = topY + sag * 2;
    ctx.beginPath();
    ctx.moveTo(x0, topY);
    ctx.quadraticCurveTo(controlX, controlY, x1, topY);
    ctx.stroke();
    for (let flag = 1; flag <= bunting.perSegment; flag += 1) {
      const tt = flag / (bunting.perSegment + 1);
      const qx = (1 - tt) * (1 - tt) * x0 + 2 * (1 - tt) * tt * controlX + tt * tt * x1;
      const qy = (1 - tt) * (1 - tt) * topY + 2 * (1 - tt) * tt * controlY + tt * tt * topY;
      const lean = reducedMotion ? 0 : Math.sin(t * 1.4 + bunting.seed * 3 + flag * 1.1 + segment * 2) * 1.6;
      const size = bunting.flagSize;
      ctx.fillStyle = PARTY_COLORS[(flag + segment * 2 + bunting.colorOffset) % PARTY_COLORS.length];
      ctx.beginPath();
      ctx.moveTo(qx - size * .5, qy);
      ctx.lineTo(qx + size * .5, qy);
      ctx.lineTo(qx + lean * .4, qy + size * 1.15);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawTrophy(ctx, trophy, x, edgeY) {
  const s = trophy.size;
  ctx.fillStyle = "#ffd166";
  ctx.fillRect(x - s * .32, edgeY - s * .12, s * .64, s * .12);
  ctx.fillRect(x - s * .2, edgeY - s * .26, s * .4, s * .14);
  ctx.fillRect(x - s * .06, edgeY - s * .44, s * .12, s * .2);
  ctx.beginPath();
  ctx.moveTo(x - s * .34, edgeY - s);
  ctx.lineTo(x + s * .34, edgeY - s);
  ctx.lineTo(x + s * .2, edgeY - s * .44);
  ctx.lineTo(x - s * .2, edgeY - s * .44);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x - s * .4, edgeY - s * .82, s * .15, Math.PI * .5, Math.PI * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + s * .4, edgeY - s * .82, s * .15, -Math.PI * .5, Math.PI * .5);
  ctx.stroke();
  // sombra, brillo y placa del 02
  ctx.fillStyle = "rgba(0,0,0,.18)";
  ctx.fillRect(x + s * .08, edgeY - s * .98, s * .12, s * .5);
  ctx.fillStyle = "rgba(255,255,255,.5)";
  ctx.fillRect(x - s * .18, edgeY - s * .94, s * .07, s * .38);
  ctx.fillStyle = "#7a5a10";
  ctx.fillRect(x - s * .11, edgeY - s * .8, s * .22, s * .18);
}

function drawStreamer(ctx, streamer, x, topY, now, reducedMotion) {
  const t = reducedMotion ? 0 : now / 1000;
  ctx.strokeStyle = PARTY_COLORS[streamer.color];
  ctx.globalAlpha = .8;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x, topY);
  for (let along = 2; along <= streamer.length; along += 2) {
    ctx.lineTo(x + Math.sin(along * .42 + t * 1.8 + streamer.seed) * (3 + along * .06), topY + along);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

const AnniversaryDecorPhysics = createLedgeDecorEngine({
  classPrefix: "anniversary-decor",
  hookName: "__daivrAnniversary",
  init(env) {
    env.state = {
      corks: [],
      lastAimAt: 0,
      nextLaunchAt: 0,
      nextShapeAt: 0,
      rings: [],
      rockets: [],
      shapePoints: sampleShapePoints("02"),
      shapeSparks: [],
      sparks: []
    };
  },
  buildDecor(deco, edgeWidth) {
    const seed = deco.seed;
    deco.bottle = edgeWidth > 420 && fract(seed * 19.87) < .32
      ? {
        foamUntil: 0,
        nextPopAt: 0,
        poppedUntil: 0,
        seed: fract(seed * 8.11) * 10,
        size: 17 + 5 * fract(seed * 12.53),
        x01: .12 + .76 * fract(seed * 16.37)
      }
      : null;
    deco.bunting = edgeWidth > 380 && fract(seed * 6.71) < .6
      ? {
        colorOffset: Math.floor(fract(seed * 9.1) * PARTY_COLORS.length),
        flagSize: 7 + 3 * fract(seed * 3.77),
        perSegment: 5 + Math.floor(fract(seed * 5.13) * 3),
        sag: 10 + 8 * fract(seed * 7.99),
        seed: fract(seed * 2.31) * 10,
        segments: edgeWidth > 760 ? 2 : 1
      }
      : null;
    deco.trophy = edgeWidth > 300 && fract(seed * 11.83) < .3
      ? { size: 15 + 6 * fract(seed * 4.57), x01: .14 + .72 * fract(seed * 8.29) }
      : null;
    deco.streamers = [];
    for (const corner of ["tl", "tr"]) {
      if (fract(seed * (corner === "tl" ? 13.7 : 15.9)) < .38) {
        deco.streamers.push({
          color: Math.floor(fract(seed * (corner === "tl" ? 4.1 : 6.3)) * PARTY_COLORS.length),
          corner,
          length: 24 + 18 * fract(seed * (corner === "tl" ? 7.7 : 9.3)),
          seed: fract(seed * 3.9) * 10
        });
      }
    }
  },
  update(env, now, delta) {
    if (env.reducedMotion) return;
    const state = env.state;
    const sparkCap = env.width < 700 ? 200 : 380;

    function explodeShape(x, y) {
      // Cohete conmemorativo: las chispas nacen en el centro y convergen en
      // los pixeles de "02", aguantan un instante titilando y caen apagandose.
      for (const point of state.shapePoints) {
        if (state.shapeSparks.length >= 220) break;
        state.shapeSparks.push({
          born: now,
          jitter: Math.random() * Math.PI * 2,
          life: 2.5 + Math.random() * .5,
          tx: point.x,
          ty: point.y,
          x,
          y
        });
      }
      state.rings.push({ color: "#ffd166", life: .6, max: .6, x, y });
    }

    function explode(x, y, color, shape) {
      if (shape && state.shapePoints.length) {
        explodeShape(x, y);
        return;
      }
      const roll = Math.random();
      const type = roll < .45 ? "peony" : roll < .65 ? "ring" : roll < .85 ? "star" : "willow";
      const count = type === "peony" ? 46 + Math.floor(Math.random() * 18) : type === "ring" ? 36 : type === "star" ? 50 : 30;
      const spin = Math.random() * Math.PI * 2;
      for (let piece = 0; piece < count; piece += 1) {
        if (state.sparks.length >= sparkCap) break;
        const angle = type === "ring" || type === "star" ? (piece / count) * Math.PI * 2 : Math.random() * Math.PI * 2;
        // Estrella de cinco puntas: el radio ondula entre punta y valle.
        const starReach = type === "star" ? .45 + .55 * Math.abs(Math.cos((angle + spin) * 2.5)) : 1;
        const speed = type === "peony" ? 55 + Math.random() * 135 : type === "ring" ? 145 + Math.random() * 14 : type === "star" ? 150 * starReach + Math.random() * 10 : 35 + Math.random() * 60;
        const life = type === "willow" ? 2 + Math.random() * .9 : 1 + Math.random() * .7;
        state.sparks.push({
          color: type === "willow" ? "#ffd166" : type === "star" ? (Math.random() < .5 ? "#ffd166" : "#fff") : Math.random() < .18 ? "#ffffff" : color,
          drag: type === "willow" ? 1.6 : 1.1,
          gravity: type === "willow" ? 120 : type === "ring" || type === "star" ? 55 : 85,
          life,
          max: life,
          twinkle: Math.random() < (type === "star" ? .5 : .3),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          x,
          y
        });
      }
      state.rings.push({ color, life: .5, max: .5, x, y });
    }

    function launch(targetX, targetY, shape = false) {
      if (state.rockets.length >= 6) return;
      const startX = Math.max(30, Math.min(env.width - 30, targetX + (Math.random() - .5) * 120));
      state.rockets.push({
        color: PARTY_COLORS[Math.floor(Math.random() * PARTY_COLORS.length)],
        explodeY: Math.max(80, targetY),
        shape,
        vx: (targetX - startX) * .5,
        vy: -(300 + Math.random() * 120),
        x: startX,
        y: env.height + 12
      });
    }

    if (now >= state.nextLaunchAt) {
      state.nextLaunchAt = now + 2400 + Math.random() * 3600;
      const volley = Math.random() < .22 ? 3 : 1;
      for (let shot = 0; shot < volley; shot += 1) {
        launch(env.width * (.12 + Math.random() * .76), env.height * (.14 + Math.random() * .3));
      }
    }
    // Cohete "02": el fuego artificial conmemorativo, cada cierto tiempo.
    if (!state.nextShapeAt) state.nextShapeAt = now + 11000 + Math.random() * 8000;
    if (now >= state.nextShapeAt) {
      state.nextShapeAt = now + 17000 + Math.random() * 9000;
      launch(env.width * (.3 + Math.random() * .4), env.height * (.16 + Math.random() * .14), true);
    }
    // El publico dirige: un barrido rapido lanza un cohete hacia el cursor.
    if (env.pointer.speed > 520 && now - state.lastAimAt > 900) {
      state.lastAimAt = now;
      launch(env.pointer.x, Math.max(90, env.pointer.y));
    }

    // Botellas de champan en repisas: descorche programado con corcho volador.
    for (const surface of env.surfaces) {
      const bottle = surface.deco.bottle;
      if (!bottle) continue;
      if (!bottle.nextPopAt) bottle.nextPopAt = now + 5000 + fract(bottle.seed * 3.3) * 9000;
      if (now >= bottle.nextPopAt) {
        bottle.nextPopAt = now + 16000 + Math.random() * 15000;
        bottle.poppedUntil = now + 7000;
        bottle.foamUntil = now + 900;
        const mouthX = surface.left + bottle.x01 * surface.width;
        const mouthY = surface.top - bottle.size * 1.44;
        state.corks.push({
          rotation: Math.random() * Math.PI,
          spin: 6 + Math.random() * 6,
          vx: (Math.random() - .5) * 90,
          vy: -(190 + Math.random() * 90),
          x: mouthX,
          y: mouthY
        });
        for (let foam = 0; foam < 8; foam += 1) {
          if (state.sparks.length >= sparkCap) break;
          state.sparks.push({
            color: "#fff6da",
            drag: 1.8,
            gravity: 150,
            life: .5 + Math.random() * .4,
            max: .9,
            twinkle: true,
            vx: (Math.random() - .5) * 70,
            vy: -(60 + Math.random() * 110),
            x: mouthX,
            y: mouthY
          });
        }
        state.rings.push({ color: "#ffd166", life: .3, max: .3, x: mouthX, y: mouthY });
      }
    }

    for (let index = state.corks.length - 1; index >= 0; index -= 1) {
      const cork = state.corks[index];
      cork.vy += 420 * delta;
      cork.x += cork.vx * delta;
      cork.y += cork.vy * delta;
      cork.rotation += cork.spin * delta;
      if (cork.y > env.height + 30 || cork.x < -40 || cork.x > env.width + 40) state.corks.splice(index, 1);
    }

    for (let index = state.rockets.length - 1; index >= 0; index -= 1) {
      const rocket = state.rockets[index];
      rocket.vy += 55 * delta;
      rocket.x += rocket.vx * delta;
      rocket.y += rocket.vy * delta;
      if (state.sparks.length < sparkCap) {
        state.sparks.push({
          color: rocket.shape ? "rgba(255,209,102,1)" : "rgba(255,220,160,1)",
          drag: 2,
          gravity: 30,
          life: .3,
          max: .3,
          twinkle: false,
          vx: (Math.random() - .5) * 16,
          vy: 26,
          x: rocket.x,
          y: rocket.y
        });
      }
      if (rocket.y <= rocket.explodeY || rocket.vy > -46) {
        explode(rocket.x, rocket.y, rocket.color, rocket.shape);
        state.rockets.splice(index, 1);
      }
    }

    for (let index = state.shapeSparks.length - 1; index >= 0; index -= 1) {
      const spark = state.shapeSparks[index];
      if ((now - spark.born) / 1000 > spark.life) state.shapeSparks.splice(index, 1);
    }
    for (let index = state.sparks.length - 1; index >= 0; index -= 1) {
      const spark = state.sparks[index];
      spark.vx *= Math.max(0, 1 - spark.drag * delta);
      spark.vy = spark.vy * Math.max(0, 1 - spark.drag * delta) + spark.gravity * delta;
      spark.x += spark.vx * delta;
      spark.y += spark.vy * delta;
      spark.life -= delta;
      if (spark.life <= 0 || spark.y > env.height + 20) state.sparks.splice(index, 1);
    }
    for (let index = state.rings.length - 1; index >= 0; index -= 1) {
      state.rings[index].life -= delta;
      if (state.rings[index].life <= 0) state.rings.splice(index, 1);
    }
  },
  drawSurface(ctx, surface, now, ox, oy, env) {
    const deco = surface.deco;
    if (deco.bunting) drawBunting(ctx, deco.bunting, surface, now, ox, oy, env.reducedMotion);
    for (const streamer of deco.streamers) {
      drawStreamer(ctx, streamer, (streamer.corner === "tl" ? surface.left + 6 : surface.right - 6) + ox, surface.top + oy + 2, now, env.reducedMotion);
    }
    if (deco.trophy) drawTrophy(ctx, deco.trophy, surface.left + deco.trophy.x01 * surface.width + ox, surface.top + oy);
    if (deco.bottle) drawChampagne(ctx, deco.bottle, surface.left + deco.bottle.x01 * surface.width + ox, surface.top + oy, now, env.reducedMotion);
  },
  drawAir(ctx, now, env) {
    if (env.reducedMotion) return;
    const state = env.state;
    // Fogonazos: resplandor de cielo + onda expansiva.
    for (const ring of state.rings) {
      const fade = ring.life / ring.max;
      ctx.globalAlpha = fade * .12;
      ctx.fillStyle = ring.color;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, 60 * (1.4 - fade), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = fade * .7;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, 10 + (1 - fade) * 46, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Chispas como trazos con estela y titileo.
    ctx.lineWidth = 1.4;
    for (const spark of state.sparks) {
      const fade = Math.max(0, spark.life / spark.max);
      const flicker = spark.twinkle ? .5 + .5 * Math.sin(now / 40 + spark.x) : 1;
      ctx.globalAlpha = fade * flicker * .95;
      ctx.strokeStyle = spark.color;
      ctx.beginPath();
      ctx.moveTo(spark.x - spark.vx * .04, spark.y - spark.vy * .04);
      ctx.lineTo(spark.x, spark.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // Chispas "02": convergen hacia su pixel, titilan doradas y caen al morir.
    for (const spark of state.shapeSparks) {
      const age = (now - spark.born) / 1000;
      const ease = 1 - (1 - Math.min(1, age / .55)) ** 3;
      const hold = Math.max(0, age - 1.4);
      const px = spark.x + spark.tx * ease + Math.sin(now / 140 + spark.jitter) * 1.3;
      const py = spark.y + spark.ty * ease + hold * hold * 34 + Math.sin(now / 170 + spark.jitter * 2) * 1.1;
      const fade = Math.max(0, 1 - age / spark.life);
      ctx.globalAlpha = fade * (.55 + .45 * Math.sin(now / 55 + spark.jitter * 9));
      ctx.fillStyle = age < .5 ? "#fff" : "#ffd166";
      ctx.fillRect(px - 1.1, py - 1.1, 2.2, 2.2);
    }
    ctx.globalAlpha = 1;
    // Corchos volando con su cincho.
    for (const cork of state.corks) {
      ctx.save();
      ctx.translate(cork.x, cork.y);
      ctx.rotate(cork.rotation);
      ctx.fillStyle = "#c98f4e";
      ctx.fillRect(-2.4, -3.5, 4.8, 7);
      ctx.fillStyle = "#8a5a26";
      ctx.fillRect(-2.4, -.6, 4.8, 1.2);
      ctx.restore();
    }
    for (const rocket of state.rockets) {
      ctx.strokeStyle = rocket.shape ? "rgba(255,215,120,.95)" : "rgba(255,236,190,.95)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rocket.x - rocket.vx * .03, rocket.y - rocket.vy * .03);
      ctx.lineTo(rocket.x, rocket.y);
      ctx.stroke();
    }
  },
  summary(env) {
    return {
      corks: env.state.corks.length,
      rockets: env.state.rockets.length,
      shapePoints: env.state.shapePoints.length,
      shapeSparks: env.state.shapeSparks.length,
      sparks: env.state.sparks.length,
      surfaces: env.surfaces.map((surface) => ({
        anchored: surface.deco.anchored,
        bottle: !!surface.deco.bottle,
        bunting: !!surface.deco.bunting,
        streamers: surface.deco.streamers.length,
        tag: surface.element.className.split(" ")[0],
        top: Math.round(surface.top),
        trophy: !!surface.deco.trophy
      }))
    };
  }
});

function BirthdayScene() {
  return (
    <div className="seasonal-birthday-scene">
      <div className="seasonal-party-lights">{Array.from({ length: 14 }, (_, index) => <i key={index} style={{ "--bulb": index }} />)}</div>
      <div className="seasonal-balloons">{Array.from({ length: 3 }, (_, index) => <i key={index} style={{ "--balloon": index }} />)}</div>
      <div className="seasonal-birthday-watermark"><span>24</span><b>DAI DAY</b></div>
      {/* Tarta de neon al fondo: dos pisos y tres velas con llama viva. */}
      <div className="seasonal-scene-cake"><i /><i /><i /><i /><i /></div>
      <div className="seasonal-party-beam beam-a" /><div className="seasonal-party-beam beam-b" />
    </div>
  );
}

function AnniversaryScene() {
  return (
    <div className="seasonal-anniversary-scene">
      <div className="seasonal-fireworks">
        {Array.from({ length: 5 }, (_, burst) => (
          <span key={burst} style={{ "--burst": burst }}>
            {Array.from({ length: 10 }, (_, ray) => <i key={ray} style={{ "--ray": ray }} />)}
          </span>
        ))}
      </div>
      {/* Numeral gigante de fondo + focos dorados barriendo el escenario. */}
      <span className="seasonal-anniversary-watermark">02</span>
      <div className="seasonal-party-beam anniv-beam-a" /><div className="seasonal-party-beam anniv-beam-b" />
      <div className="seasonal-anniversary-mark"><i className="anniversary-mark-halo" /><strong>V2</strong><span>JUL 02</span></div>
      <div className="seasonal-anniversary-grid"><span>BUILD</span><b>02</b><em>ONLINE</em></div>
    </div>
  );
}

function AprilScene() {
  return (
    <div className="seasonal-april-scene">
      {/* Ventana DaiOS con reloj de arena y progreso que nunca termina. */}
      <div className="seasonal-april-window">
        <i /><i /><i /><i />
        <span className="april-hourglass" />
        <div className="april-window-progress"><span /></div>
      </div>
      {/* Dialogos de error fantasma que aparecen y se esfuman en bucle. */}
      {APRIL_DIALOGS.map(([title, body, action], index) => (
        <div className="seasonal-april-dialog" key={title} style={{ "--dialog": index }}>
          <header>{title}<i>×</i></header>
          <p>{body}</p>
          <span>{action}</span>
        </div>
      ))}
    </div>
  );
}

export function SeasonalEvent({ event, entrySplashOpen }) {
  const [updateDismissed, setUpdateDismissed] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(7);
  const [cancelDodge, setCancelDodge] = useState({ x: 0, y: 0 });
  const [loopFlash, setLoopFlash] = useState(false);
  const prevProgressRef = useRef(7);
  const particleCount = event === "winter" ? 0 : event === "birthday" ? 34 : 26;
  const particleField = useMemo(() => makeParticles(particleCount, event), [event, particleCount]);
  const updateMessage = UPDATE_MESSAGES.reduce((message, [threshold, next]) => updateProgress >= threshold ? next : message, UPDATE_MESSAGES[0][1]);

  useEffect(() => {
    setUpdateDismissed(false);
    setUpdateProgress(7);
    setCancelDodge({ x: 0, y: 0 });
  }, [event]);

  // Cuando el progreso "llega" a 99 y vuelve a empezar, la tarjeta se
  // sacude un instante: el update fingido finge tambien sus recaidas.
  useEffect(() => {
    const dropped = updateProgress < prevProgressRef.current;
    prevProgressRef.current = updateProgress;
    if (!dropped) return undefined;
    setLoopFlash(true);
    const timer = window.setTimeout(() => setLoopFlash(false), 650);
    return () => window.clearTimeout(timer);
  }, [updateProgress]);

  // El boton de cancelar es pura decoracion: esquiva el cursor por siempre.
  function dodgeCancel() {
    setCancelDodge({
      x: Math.round((Math.random() - .5) * 240),
      y: Math.round((Math.random() - .5) * 130)
    });
  }

  useEffect(() => {
    if (event !== "april-fools" || entrySplashOpen || updateDismissed) return undefined;
    const interval = window.setInterval(() => {
      setUpdateProgress((value) => value >= 99 ? 7 : Math.min(99, value + Math.ceil(Math.random() * 4)));
    }, 1050);
    return () => window.clearInterval(interval);
  }, [entrySplashOpen, event, updateDismissed]);

  if (!event) return null;

  return (
    <>
      <div className={`seasonal-world seasonal-${event}`} aria-hidden="true">
        <div className="seasonal-particles">{particleField}</div>
        {event === "halloween" ? <HalloweenScene /> : null}
        {event === "winter" ? <WinterScene /> : null}
        {event === "birthday" ? <BirthdayScene /> : null}
        {event === "anniversary" ? <AnniversaryScene /> : null}
        {event === "april-fools" ? <AprilScene /> : null}
      </div>
      <WinterSnowPhysics active={event === "winter" && !entrySplashOpen} />
      <HalloweenDecorPhysics active={event === "halloween" && !entrySplashOpen} />
      <AprilDecorPhysics active={event === "april-fools" && !entrySplashOpen} />
      <BirthdayDecorPhysics active={event === "birthday" && !entrySplashOpen} />
      <AnniversaryDecorPhysics active={event === "anniversary" && !entrySplashOpen} />

      {event === "april-fools" && !entrySplashOpen && !updateDismissed ? (
        <div className={`seasonal-update-takeover update-phase-${Math.floor(updateProgress / 20)}`} role="dialog" aria-modal="true" aria-labelledby="seasonal-update-title">
          <div className="seasonal-update-noise" aria-hidden="true" />
          <span className="update-hourglass" aria-hidden="true">⌛</span>
          <div className={`seasonal-update-card ${loopFlash ? "is-looping" : ""}`}>
            <div className="seasonal-update-spinner" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
            <h2 id="seasonal-update-title">Working on updates<sup>*</sup></h2>
            <p>{updateProgress}% complete</p>
            <strong>{updateMessage}</strong>
            <div className="seasonal-update-progress"><span style={{ width: `${updateProgress}%` }} /></div>
            <small>Please do not turn off your arcade cabinet. <b>*Not really.</b></small>
            <div className="seasonal-update-actions">
              <button
                type="button"
                className="seasonal-update-cancel"
                aria-hidden="true"
                tabIndex={-1}
                style={{ transform: `translate(${cancelDodge.x}px, ${cancelDodge.y}px)` }}
                onPointerEnter={dodgeCancel}
                onClick={dodgeCancel}
              >
                Cancel update
              </button>
              <button type="button" onClick={() => setUpdateDismissed(true)}>Fine, let me in</button>
            </div>
            <em>APRIL_FOOLS.EXE // the cancel button has logged 0 successful clicks</em>
          </div>
        </div>
      ) : null}
    </>
  );
}
