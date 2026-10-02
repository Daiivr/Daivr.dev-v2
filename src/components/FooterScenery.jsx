import { useEffect, useRef } from "react";
import { gustDelay, PLANT_SWAY } from "../lib/footerPlants";

// El bosque, de atras hacia delante, todo con el mismo pixel art dibujado a
// mano: pinos y arboles redondos (WoodlandTree) y matas (WoodlandBush).
// `depth`: back (fila lejana, pequeña y oscura), far, near, ground (matas).
// `flip` lo voltea para que no parezcan copias; `phone: false` lo quita en
// pantallas estrechas.
const FOREST = [
  { id: "back-1", art: "pine", depth: "back", left: 10 },
  { id: "back-2", art: "round", depth: "back", left: 45, phone: false },
  { id: "back-3", art: "pine", depth: "back", left: 82, flip: true, phone: false },
  { id: "pine-a", art: "pine", depth: "far", left: 4 },
  { id: "round-b", art: "round", depth: "far", left: 52 },
  { id: "pine-d", art: "pine", depth: "far", left: 63, flip: true, phone: false },
  { id: "round-a", art: "round", depth: "near", left: 15 },
  { id: "pine-b", art: "pine", depth: "near", left: 31 },
  { id: "round-d", art: "round", depth: "near", left: 41, flip: true, phone: false },
  { id: "pine-c", art: "pine", depth: "near", left: 70 },
  { id: "round-c", art: "round", depth: "near", left: 87 },
  { id: "bush-1", art: "shrub", depth: "ground", left: 22 },
  { id: "bush-2", art: "berry", depth: "ground", left: 36, flip: true, phone: false },
  { id: "bush-3", art: "bush", depth: "ground", left: 58 },
  { id: "bush-4", art: "shrub", depth: "ground", left: 77, flip: true, phone: false },
  { id: "bush-5", art: "berry", depth: "ground", left: 93 }
];

// Hojas que se lleva el viento cuando sopla (mas cuanto mas sopla).
const WIND_LEAVES = Array.from({ length: 4 }, (_, index) => ({
  id: index,
  top: 20 + ((index * 37) % 48),
  seconds: 10 + ((index * 5) % 7),
  delay: -index * 3.1
}));

// Luciernagas que rondan el farol del sendero (unidades del svg del sendero).
const LANTERN_FLIES = [[628, 64], [652, 62], [647, 82], [631, 79], [657, 73], [621, 71], [642, 54]];

const GRASS = Array.from({ length: 28 }, (_, index) => ({
  id: `grass-${index}`,
  left: `${1.5 + index * 3.55}%`,
  scale: (0.72 + (index % 5) * 0.09).toFixed(2),
  delay: `${gustDelay(1.5 + index * 3.55)}s`
}));

// Matas del suelo, con el mismo trazo que los arboles: silueta en sombra,
// cuerpo, bloques de luz arriba a la izquierda y algun brillo. `berry` es la
// mata grande con bayas. Se mecen enteras desde el suelo (en CSS).
function WoodlandBush({ kind }) {
  if (kind === "shrub") {
    return <svg className="footer-plant-art" viewBox="0 0 26 14" width="26" height="14" aria-hidden="true">
      <g shapeRendering="crispEdges">
        <path d="M8 1h9v2h4v3h3v4h1v4H1v-3h1V6h3V3h3z" fill="var(--leaf-shadow)" />
        <path d="M9 3h8v2h4v3h2v3h1v1H3v-1h1V7h3V5h2z" fill="var(--leaf-mid)" />
        <path d="M9 4h6v2h-3v2H9v2H6V8h1V6h2z" fill="var(--leaf-light)" />
        <path d="M10 5h2v1h-2zm-3 4h2v1H7z" fill="var(--leaf-glint)" />
        <path d="M2 12h22v2H2z" fill="var(--leaf-shadow)" />
      </g>
    </svg>;
  }
  return <svg className="footer-plant-art" viewBox="0 0 40 20" width="40" height="20" aria-hidden="true">
    <g shapeRendering="crispEdges">
      <path d="M10 3h10V1h8v3h5v3h4v4h2v9H1v-6h2V8h4V5h3z" fill="var(--leaf-shadow)" />
      <path d="M11 5h10V3h6v3h5v3h4v4h2v6H3v-4h2V10h4V7h2z" fill="var(--leaf-mid)" />
      <path d="M11 6h8v3h-4v3h-5v3H6v-3h2v-2h3zm11-2h4v3h-4z" fill="var(--leaf-light)" />
      <path d="M27 8h6v3h3v4h-4v3h-6v-4h1z" fill="var(--leaf-light)" opacity=".5" />
      <path d="M12 7h3v2h-3zm11-2h2v1h-2zm-15 7h2v2H8zm23 0h2v2h-2z" fill="var(--leaf-glint)" />
      <path d="M20 11h2v5h-2zM3 17h35v3H3z" fill="var(--leaf-shadow)" />
      {kind === "berry" ? <>
        <path d="M13 10h2v2h-2zm12-3h2v2h-2zm-6 6h2v2h-2zm11 0h2v2h-2zm-23 1h2v2H7z" fill="var(--berry)" />
        <path d="M13 10h1v1h-1zm12-3h1v1h-1zm-6 6h1v1h-1zm11 0h1v1h-1zm-23 1h1v1H7z" fill="var(--berry-light)" />
      </> : null}
    </g>
  </svg>;
}

