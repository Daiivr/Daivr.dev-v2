import { BuddyWornGear } from "./BuddyGearIcon";
/*
  Sprite pixel del buddy (mini monitor CRT) y su paracaidas, compartidos entre
  ScreenBuddy (footer), el perchado del splash de bienvenida y la caida de
  entrada (BuddyDrop). Puramente presentacional: las animaciones (parpadeo,
  LEDs, bufanda) viven en las clases buddy-* de screen-buddy.css.
*/
export function BuddyChuteCanopy({ className = "", upgraded = false }) {
  return (
    <svg
      className={`buddy-chute-art ${upgraded ? "is-upgraded" : ""} ${className}`.replace(/\s+/g, " ").trim()}
      viewBox="0 0 72 64"
      width="80"
      height="71"
      aria-hidden="true"
    >
      <g className="buddy-chute-wind" shapeRendering="crispEdges">
        {/* A lower charcoal copy of the dome forms the rear canopy/shadow. */}
        <g className="buddy-chute-skirt">
          <path d="M18 2h36v2h6v3h4v4h3v5h2v11h-3v3h-8v-2H48v2h-8v-2h-8v2h-8v-2H14v2H6v-3H3V16h2v-5h3V7h4V4h6z" fill="#020604" />
          <path className="buddy-chute-rear-panel buddy-chute-rear-panel-l" d="M18 5h12v3h-3v4h-3v5h-2v7h-4v4H8V17h2v-5h3V9h3V6h2z" fill="#41464e" />
          <path className="buddy-chute-rear-panel buddy-chute-rear-panel-c" d="M29 5h14v2h2v4h2v5h2v8h4v2h-5v3h-7v2H31v-2h-7v-3h-5v-2h3v-8h2v-5h2V7h3z" fill="#343940" />
          <path className="buddy-chute-rear-panel buddy-chute-rear-panel-r" d="M42 5h12v1h2v3h3v3h3v5h2v11H54l-4-4h-2v-7h-2v-5h-2V8h-2z" fill="#41464e" />
          <path d="M14 10h5v3h-2v5h-2v7h-4v-7h1v-5h2zM50 9h4v2h3v4h2v8h-3v-6h-2v-4h-4z" fill="#596069" opacity="0.58" />
        </g>

        {/* Pixel rigging sits over the rear canopy and behind the bright dome. */}
        <g className="buddy-chute-lines" fill="none" strokeLinecap="square" strokeLinejoin="miter">
          <path className="buddy-chute-line-outline" d="M7 29 29 58M19 30l13 28M28 31l6 27M44 31l-6 27M53 30 40 58M65 29 43 58" />
          <path className="buddy-chute-line-core" d="M7 29 29 58M19 30l13 28M28 31l6 27M44 31l-6 27M53 30 40 58M65 29 43 58" />
        </g>

        {/* Tall segmented dome, redrawn from the reference's stepped silhouette. */}
        <g className="buddy-chute-canopy-shell">
          <path d="M18 2h36v2h6v3h4v4h3v5h2v11h-3v3h-8v-2H48v2h-8v-2h-8v2h-8v-2H14v2H6v-3H3V16h2v-5h3V7h4V4h6z" fill="#020604" />
          <path className="buddy-chute-panel buddy-chute-panel-l" d="M18 5h10v3h-3v4h-3v5h-2v7h-4v4H8V17h2v-5h3V9h3V6h2z" fill="#aeb9d1" />
          <path className="buddy-chute-panel buddy-chute-panel-ml" d="M28 5h8v26h-4v-2h-8v-3h-5v-2h3v-8h2v-5h2V7h2z" fill="#d9e2ef" />
          <path className="buddy-chute-panel buddy-chute-panel-mr" d="M36 5h8v2h2v4h2v5h2v8h3v2h-5v3h-8v2h-4z" fill="#f5f8fb" />
          <path className="buddy-chute-panel buddy-chute-panel-r" d="M44 5h10v1h2v3h3v3h3v5h2v11h-8l-4-4h-2v-7h-2v-5h-2V8h-2z" fill="#b8c5d8" />
          <path d="M16 8h8v3h-3v4h-2v6h-3v5h-5v-8h2v-5h3z" fill="#f9fcff" opacity="0.58" />
          <path d="M49 7h5v2h3v3h3v5h2v7h-4v-6h-2v-4h-3v-3h-4z" fill="#ffffff" opacity="0.82" />
        </g>

        {/* Central slider and webbing keep the canopy visually tied to Buddy. */}
        <g className="buddy-chute-harness">
          <path d="M28 55h16v5h-3v4H31v-4h-3z" fill="#020604" />
          <rect x="31" y="57" width="10" height="3" fill="#dce8ef" />
          <rect x="34" y="60" width="4" height="4" fill="#45d8ff" />
        </g>
      </g>
    </svg>
  );
}

