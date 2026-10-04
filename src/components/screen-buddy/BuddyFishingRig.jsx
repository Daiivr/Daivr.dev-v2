import { FISHING_WATER_OFFSET } from "../../../shared/buddy-fishing-spot.mjs";
import { fishById } from "../../data/buddyWorld";
import { BuddyCollectibleIcon } from "../BuddyCollectibleIcon";
import { BuddyWornGear } from "../BuddyGearIcon";
import { BuddyFishingRodArt } from "../BuddySprite";

// Caña, linea, boya, ondas y captura de la pesca (useBuddyFishing). Los
// colores de caña y boya los pisa el aparejo puesto via CSS.
export function BuddyFishingRig({ phase, catchTier, catchId, rod, lure }) {
  const catchItem = fishById(catchId);
  return (
    <span
      className={`buddy-fishing-rig is-${phase || "cast"} ${catchTier ? `tier-${catchTier}` : ""} ${catchId ? `catch-${catchId}` : ""} ${rod} ${lure}`}
      style={{ "--buddy-water-offset": FISHING_WATER_OFFSET }}
      aria-hidden="true"
    >
      {/* Caña + linea dibujadas mirando a la izquierda (facing 1);
          el contenedor se espeja con --buddy-facing igual que el sprite. */}
      <svg className="buddy-fishing-svg" viewBox="0 0 44 78" width="44" height="78">
        <BuddyFishingRodArt />
        <path className="buddy-cast-trace" d={`M32 36Q-17-8 5 ${70 + FISHING_WATER_OFFSET}`} fill="none" stroke="#97c9c4" strokeWidth="1" />

        <g className="buddy-fishing-line-group">
          <g shapeRendering="crispEdges">
            <path className="buddy-fishing-line" d="M6 15v12H5v16H4v13h1v9" fill="none" stroke="#b8e5db" strokeWidth="1" />
            <g transform={`translate(0 ${FISHING_WATER_OFFSET})`}><g className="buddy-fishing-bobber">
              <BuddyWornGear id={lure || "lure"} x={0} y={62} width={11} height={12} />
            </g></g>
          </g>
        </g>

        {/* Superficie del vacio: ondas concentricas alrededor del anzuelo */}
        <g transform={`translate(0 ${FISHING_WATER_OFFSET})`}><g className="buddy-fishing-ripples" shapeRendering="crispEdges">
          <path className="buddy-water-surface" d="M-13 70h13v-1h11v1h17v2H12v1H-2v-1h-11z" fill="#164d68" />
          <path className="buddy-ripple buddy-ripple-a" d="M1 70h3v-1h4v1h3v1H8v1H4v-1H1z" fill="#b8f7ff" />
          <path className="buddy-ripple buddy-ripple-b" d="M-4 71h5v-1h11v1h5v1h-5v1H1v-1h-5z" fill="#45d8ff" />
          <path className="buddy-ripple buddy-ripple-c" d="M-10 72h7v-1h19v1h8v1h-8v1H-3v-1h-7z" fill="#b8f7ff" />
        </g></g>

        {!["catch", "escape", "retreat"].includes(phase) ? <path className="buddy-hook-line" transform={`translate(0 ${FISHING_WATER_OFFSET})`} d="M5 70v3h2v2H4" fill="none" stroke="#b8f7ff" strokeWidth="1" /> : null}

        <g transform={`translate(0 ${FISHING_WATER_OFFSET})`}><g className="buddy-cast-splash" shapeRendering="crispEdges">
          <path d="M-6 68h3v-3h2v3h3v2h-8m14-2h3v-4h2v4h4v2H8" fill="#8ae8e5" />
          <rect x="3" y="62" width="2" height="3" fill="#f4fff8" />
        </g></g>
        <g className="buddy-fishing-loot" shapeRendering="crispEdges">
          <BuddyCollectibleIcon id={catchId || "byte-minnow"} color={catchItem?.color} className="buddy-caught-specimen" x={-10} y={20} width={30} height={23} />
          <g className="buddy-catch-drips" fill="#8cd8d6"><path d="M-4 41h2v3h-2z" /><path d="M8 43h1v3H8z" /><path d="M16 39h2v3h-2z" /></g>
          <path className="buddy-catch-glint" d="M-14 22v8m-4-4h8m35-10v6m-3-3h6" stroke="#ffe29c" strokeWidth="1" fill="none" />
        </g>
      </svg>
    </span>
  );
}

// Con el traje de Miku la caña se pinta otra vez por delante del cuerpo.
export function BuddyMikuRodOverlay({ phase, rod }) {
  return (
    <span
      className={`buddy-fishing-rod-overlay is-${phase || "cast"} ${rod}`}
      aria-hidden="true"
    >
      <svg className="buddy-fishing-rod-overlay-svg" viewBox="0 0 44 78" width="44" height="78">
        <g shapeRendering="crispEdges">
          <BuddyFishingRodArt />

          {/* Two small foreground grips visually lock her posed hands
              around the handle instead of letting it cross her body. */}
          <g className="buddy-miku-rod-grip">
            <rect x="28" y="38" width="5" height="4" fill="#202633" />
            <rect x="29" y="39" width="3" height="2" fill="#ffd8c8" />
            <rect x="31" y="42" width="5" height="4" fill="#202633" />
            <rect x="32" y="43" width="3" height="2" fill="#ffd8c8" />
          </g>
        </g>
      </svg>
    </span>
  );
}