// Farolas del sendero. Cada una en su propio svg (con las coordenadas de
// siempre, de ahi el viewBox) para ponerlas donde haga falta: una justo a la
// izquierda del puesto del mercado y dos por el camino. Plantadas en el suelo
// (y 95); de noche (y al atardecer y al alba) se encienden, alumbran el camino
// y atraen luciernagas (footer-sky.css). Sitio en site-footer.css.
const TRAIL_LAMPS = [
  { id: "market", className: "is-market" },
  { id: "trail-a", className: "is-trail-a" },
  { id: "trail-b", className: "is-trail-b" }
];

function TrailLamp({ className }) {
  return (
    <svg className={`footer-lamp ${className}`} viewBox="590 20 100 76" width="100" height="76" aria-hidden="true">
      <g shapeRendering="crispEdges">
        <g className="footer-trail-lantern">
          <circle className="footer-lantern-glow" cx="640" cy="71" r="44" fill="url(#footer-lantern-glow)" />
          <ellipse className="footer-lantern-pool" cx="638" cy="95" rx="34" ry="5" fill="url(#footer-lantern-pool)" />
          <path d="M619 92h11v3h-11zm1-1h9v1h-9zm2-38h5v38h-5zm1-4h3v4h-3zm1-2h1v2h-1zm-3 20h7v2h-7zm0 15h7v2h-7zm6-28h16v3h-16zm14-2h3v2h-3zm-14 9h2v2h-2zm2-2h2v2h-2zm2-2h2v2h-2zm2-2h1v1h-1z" fill="#1d3431" />
          <path d="M623 53h2v38h-2zm4 3h14v1h-14zm-5 12h5v1h-5zm0 15h5v1h-5z" fill="#3e5b55" />
          <path d="M623 54h1v12h-1zm0 16h1v11h-1zm4 2h1v-1h-1z" fill="#6f8f86" />
          <path d="M639 58h2v3h-2zm-3 3h8v2h-8zm-2 2h12v2h-12zm1 2h10v12h-10zm-1 12h12v2h-12zm5 2h2v2h-2z" fill="#1f3532" />
          <path d="M637 61h4v1h-4zm-2 2h6v1h-6z" fill="#4f6d68" />
          <path className="footer-lantern-glass" d="M637 66h6v10h-6z" />
          <g className="footer-lantern-flame">
            <path d="M639 68h2v6h-2zm0-1h1v1h-1z" fill="#ffc768" />
            <path d="M639 70h2v3h-2z" fill="#fff4d2" />
          </g>
        </g>
        <g className="footer-lantern-flies">
          {LANTERN_FLIES.map(([x, y], index) => (
            <rect key={index} x={x} y={y} width="2" height="2" style={{ "--fly-delay": `${-index * 1.37}s`, "--fly-time": `${5.2 + (index % 3) * 1.4}s` }} />
          ))}
        </g>
      </g>
    </svg>
  );
}

// Pixel art escrito como texto: cada caracter es un pixel del color de su
// letra en la paleta ("." es vacio). Se convierte una vez a un path por color.
function pixelPaths(rows, palette) {
  const runs = new Map();
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length;) {
      const char = row[x];
      let end = x;
      while (row[end + 1] === char) end += 1;
      if (palette[char]) runs.set(char, `${runs.get(char) || ""}M${x} ${y}h${end - x + 1}v1h-${end - x + 1}z`);
      x = end + 1;
    }
  });
  return [...runs].map(([char, d]) => ({ key: char, fill: palette[char], d }));
}