/*
  Caña de exhibicion para el preview del inventario: misma caña que el aparejo
  de pesca pero con la linea recogida y la boya guardada junto a la punta.
  Los skins (rod-*) y colores de boya (lure-*) los pisa screen-buddy.css.
*/
export function BuddyRodIcon({ className = "", rodId = "", lureId = "" }) {
  return (
    <svg
      className={`buddy-rod-icon ${rodId} ${lureId} ${className}`.replace(/\s+/g, " ").trim()}
      viewBox="0 0 52 72"
      width="68"
      height="96"
      aria-hidden="true"
    >
      <g shapeRendering="crispEdges">
        {/* dark backing makes the stepped rod read as one connected object */}
        <path d="M8 13h5v6h5v6h5v6h5v6h5v6h5v8h5v15h-8V55h-5v-8h-5v-6h-5v-6h-5v-6h-5v-6H8z" fill="#020604" opacity=".92" />

        {/* continuous pixel staircase from handle to tip */}
        <rect className="buddy-rod-tip" x="8" y="13" width="5" height="6" fill="#45d8ff" />
        <rect className="buddy-rod-tip" x="12" y="17" width="6" height="7" fill="#45d8ff" />
        <rect className="buddy-rod-seg" x="17" y="22" width="6" height="8" fill="#b8f7ff" />
        <rect className="buddy-rod-seg" x="22" y="27" width="6" height="9" fill="#b8f7ff" />
        <rect className="buddy-rod-seg" x="27" y="33" width="6" height="9" fill="#b8f7ff" />
        <rect className="buddy-rod-seg" x="32" y="39" width="6" height="12" fill="#b8f7ff" />
        <rect className="buddy-rod-seg" x="37" y="47" width="6" height="11" fill="#b8f7ff" />

        {/* wrapped grip and large readable reel */}
        <rect x="38" y="55" width="7" height="14" fill="#6b3f24" />
        <rect x="39" y="57" width="6" height="3" fill="#ffd166" />
        <rect x="39" y="63" width="6" height="3" fill="#ffd166" />
        <rect x="31" y="46" width="10" height="10" fill="#ffd166" />
        <rect x="33" y="48" width="6" height="6" fill="#071b1c" />
        <rect x="35" y="50" width="2" height="2" fill="#f4fff8" />
        <rect x="27" y="50" width="5" height="3" fill="#45d8ff" />

        {/* solid line from the tip to the equipped lure */}
        <path d="M9 14v38h3v5" fill="none" stroke="rgba(184,247,255,.88)" strokeWidth="1.5" />
        <BuddyWornGear id={lureId || "lure"} x={4} y={50} width={16} height={20} />
      </g>
    </svg>
  );
}

function BuddyMikuCostume({ expression = "idle", rocketBoots = false }) {
  const isHappy = expression === "happy";
  const isAsleep = expression === "sleep";

  return (
    <g className="buddy-miku-costume" shapeRendering="crispEdges">
      {/* Big rounded twin-tails, closely following the user's chibi reference. */}
      <g className="buddy-hair-tail buddy-hair-tail-l">
        <rect x="5" y="5" width="10" height="7" fill="#161d27" />
        <rect x="7" y="6" width="6" height="3" fill="#ff3d9d" />
        <path d="M3 8h8v3h3v8h-2v12h-2v7H8v5H4v-2H2v-5H1V29H0V17h2v-6h1z" fill="#39cfc4" />
        <path d="M3 12h3v24H4v4H2V18h1z" fill="#8af7e9" />
        <path d="M9 11h4v9h-2v12H9v7H7v4H4v-3h2v-9h2V19h1z" fill="#147b83" />
        <g className="buddy-hair-tip"><path d="M3 39h7v3H8v3H4v-2H2v-2h1z" fill="#147b83" /></g>
      </g>
      <g className="buddy-hair-tail buddy-hair-tail-r">
        <rect x="33" y="5" width="10" height="7" fill="#161d27" />
        <rect x="35" y="6" width="6" height="3" fill="#ff3d9d" />
        <path d="M37 8h8v3h1v6h2v12h-1v7h-1v5h-2v2h-4v-5h-2v-7h-2V19h-2v-8h3z" fill="#39cfc4" />
        <path d="M42 12h3v6h1v22h-2v-4h-2z" fill="#8af7e9" />
        <path d="M35 11h4v8h1v12h2v9h2v3h-3v-4h-2v-7h-2V20h-2z" fill="#147b83" />
        <g className="buddy-hair-tip"><path d="M38 39h7v2h1v2h-2v2h-4v-3h-2z" fill="#147b83" /></g>
      </g>

      {/* Oversized chibi head: a broad face, soft eyes and stepped bangs keep
          Miku friendly and readable even when the sprite is only 64px wide. */}
      <g className="buddy-miku-head">
        <path d="M14 2h20v2h3v3h2v12h-2v3h-3v3h-5v2H19v-2h-5v-3h-3v-3H9V7h2V4h3z" fill="#ffd8c8" />
        <path d="M14 1h20v2h3v3h2v10h-4V8h-3v6h-3V9h-3v7h-4V9h-3v6h-3V9h-3v7H9V6h2V3h3z" fill="#39cfc4" />
        <path d="M15 1h14v2H15zm-2 3h8v2h-8z" fill="#8af7e9" />
        <path d="M9 8h5v12h-3v-3H9zm25 0h5v9h-2v3h-3z" fill="#147b83" />

        <path d="M8 4h6v12H8zM34 4h6v12h-6z" fill="#161d27" />
        <path d="M9 6h4v5H9zm26 0h4v5h-4z" fill="#ff3d9d" />
        <path d="M37 13h4v2h-2v3h-3v-2h1z" fill="#161d27" />
        <rect x="39" y="16" width="2" height="2" fill="#ff3d9d" />

        {isAsleep ? (
          <path d="M16 16h5v1h-5zm12 0h5v1h-5z" fill="#17212a" />
        ) : (
          <>
            <g className="buddy-eye">
              <rect x="16" y="14" width="4" height="6" fill="#17212a" />
            </g>
            <g className="buddy-eye">
              <rect x="29" y="14" width="4" height="6" fill="#17212a" />
            </g>
          </>
        )}
        <rect x="12" y="21" width="3" height="1" fill="#ff91ae" opacity=".72" />
        <rect x="34" y="21" width="3" height="1" fill="#ff91ae" opacity=".72" />
        {isHappy
          ? <path d="M21 21h1v1h5v-1h1v2h-2v1h-3v-1h-2z" fill="#d95778" />
          : <path d="M23 22h3v1h-3z" fill="#d95778" />}
      </g>

      {/* Larger white/gray blouse, wide collar, teal tie and detached sleeves. */}
      <rect x="22" y="22" width="6" height="3" fill="#ffd8c8" />
      <g className="buddy-miku-torso">
        <path d="M17 24h16v2h2v9H15v-9h2z" fill="#e8f1ef" />
        <path d="M18 26h4v7h-4zm10 0h4v7h-4z" fill="#9aa9ad" />
        <path d="M17 24h6v3h4v-3h6v3h-5v3h-6v-3h-5z" fill="#27313c" />
        <path d="M23 26h4v3h1v7h-6v-7h1z" fill="#39cfc4" />
        <rect x="24" y="27" width="2" height="7" fill="#8af7e9" />
      </g>

      <g className="buddy-miku-arm buddy-miku-arm-l">
        <rect x="12" y="25" width="5" height="8" fill="#ffd8c8" />
        <path d="M8 31h7v9h-2v2H8v-2H7v-7h1z" fill="#202633" />
        <rect x="8" y="32" width="2" height="8" fill="#39cfc4" />
        <rect x="10" y="41" width="4" height="3" fill="#ffd8c8" />
      </g>
      <g className="buddy-miku-arm buddy-miku-arm-r">
        <rect x="33" y="25" width="5" height="8" fill="#ffd8c8" />
        <rect x="35" y="27" width="2" height="2" fill="#ff4b61" />
        <path d="M35 31h7v2h1v7h-1v2h-5v-2h-2z" fill="#202633" />
        <rect x="40" y="32" width="2" height="8" fill="#39cfc4" />
        <rect x="36" y="41" width="4" height="3" fill="#ffd8c8" />
      </g>

      {/* Wide pleated skirt and two truly independent thigh-high boot groups. */}
      <path d="M15 34h20v2h2v4H11v-4h4z" fill="#252b38" />
      <path d="M13 38h5v-1h4v1h4v-1h4v1h5v2H13z" fill="#39cfc4" />
      <path d="M16 35h2v4h-2zm7 0h2v4h-2zm7 0h2v4h-2z" fill="#3b4351" />

      <g className="buddy-miku-leg buddy-miku-leg-l buddy-leg buddy-leg-l buddy-leg-foot buddy-leg-foot-l">
        <rect x="17" y="40" width="7" height="3" fill="#ffd8c8" />
        <rect x="17" y="43" width="7" height="4" fill="#202633" />
        <path d="M16 46h8v2h2v1H15v-2h1z" fill="#151a23" />
        <rect x="15" y="48" width="11" height="1" fill="#39cfc4" />
        {rocketBoots ? (
          <>
            <rect x="15" y="44" width="3" height="4" fill="#ff3d9d" />
            <rect x="18" y="47" width="7" height="2" fill="#5b314e" />
            <rect className="buddy-miku-thruster" x="18" y="49" width="4" height="1" fill="#ffd166" />
            <g className="buddy-miku-rocket-flame buddy-miku-rocket-flame-l">
              <rect x="19" y="50" width="2" height="3" fill="#f4fff8" />
              <rect x="18" y="53" width="4" height="3" fill="#ffd166" />
              <path d="M18 56h4v3h-1v2h-2v-2h-1z" fill="#ff3d9d" />
            </g>
          </>
        ) : null}
      </g>
      <g className="buddy-miku-leg buddy-miku-leg-r buddy-leg buddy-leg-r buddy-leg-foot buddy-leg-foot-r">
        <rect x="27" y="40" width="7" height="3" fill="#ffd8c8" />
        <rect x="27" y="43" width="7" height="4" fill="#202633" />
        <path d="M27 46h8v1h1v2H26v-1h1z" fill="#151a23" />
        <rect x="26" y="48" width="10" height="1" fill="#39cfc4" />
        {rocketBoots ? (
          <>
            <rect x="33" y="44" width="3" height="4" fill="#ff3d9d" />
            <rect x="27" y="47" width="7" height="2" fill="#5b314e" />
            <rect className="buddy-miku-thruster" x="29" y="49" width="4" height="1" fill="#ffd166" />
            <g className="buddy-miku-rocket-flame buddy-miku-rocket-flame-r">
              <rect x="30" y="50" width="2" height="3" fill="#f4fff8" />
              <rect x="29" y="53" width="4" height="3" fill="#ffd166" />
              <path d="M29 56h4v3h-1v2h-2v-2h-1z" fill="#ff3d9d" />
            </g>
          </>
        ) : null}
      </g>
    </g>
  );
}