// Hoguera junto al puesto del mercado: anillo de piedras, dos troncos, llamas
// de dos fotogramas que se alternan, chispas que suben y un hilo de humo. Arde
// siempre; de noche su luz se ve mucho mas (footer-sky.css).
const FIRE_COLORS = { o: "#ff7a3a", y: "#ffc247", w: "#fff2b5" };
const CAMPFIRE_FLAMES = [
  pixelPaths([
    "............o...........",
    "............oo..........",
    "...........oyo..........",
    ".......o...oyo...o......",
    ".......oo.oyyo..oo......",
    "........o.oywyo.oyo.....",
    "........ooywwyooyyo.....",
    ".......oyyywwwyyyyo.....",
    ".......oyywwwwwyyo......",
    "......oyyywwwwwyyyo.....",
    "......oyywwwwwwwyyo.....",
    ".......oyywwwwwyyo......",
    "........ooyyyyyoo......."
  ], FIRE_COLORS),
  pixelPaths([
    "..........o.............",
    ".........oo.............",
    "..........oyo...........",
    "......o...oyo.....o.....",
    "......oo..oyyo...oo.....",
    "......oyo.oywyo..o......",
    ".......oyooywwyo.oo.....",
    ".......oyyywwwyyyyo.....",
    "........oywwwwwyyo......",
    "......oyyywwwwwyyyo.....",
    "......oyywwwwwwwyyo.....",
    ".......oyywwwwwyyo......",
    "........ooyyyyyoo......."
  ], FIRE_COLORS)
];
const CAMPFIRE_BASE = pixelPaths([
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "........................",
  "....rLLLLLLLLLLLLLLr....",
  "....rllllllllllllllr....",
  "..rLLLLLLLLLLLLLLr......",
  "..rlllllllllllllllr.....",
  "..sSs.sSSs.eEe.sSSs.sSs.",
  ".sSSSssSSSseEEesSSSssSSs",
  ".ssssssssssssssssssssss.",
  "..ssss.sssss.ssss.ssss.."
], { r: "#b08a5a", L: "var(--wood-light)", l: "var(--wood-shadow)", s: "var(--stone-shadow)", S: "var(--stone-light)", e: "#ff5a2a", E: "#ffb347" });
const CAMPFIRE_SPARKS = [[10, 4], [14, 2], [12, 6], [16, 5]];

function Campfire() {
  return (
    <svg className="footer-campfire" viewBox="-20 -24 64 44" width="64" height="44" aria-hidden="true">
      <circle className="footer-campfire-glow" cx="12" cy="8" r="24" fill="url(#footer-campfire-glow)" />
      <ellipse className="footer-campfire-pool" cx="12" cy="19" rx="20" ry="3" fill="url(#footer-lantern-pool)" />
      <g className="footer-campfire-smoke">
        <circle cx="12" cy="-4" r="3" />
        <circle cx="14" cy="-10" r="2.5" />
      </g>
      <g shapeRendering="crispEdges">
        {CAMPFIRE_BASE.filter((layer) => ["r", "L", "l"].includes(layer.key)).map((layer) => <path key={layer.key} d={layer.d} fill={layer.fill} />)}
        <g className="footer-campfire-flames">
          {CAMPFIRE_FLAMES.map((frame, index) => (
            <g className={`footer-campfire-frame is-frame-${index}`} key={index}>
              {frame.map((layer) => <path key={layer.key} d={layer.d} fill={layer.fill} />)}
            </g>
          ))}
        </g>
        {CAMPFIRE_BASE.filter((layer) => !["r", "L", "l"].includes(layer.key)).map((layer) => <path key={layer.key} d={layer.d} fill={layer.fill} />)}
        <g className="footer-campfire-sparks">
          {CAMPFIRE_SPARKS.map(([x, y], index) => (
            <rect key={index} x={x} y={y} width="1" height="1" style={{ "--spark-delay": `${-index * 0.45}s` }} />
          ))}
        </g>
      </g>
    </svg>
  );
}