function BuddyFittedRocketBoot({ x, side }) {
  return (
    <g className="buddy-fitted-rocket-boot" transform={`translate(${x} 34)`}>
      {/* Draw each boot at the leg's native pixel scale, with a separate sole and nozzle. */}
      <path d="M3 0h8v6h2v5H0V6h3z" fill="#252f3b" />
      <path d="M4 1h6v6h2v2H1V7h3z" fill="#a4497d" />
      <path d="M4 1h5v2H4m-2 4h5v1H2" fill="#f4a0c5" />
      <path d="M4 4h5v2H4" fill="#df629e" />
      <path d="M9 3h1v4h2v2H9z" fill="#6e3b60" />
      <path d="M1 9h11v2H1z" fill="#3d7784" />
      <path d="M2 9h6v1H2" fill="#91d4d0" />
      <path d="M3 11h7v2H9v1H4v-1H3z" fill="#183543" />
      <path d="M4 11h5v1H4z" fill="#91bdc7" />
      <path d="M5 12h3v1H5z" fill="#e5f9ec" />
      <g className={`buddy-rocket-flame buddy-rocket-flame-${side}`}>
        <path d="M4 13h5v2H8v3H7v2H6v-2H5v-3H4z" fill="#ef8a59" />
        <path d="M5 13h3v4H7v1H6v-1H5z" fill="#ffdb86" />
        <path d="M5 13h3v2H7v1H6v-1H5z" fill="#a4edee" />
        <path d="M6 13h1v3H6z" fill="#f2fff3" />
      </g>
    </g>
  );
}