function WoodlandTree({ pine }) {
  return <svg className="footer-tree-art" viewBox="0 0 58 86" aria-hidden="true">
    <g shapeRendering="crispEdges">
      <path d="M25 38h8v39h5v4H19v-4h6z" fill="var(--wood-shadow)" />
      <path d="M26 40h3v37h-5v2h7V40z" fill="var(--wood-light)" />
      <path d="M28 55h-7v-8h-3v11h10m3 6h9V52h-3v9h-6" fill="var(--wood-shadow)" />
      <g className="footer-tree-leaves">
        {pine ? <>
          <path d="M27 2h4v6h4v7h4v6h-4v4h8v7h5v6h-6v4h8v7h5v8H39v4H19v-4H3v-8h6v-7h8v-4h-6v-6h5v-7h8v-4h-5v-6h5V8h3z" fill="var(--leaf-shadow)" />
          <path d="M27 8h4v10h4v4H24v-6h3m-3 11h9v6h6v5H17v-5h7m-6 11h18v6h9v6H11v-7h7z" fill="var(--leaf-mid)" />
          <path d="M27 9h2v8h-2m-3 11h4v5h-9v3h-3v-5h8m-6 15h7v4h-8v4h-6v-4h7" fill="var(--leaf-light)" />
          <path d="M31 19h3v3h-3m3 13h4v3h-4m3 16h5v3h-5" fill="var(--leaf-glint)" />
        </> : <>
          <path d="M18 5h19v4h9v6h5v9h4v21h-5v9H39v4H16v-4H7v-8H3V25h4V15h6V9h5z" fill="var(--leaf-shadow)" />
          <path d="M18 9h16v4h10v7h5v20h-7v8H29v5H16v-5H9V27h4V17h5z" fill="var(--leaf-mid)" />
          <path d="M18 11h12v5H18v6h-6v10H8v-8h4V16h6m-5 24h9v5h-9z" fill="var(--leaf-light)" />
          <path d="M30 18h9v4h6v8h-5v7H28v-5h-5v-8h7z" fill="var(--leaf-light)" opacity=".5" />
          <path d="M14 27h5v3h-5m16-17h5v3h-5m11 23h4v3h-4m-19 7h5v3h-5" fill="var(--leaf-glint)" />
          <path d="M31 39h4v9h-4m4-13h7v4h-7" fill="var(--leaf-shadow)" />
        </>}
      </g>
      <path d="M15 80h10v-2h9v2h9v3H15z" fill="var(--leaf-shadow)" />
    </g>
  </svg>;
}