export function BuddySprite({ className = "", expression = "idle", facing = 1, friendshipLevel = 1, inventory = [], hiddenGear = [], unlockedGear = [], width = 64, height = 61 }) {
  const isHappy = expression === "happy";
  const isAsleep = expression === "sleep";
  const isAlert = expression === "surprised";
  const isFocused = expression === "focus";
  const hasItem = (id) => (inventory.includes(id) || unlockedGear.includes(id)) && !hiddenGear.includes(id);
  const hasGear = (id) => unlockedGear.includes(id) && !hiddenGear.includes(id);
  const showFriendshipGear = (id, level) => friendshipLevel >= level && !hiddenGear.includes(id);
  const hasSparkAntenna = showFriendshipGear("gold-antenna", 5);
  const hasMikuWig = hasGear("miku-wig");
  const hasRocketBoots = hasGear("rocket-boots");
  const hasHeadAccessory = showFriendshipGear("party-hat", 2) || hasGear("star-cap") || hasGear("pixel-crown") || hasMikuWig;

  if (hasGear("miku-costume")) {
    return (
      <svg
        className={`${className} buddy-miku-costume-sprite`.trim()}
        viewBox="0 0 48 50"
        width={width}
        height={height}
        style={{ "--buddy-facing": facing, overflow: "visible" }}
        aria-hidden="true"
      >
        <BuddyMikuCostume expression={expression} rocketBoots={hasRocketBoots} />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 48 46"
      width={width}
      height={height}
      style={{ "--buddy-facing": facing, overflow: "visible" }}
      aria-hidden="true"
    >
      <g shapeRendering="crispEdges">
        <g className="buddy-upper-body">
        {/* antena (LED dorado en amistad lv5) */}
        {hasHeadAccessory ? (
          <g className="buddy-antenna buddy-antenna-side">
            <rect x="33" y="8" width="5" height="2" fill="#3fff97" />
            <rect x="37" y="5" width="2" height="5" fill="#3fff97" />
            <rect className="buddy-led" x="38" y="2" width="5" height="5" fill={hasSparkAntenna ? "#ffd166" : "#45d8ff"} />
            <rect x="39" y="1" width="3" height="1" fill="#f4fff8" opacity="0.7" />
            {hasSparkAntenna ? (
              <>
                <rect className="buddy-antenna-spark buddy-antenna-spark-a" x="41" y="0" width="2" height="2" fill="#ffd166" />
                <rect className="buddy-antenna-spark buddy-antenna-spark-b" x="44" y="4" width="1.5" height="1.5" fill="#f4fff8" />
                <rect className="buddy-antenna-spark buddy-antenna-spark-c" x="42" y="8" width="1.5" height="1.5" fill="#3fff97" />
              </>
            ) : null}
          </g>
        ) : (
          <g className="buddy-antenna buddy-antenna-top">
            <rect className="buddy-led" x="21" y="0" width="6" height="5" fill={hasSparkAntenna ? "#ffd166" : "#45d8ff"} />
            <rect x="23" y="5" width="2" height="5" fill="#3fff97" />
            {hasSparkAntenna ? (
              <>
                <rect className="buddy-antenna-spark buddy-antenna-spark-a" x="19" y="0" width="2" height="2" fill="#ffd166" />
                <rect className="buddy-antenna-spark buddy-antenna-spark-b" x="28" y="1" width="1.5" height="1.5" fill="#f4fff8" />
                <rect className="buddy-antenna-spark buddy-antenna-spark-c" x="24" y="0" width="1.5" height="1.5" fill="#3fff97" />
              </>
            ) : null}
          </g>
        )}
        {hasItem("headset") ? (
          <g>
            <rect x="11" y="8" width="26" height="2" fill="#45d8ff" />
            <path d="M3 15h5v12H3z" fill="#143845" /><path d="M3 16h3v8H3z" fill="#45d8ff" /><rect x="3" y="16" width="2" height="2" fill="#b8f7ff" />
            <path d="M40 15h5v12h-5z" fill="#143845" /><path d="M42 16h3v8h-3z" fill="#45d8ff" /><rect x="42" y="16" width="2" height="2" fill="#b8f7ff" />
            <path d="M43 25v4h-6v-2h4v-2z" fill="#ed659e" />
          </g>
        ) : null}
        {/* peluco miku (atras): coletas largas que cuelgan detras de la cabeza,
            con banda de goma + bulto, y punta anidada para el latigazo fisico */}
        {hasMikuWig ? (
          <g className="buddy-miku-hair-back">
            <g className="buddy-hair-tail buddy-hair-tail-l">
              <rect x="1" y="11" width="6" height="3" fill="#0e4a44" />
              <rect x="0" y="14" width="7" height="7" fill="#48ded0" />
              <rect x="5" y="14" width="2" height="7" fill="#28a99c" />
              <rect x="0" y="15" width="2" height="6" fill="#9ff5ea" />
              <rect x="0" y="21" width="6" height="6" fill="#48ded0" />
              <rect x="4" y="21" width="2" height="6" fill="#28a99c" />
              <rect x="0" y="21" width="1" height="6" fill="#9ff5ea" />
              <g className="buddy-hair-tip">
                <rect x="1" y="27" width="5" height="7" fill="#48ded0" />
                <rect x="4" y="27" width="2" height="7" fill="#28a99c" />
                <rect x="1" y="28" width="1" height="9" fill="#9ff5ea" />
                <rect x="1" y="34" width="4" height="5" fill="#48ded0" />
                <rect x="2" y="39" width="3" height="3" fill="#1f8b81" />
              </g>
            </g>
            <g className="buddy-hair-tail buddy-hair-tail-r">
              <rect x="41" y="11" width="6" height="3" fill="#0e4a44" />
              <rect x="41" y="14" width="7" height="7" fill="#48ded0" />
              <rect x="41" y="14" width="2" height="7" fill="#28a99c" />
              <rect x="46" y="15" width="2" height="6" fill="#9ff5ea" />
              <rect x="42" y="21" width="6" height="6" fill="#48ded0" />
              <rect x="42" y="21" width="2" height="6" fill="#28a99c" />
              <rect x="47" y="21" width="1" height="6" fill="#9ff5ea" />
              <g className="buddy-hair-tip">
                <rect x="42" y="27" width="5" height="7" fill="#48ded0" />
                <rect x="42" y="27" width="2" height="7" fill="#28a99c" />
                <rect x="46" y="28" width="1" height="9" fill="#9ff5ea" />
                <rect x="43" y="34" width="4" height="5" fill="#48ded0" />
                <rect x="43" y="39" width="3" height="3" fill="#1f8b81" />
              </g>
            </g>
          </g>
        ) : null}

        {/* A filled CRT housing gives the accessories a solid attachment surface. */}
        <path d="M8 9h31v2h4v21h-3v3H8v-2H5V12h3z" fill="#102e34" />
        <path d="M9 10h29v2h3v19h-3v3H9v-2H7V13h2z" fill="#387d78" />
        <path d="M9 10h28v2H10v19H8V13h1z" fill="#a4dfc4" />
        <path d="M38 13h3v18h-3v3H11v-2h27z" fill="#20504e" />
        <path d="M10 12h25v1H10m0 18h24v1H10" fill="#58b49c" />
        <path d="M4 27h3v6H4m38-1h5v2h-5" fill="#244d51" />
        <path d="M4 28h2v3H4m35-15h5v1h-5" fill="#93cbb5" />

        {/* pantalla */}
        <g className="buddy-screen">
          <path d="M11 13h20v1h2v15h-2v2H11v-2H9V15h2z" fill="#112e29" />
          <rect x="11" y="15" width="20" height="14" fill="#071b18" />
          <g opacity="0.08" fill="#83e6bc">
            <rect x="10" y="17" width="21" height="1" />
            <rect x="10" y="21" width="21" height="1" />
            <rect x="10" y="25" width="21" height="1" />
          </g>

          {/* ojos: el grupo se traslada hacia el cursor, el rect parpadea */}
          <path d="M11 15h10v1H12v4h-1z" fill="#b4ffcf" opacity=".22" />
          <g className="buddy-eye-track">
            {isAsleep ? <path d="M14 21h4v1h-4m9-1h4v1h-4" fill="#3fff97" /> : <>
              <g className="buddy-eye"><path d={isHappy ? "M14 20v-2h4v2h-1v-1h-2v1z" : isFocused ? "M14 20h4v3h-4z" : "M14 18h4v5h-4z"} fill="#3fff97" /><rect x="14" y="18" width="1" height="1" fill="#eafff4" /></g>
              <g className="buddy-eye"><path d={isHappy ? "M23 20v-2h4v2h-1v-1h-2v1z" : isFocused ? "M23 20h4v3h-4z" : "M23 18h4v5h-4z"} fill="#3fff97" /><rect x="23" y="18" width="1" height="1" fill="#eafff4" /></g>
            </>}
          </g>
          {isFocused ? <path d="M13 17h6v1h-6m9-1h6v1h-6" fill="#b4ffcf" /> : null}
          {isHappy ? <path d="M12 24h3v1h-3m14-1h3v1h-3" fill="#ff83b7" opacity=".8" /> : null}

          {hasGear("green-visor") ? (
            <g className="buddy-green-visor">
              <path d="M10 16h23v10H10z" fill="#27594f" opacity=".65" />
              <path d="M12 18h19v6H12z" fill="#74e6b2" opacity=".16" />
              <path d="M11 16h21v2H11m0 6h21v2H11" fill="#6bc9a0" />
              <path d="M12 17h9v1h-9m8 2h3v1h-3" fill="#d8ffe4" opacity=".7" />
              <path d="M9 19h2v4H9m23-4h2v4h-2" fill="#55a9af" />
            </g>
          ) : null}

          {/* lentes de sol: amistad lv3+ */}
          {showFriendshipGear("sunglasses", 3) ? <g className="buddy-worn-glasses"><BuddyWornGear id="sunglasses" x={11} y={14} width={20} height={15} /></g> : null}

          {/* boca por humor */}
          {isHappy ? (
            <g fill="#3fff97">
              <rect x="14" y="24" width="2" height="2" />
              <rect x="25" y="24" width="2" height="2" />
              <rect x="16" y="26" width="9" height="2" />
            </g>
          ) : isAlert ? (
            <path d="M18 24h5v5h-5zM19 25v3h3v-3z" fill="#b4ffcf" fillRule="evenodd" />
          ) : isAsleep ? (
            <rect x="18" y="26" width="4" height="2" fill="rgba(63,255,151,.4)" />
          ) : (
            <rect x="17" y="26" width="7" height="2" fill="#3fff97" />
          )}
        </g>

        {/* peluco miku (frente): corona center-parted, mechones que enmarcan la
            cara y flequillo en punta. Estatico: el pelo del craneo no se mece */}
        {hasMikuWig ? (
          <g className="buddy-miku-hair-front">
            <rect x="8" y="9" width="24" height="2" fill="#48ded0" />
            <rect x="9" y="7" width="22" height="2" fill="#48ded0" />
            <rect x="11" y="5" width="18" height="2" fill="#48ded0" />
            <rect x="14" y="3" width="12" height="2" fill="#48ded0" />
            <rect x="16" y="2" width="8" height="2" fill="#48ded0" />
            <rect x="19" y="3" width="2" height="7" fill="#28a99c" />
            <rect x="11" y="4" width="8" height="1" fill="#9ff5ea" />
            <rect x="6" y="12" width="4" height="9" fill="#48ded0" />
            <rect x="6" y="21" width="3" height="4" fill="#48ded0" />
            <rect x="6" y="25" width="2" height="2" fill="#1f8b81" />
            <rect x="9" y="12" width="1" height="10" fill="#28a99c" />
            <rect x="6" y="13" width="1" height="9" fill="#9ff5ea" />
            <rect x="31" y="12" width="4" height="9" fill="#48ded0" />
            <rect x="32" y="21" width="3" height="4" fill="#48ded0" />
            <rect x="33" y="25" width="2" height="2" fill="#1f8b81" />
            <rect x="31" y="12" width="1" height="10" fill="#28a99c" />
            <rect x="34" y="13" width="1" height="9" fill="#9ff5ea" />
            <rect x="16" y="10" width="9" height="2" fill="#48ded0" />
            <rect x="20" y="10" width="1" height="3" fill="#28a99c" />
            <rect x="9" y="10" width="7" height="3" fill="#48ded0" />
            <rect x="10" y="13" width="4" height="2" fill="#48ded0" />
            <rect x="11" y="15" width="2" height="1" fill="#1f8b81" />
            <rect x="14" y="10" width="1" height="4" fill="#28a99c" />
            <rect x="25" y="10" width="7" height="3" fill="#48ded0" />
            <rect x="27" y="13" width="4" height="2" fill="#48ded0" />
            <rect x="28" y="15" width="2" height="1" fill="#1f8b81" />
            <rect x="25" y="10" width="1" height="4" fill="#28a99c" />
          </g>
        ) : null}

        {/* bisel derecho: perillas + led */}
        <rect x="33" y="14" width="1" height="16" fill="rgba(63,255,151,.28)" />
        <rect x="36" y="16" width="4" height="4" fill="#ffd166" />
        <rect x="36" y="23" width="4" height="4" fill="#45d8ff" />
        <path d="M36 16h3v1h-3m0 6h3v1h-3" fill="#f4fff8" opacity=".8" />
        <rect className="buddy-power" x="36" y="29" width="4" height="2" fill="#3fff97" />

        {/* gorro de fiesta: amistad lv2+ */}
        {showFriendshipGear("party-hat", 2) ? <g className="buddy-headgear"><BuddyWornGear id="party-hat" x={12} y={-1} width={24} height={15} /></g> : null}
        {hasGear("star-cap") ? <g className="buddy-headgear"><BuddyWornGear id="star-cap" x={10} y={0} width={30} height={15} /></g> : null}
        {hasGear("pixel-crown") ? <g className="buddy-headgear"><BuddyWornGear id="pixel-crown" x={11} y={-1} width={26} height={15} /></g> : null}

        </g>

        {/* patas */}
        <g className="buddy-leg buddy-leg-l">
          <path className="buddy-leg-upper" d="M14 34h5v6h-5z" fill="#274b49" />
          <path d="M15 35h2v4h-2" fill="#91cdb6" />
          <g className="buddy-leg-foot buddy-leg-foot-l">
            {hasRocketBoots ? <BuddyFittedRocketBoot x={10} side="l" /> : <>
            <path d="M12 39h8v2h2v4H10v-4h2z" fill="#15343b" />
            <path d="M12 40h7v2h2v1H11v-2h1z" fill="#66b49b" />
            <path d="M12 40h5v1h-5" fill="#d2ead0" /><path d="M11 44h10v1H11" fill="#438a86" />
            </>}
          </g>
        </g>
        <g className="buddy-leg buddy-leg-r">
          <path className="buddy-leg-upper" d="M29 34h5v6h-5z" fill="#274b49" />
          <path d="M30 35h2v4h-2" fill="#91cdb6" />
          <g className="buddy-leg-foot buddy-leg-foot-r">
            {hasRocketBoots ? <BuddyFittedRocketBoot x={26} side="r" /> : <>
            <path d="M28 39h8v2h2v4H26v-4h2z" fill="#15343b" />
            <path d="M28 40h7v2h2v1H27v-2h1z" fill="#66b49b" />
            <path d="M28 40h5v1h-5" fill="#d2ead0" /><path d="M27 44h10v1H27" fill="#438a86" />
            </>}
          </g>
        </g>
        {hasItem("wrench") ? <g className="buddy-tool-wrench buddy-carry-item"><BuddyWornGear id="wrench" x={35} y={30} width={15} height={16} /></g> : null}
        {hasItem("cartridge") ? <g className="buddy-loot-cartridge buddy-carry-item"><BuddyWornGear id="cartridge" x={36} y={31} width={13} height={15} /></g> : null}
        {hasItem("coffee") ? <g className="buddy-coffee"><BuddyWornGear id="coffee" x={0} y={32} width={14} height={13} /></g> : null}
        {showFriendshipGear("scarf", 4) ? (
          <g className="buddy-fitted-scarf">
            <path d="M7 31h30v4H7z" fill="#7e3158" />
            <path d="M8 31h27v2H8z" fill="#f078b0" />
            <path d="M10 31h15v1H10z" fill="#ffb7d8" />
            <g className="buddy-scarf-tails">
              <path d="M29 34h5v8h-5zM34 34h4v5h-4z" fill="#ce4e8a" />
              <path d="M30 35h2v6h-2m5-6h1v3h-1" fill="#ff94c6" />
              <path d="M29 41h2v2h-2m3-2h2v2h-2m3-5h2v2h-2" fill="#ffd68c" />
            </g>
            <path d="M28 32h7v4h-7z" fill="#a93b76" /><path d="M29 32h5v2h-5z" fill="#ff94c6" />
          </g>
        ) : null}

      </g>
    </svg>
  );
}

export function BuddyFishingRodArt() {
  return <g className="buddy-fishing-rod-art" shapeRendering="crispEdges">
    <path d="M3 9h6v8h7v6h7v7h7v7h6v14h-8v-9h-5v-7h-7v-7H9v-7H3z" fill="#082127" />
    <path className="buddy-rod-seg" d="M6 15h5v6h7v7h7v7h7v9h-3v-7h-7v-7h-7v-7H8v-6H6z" fill="#b8f7ff" />
    <path className="buddy-rod-tip" d="M4 10h4v7H4z" fill="#45d8ff" />
    <path d="M7 16h3v1H7m9 11h4v1h-4m8 8h4v1h-4" fill="#f4fff8" opacity=".8" />
    <path d="M30 40h5v12h-5z" fill="#6b3f24" /><path d="M30 42h5v2h-5m0 4h5v2h-5" fill="#d2a063" />
    <g className="buddy-reel"><path d="M24 40h7v8h-7z" fill="#ffd166" /><path d="M25 41h5v5h-5z" fill="#28434b" /><path d="M27 42h2v2h-2m-5 2h4v2h-4" fill="#dfffee" /></g>
  </g>;
}