export function FooterScenery() {
  const sceneryRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const scenery = sceneryRef.current;
    if (!scenery) return undefined;

    let frame = 0;
    let lastActive = "";
    const grasses = [...scenery.querySelectorAll(".footer-grass")];
    let grassCenters = [];

    function measureGrass() {
      grassCenters = grasses.map((grass) => grass.offsetLeft + grass.offsetWidth / 2);
    }

    function trackBuddySteps() {
      const buddy = document.querySelector(".screen-buddy-root:not(.is-off)");
      const sceneryRect = scenery.getBoundingClientRect();
      const buddyRect = buddy?.getBoundingClientRect();
      const isMoving = buddy?.classList.contains("is-walk") || buddy?.classList.contains("is-sleepy");
      let active = "";

      if (buddyRect && sceneryRect.width && isMoving) {
        const footX = buddyRect.left + buddyRect.width / 2 - sceneryRect.left;
        let closestDistance = Infinity;
        grasses.forEach((grass, index) => {
          const distance = Math.abs(grassCenters[index] - footX);
          if (distance < 34 && distance < closestDistance) {
            closestDistance = distance;
            active = grass.dataset.grassId || "";
          }
        });
      }

      if (active !== lastActive) {
        grasses.forEach((grass) => grass.classList.toggle("is-stepped", grass.dataset.grassId === active));
        lastActive = active;
      }
      frame = window.requestAnimationFrame(trackBuddySteps);
    }

    measureGrass();
    window.addEventListener("resize", measureGrass);
    const visibility = new IntersectionObserver(([entry]) => {
      window.cancelAnimationFrame(frame);
      if (entry.isIntersecting) frame = window.requestAnimationFrame(trackBuddySteps);
      scenery.classList.toggle("is-in-view", entry.isIntersecting);
    });
    visibility.observe(scenery);
    return () => {
      visibility.disconnect();
      window.removeEventListener("resize", measureGrass);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const scenery = sceneryRef.current;
    const onRain = (event) => scenery?.classList.toggle("is-raining", Boolean(event.detail?.active));
    window.addEventListener("daivr-footer-rain", onRain);
    return () => window.removeEventListener("daivr-footer-rain", onRain);
  }, []);

  return (
    <div className="footer-scenery" aria-hidden="true" ref={sceneryRef}>
      <span className="footer-forest-light" />
      <svg className="footer-distant-woods" viewBox="0 0 1200 96" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 66h35v-8h36v-7h48v6h42v-9h40v-5h54v8h45v8h56v-8h44v-7h48v-9h46v9h51v12h54v7h49v-9h42v-8h55v-6h58v7h44v10h65v-8h60v-6h41v9h61v12h48V96H0z" fill="var(--forest-far)" />
        <path d="M0 80h53V65h10V54h6V44h4V33h5v11h5v10h7v11h9v15h67v-9h52v8h72V65h8V54h8V40h5v-9h5v9h5v14h8v11h9v15h96v-8h37v-7h41v13h107V65h8V55h6V43h5v-9h5v9h5v12h7v10h9v15h81v-9h35v-9h46v12h75V60h9V47h5V34h6v13h6v13h9v18h62v-9h55v10h61V64h8V51h7V40h5V30h5v10h5v11h8v13h9v16h65v16H0z" fill="var(--forest-mid)" />
      </svg>
      <span className="footer-forest-stars">{[7, 22, 39, 58, 76, 91].map((left, index) => <i key={left} style={{ left: `${left}%`, top: `${8 + index % 3 * 9}px`, "--spark-delay": `${-index * 1.3}s` }} />)}</span>
      <span className="footer-scenery-horizon" />
      {FOREST.map((plant) => {
        const handDrawn = plant.art === "pine" || plant.art === "round";
        const className = `${handDrawn ? "footer-pixel-tree" : "footer-plant"} is-${plant.art} is-${plant.depth} ${plant.flip ? "is-flipped" : ""} ${plant.phone === false ? "is-optional" : ""}`;
        const style = { left: `${plant.left}%`, "--gust-delay": `${gustDelay(plant.left)}s`, "--plant-sway": PLANT_SWAY[plant.art] };
        return (
          <span className={className} style={style} key={plant.id}>
            {handDrawn ? <WoodlandTree pine={plant.art === "pine"} /> : <WoodlandBush kind={plant.art} />}
          </span>
        );
      })}
      <span className="footer-wind-leaves">
        {WIND_LEAVES.map((leaf) => (
          <i key={leaf.id} style={{ top: `${leaf.top}px`, "--leaf-time": `${leaf.seconds}s`, "--leaf-delay": `${leaf.delay}s` }} />
        ))}
      </span>
      <span className="footer-forest-mist" />
      <svg className="footer-trail-details" viewBox="0 0 1200 96" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        {/* Degradados compartidos: los usan tambien las farolas y la hoguera. */}
        <defs>
          <radialGradient id="footer-lantern-glow">
            <stop offset="0" stopColor="#ffd98c" stopOpacity=".55" />
            <stop offset=".3" stopColor="#ffbf6e" stopOpacity=".2" />
            <stop offset="1" stopColor="#ffbf6e" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="footer-lantern-pool">
            <stop offset="0" stopColor="#ffd38a" stopOpacity=".42" />
            <stop offset="1" stopColor="#ffd38a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="footer-campfire-glow">
            <stop offset="0" stopColor="#ffb35c" stopOpacity=".6" />
            <stop offset=".35" stopColor="#ff8a3d" stopOpacity=".22" />
            <stop offset="1" stopColor="#ff8a3d" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g shapeRendering="crispEdges">
          <path d="M95 89v-4h5v-4h11v4h6v4m350 0v-5h7v-3h12v4h5v4m407 0v-4h5v-5h13v4h7v5" fill="var(--stone-shadow)" />
          <path d="M101 83h9v2h-9m372 0h11v2h-11m410-1h11v2h-11" fill="var(--stone-light)" />
          <path d="M192 88v-7h3v7m12 0v-5h2v5m625 0v-7h3v7" fill="#799d91" />
          <path d="M187 80h4v-3h6v3h4v3h-14m17 0h8v3h-8m616-6h4v-3h6v3h4v3h-14" fill="var(--mushroom-cap)" />
          <path d="M191 79h3v2h-3m638-2h3v2h-3" fill="#c5cbbb" opacity=".7" />
        </g>
      </svg>
      {TRAIL_LAMPS.map((lamp) => <TrailLamp key={lamp.id} className={lamp.className} />)}
      <Campfire />
      <span className="footer-fireflies">{[11, 27, 44, 65, 82, 95].map((left, index) => <i key={left} style={{ left: `${left}%`, bottom: `${17 + index % 3 * 12}px`, "--spark-delay": `${-index * 1.7}s` }} />)}</span>
      <span className="footer-grass-bed">
        {GRASS.map((grass) => (
          <i
            className="footer-grass"
            data-grass-id={grass.id}
            key={grass.id}
            style={{ left: grass.left, "--grass-scale": grass.scale, "--grass-delay": grass.delay }}
          />
        ))}
      </span>
    </div>
  );
}
