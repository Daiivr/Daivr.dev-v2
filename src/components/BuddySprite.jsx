/*
  Sprite pixel del buddy (mini monitor CRT) y su paracaidas, compartidos entre
  ScreenBuddy (footer), el perchado del splash de bienvenida y la caida de
  entrada (BuddyDrop). Puramente presentacional: las animaciones (parpadeo,
  LEDs, bufanda) viven en las clases buddy-* de screen-buddy.css.
*/
export function BuddyChuteCanopy({ className = "", upgraded = false }) {
  return (
    <svg className={className} viewBox="0 0 48 22" width="64" height="29" aria-hidden="true">
      <g shapeRendering="crispEdges">
        {/* cupula en escalera */}
        <rect x="12" y="0" width="24" height="4" fill="#ff3d9d" />
        <rect x="8" y="4" width="32" height="4" fill="#ff3d9d" />
        <rect x="5" y="8" width="38" height="4" fill="#ff3d9d" />
        <rect x="4" y="12" width="40" height="3" fill="#e02f86" />

        {/* paneles de color */}
        <rect x="13" y="0" width="5" height="15" fill="#ffd166" />
        <rect x="30" y="0" width="5" height="15" fill="#45d8ff" />

        {/* respiradero + brillo */}
        <rect x="22" y="0" width="4" height="2" fill="#b3216b" />
        <rect x="14" y="1" width="7" height="1" fill="rgba(255, 255, 255, 0.35)" />
        <rect x="26" y="1" width="8" height="1" fill="rgba(255, 255, 255, 0.35)" />

        {/* festones del borde */}
        <rect x="4" y="15" width="6" height="2" fill="#e02f86" />
        <rect x="14" y="15" width="6" height="2" fill="#ffd166" />
        <rect x="24" y="15" width="6" height="2" fill="#e02f86" />
        <rect x="34" y="15" width="6" height="2" fill="#45d8ff" />
        {upgraded ? (
          <>
            <rect x="8" y="6" width="32" height="1" fill="#3fff97" opacity="0.9" />
            <rect x="19" y="0" width="10" height="15" fill="#3fff97" opacity="0.32" />
          </>
        ) : null}

        {/* cuerdas hacia la cabeza */}
        <rect x="6" y="15" width="1" height="7" fill="rgba(180, 255, 207, 0.75)" />
        <rect x="17" y="17" width="1" height="5" fill="rgba(180, 255, 207, 0.55)" />
        <rect x="30" y="17" width="1" height="5" fill="rgba(180, 255, 207, 0.55)" />
        <rect x="41" y="15" width="1" height="7" fill="rgba(180, 255, 207, 0.75)" />
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
        <rect className="buddy-lure-top" x="7" y="52" width="9" height="6" fill="#ff3d9d" />
        <rect className="buddy-lure-bottom" x="8" y="58" width="7" height="7" fill="#ffd166" />
        <rect x="10" y="54" width="3" height="2" fill="#f4fff8" opacity=".9" />
        <path d="M12 65v4h4v-3" fill="none" stroke="#b8f7ff" strokeWidth="2" />
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

export function BuddySprite({ className = "", expression = "idle", facing = 1, friendshipLevel = 1, inventory = [], hiddenGear = [], unlockedGear = [], width = 64, height = 61 }) {
  const isHappy = expression === "happy";
  const isAsleep = expression === "sleep";
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
            <rect x="4" y="16" width="4" height="9" fill="#45d8ff" />
            <rect x="40" y="16" width="4" height="9" fill="#45d8ff" />
            <rect x="38" y="27" width="7" height="1" fill="#45d8ff" />
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

        {/* cuerpo monitor */}
        <rect x="6" y="10" width="36" height="24" fill="#020604" stroke="#3fff97" strokeWidth="1.5" />

        {/* pantalla */}
        <g className="buddy-screen">
          <rect x="10" y="14" width="21" height="16" fill="#06100b" stroke="rgba(63,255,151,.4)" strokeWidth="1" />
          <g opacity="0.16" fill="#3fff97">
            <rect x="10" y="17" width="21" height="1" />
            <rect x="10" y="21" width="21" height="1" />
            <rect x="10" y="25" width="21" height="1" />
          </g>

          {/* ojos: el grupo se traslada hacia el cursor, el rect parpadea */}
          <g className="buddy-eye-track">
            <rect className="buddy-eye" x="14" y="18" width="4" height="4" fill="#3fff97" />
            <rect className="buddy-eye" x="23" y="18" width="4" height="4" fill="#3fff97" />
          </g>

          {hasGear("green-visor") ? (
            <g className="buddy-green-visor">
              <rect x="11" y="16" width="20" height="9" fill="#3fff97" opacity="0.22" />
              <rect x="11" y="16" width="20" height="2" fill="#b4ffcf" opacity="0.86" />
              <rect x="11" y="23" width="20" height="2" fill="#3fff97" opacity="0.74" />
              <rect x="13" y="19" width="6" height="1" fill="#f4fff8" opacity="0.68" />
              <rect x="22" y="19" width="6" height="1" fill="#f4fff8" opacity="0.68" />
              <rect x="30" y="18" width="3" height="5" fill="#3fff97" opacity="0.96" />
            </g>
          ) : null}

          {/* lentes de sol: amistad lv3+ */}
          {showFriendshipGear("sunglasses", 3) ? (
            <g>
              <rect x="13" y="18" width="6" height="4" fill="#020604" stroke="#45d8ff" strokeWidth="1" />
              <rect x="22" y="18" width="6" height="4" fill="#020604" stroke="#45d8ff" strokeWidth="1" />
              <rect x="19" y="19" width="3" height="1" fill="#45d8ff" />
            </g>
          ) : null}

          {/* boca por humor */}
          {isHappy ? (
            <g fill="#3fff97">
              <rect x="14" y="24" width="2" height="2" />
              <rect x="25" y="24" width="2" height="2" />
              <rect x="16" y="26" width="9" height="2" />
            </g>
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
        <rect className="buddy-power" x="36" y="29" width="4" height="2" fill="#3fff97" />

        {/* gorro de fiesta: amistad lv2+ */}
        {showFriendshipGear("party-hat", 2) ? (
          <g>
            <rect x="22" y="0" width="4" height="2" fill="#ffd166" />
            <rect x="21" y="2" width="6" height="2" fill="#ff3d9d" />
            <rect x="20" y="4" width="8" height="2" fill="#45d8ff" />
            <rect x="18" y="6" width="12" height="2" fill="#ff3d9d" />
            <rect x="16" y="8" width="16" height="2" fill="#ffd166" />
            <rect x="15" y="10" width="18" height="2" fill="#ff3d9d" />
          </g>
        ) : null}
        {hasGear("star-cap") ? (
          <g>
            <rect x="15" y="6" width="20" height="4" fill="#45d8ff" />
            <rect x="18" y="4" width="14" height="2" fill="#2faed8" />
            <rect x="31" y="9" width="8" height="2" fill="#45d8ff" />
            <rect x="23" y="3" width="2" height="2" fill="#ffd166" />
            <rect x="21" y="5" width="6" height="1" fill="#ffd166" />
            <rect x="24" y="6" width="2" height="2" fill="#ffd166" />
          </g>
        ) : null}
        {hasGear("pixel-crown") ? (
          <g>
            <rect x="13" y="8" width="22" height="3" fill="#ffd166" />
            <rect x="14" y="4" width="4" height="4" fill="#ffd166" />
            <rect x="22" y="2" width="4" height="6" fill="#ffd166" />
            <rect x="30" y="4" width="4" height="4" fill="#ffd166" />
            <rect x="15" y="5" width="2" height="2" fill="#45d8ff" />
            <rect x="23" y="3" width="2" height="2" fill="#ff3d9d" />
            <rect x="31" y="5" width="2" height="2" fill="#3fff97" />
            <rect x="14" y="10" width="20" height="1" fill="#b9872d" opacity="0.7" />
          </g>
        ) : null}

        {/* bufanda: amistad lv4+ */}
        {showFriendshipGear("scarf", 4) ? (
          <g>
            <rect x="8" y="31" width="26" height="3" fill="#ff3d9d" />
            <rect x="28" y="33" width="4" height="3" fill="#ff3d9d" />
            <rect className="buddy-scarf-tail" x="29" y="36" width="4" height="5" fill="#ff3d9d" />
          </g>
        ) : null}

        {/* patas */}
        <g className="buddy-leg buddy-leg-l">
          <rect className="buddy-leg-upper" x="14" y="34" width="4" height="4" fill="#020604" stroke="#3fff97" strokeWidth="1.5" />
          <rect className="buddy-leg-foot buddy-leg-foot-l" x="12" y="38" width="8" height="4" fill="#020604" stroke="#3fff97" strokeWidth="1.5" />
        </g>
        <g className="buddy-leg buddy-leg-r">
          <rect className="buddy-leg-upper" x="30" y="34" width="4" height="4" fill="#020604" stroke="#3fff97" strokeWidth="1.5" />
          <rect className="buddy-leg-foot buddy-leg-foot-r" x="28" y="38" width="8" height="4" fill="#020604" stroke="#3fff97" strokeWidth="1.5" />
        </g>
        {hasItem("wrench") ? (
          <g className="buddy-tool-wrench buddy-carry-item">
            <rect x="37" y="33" width="9" height="6" fill="#071b1c" stroke="#45d8ff" strokeWidth="1" />
            <rect x="45" y="34" width="3" height="3" fill="#b8f7ff" />
            <rect x="39" y="34" width="4" height="2" fill="#b8f7ff" />
            <rect x="40" y="39" width="4" height="5" fill="#174b57" stroke="#45d8ff" strokeWidth="1" />
            <rect x="37" y="35" width="2" height="2" fill="#ffd166" />
          </g>
        ) : null}
        {hasItem("cartridge") ? (
          <g className="buddy-loot-cartridge buddy-carry-item">
            <rect x="38" y="33" width="8" height="10" fill="#020604" stroke="#ffd166" strokeWidth="1" />
            <rect x="40" y="35" width="4" height="2" fill="#3fff97" />
            <rect x="40" y="39" width="1" height="2" fill="#ffd166" />
            <rect x="43" y="39" width="1" height="2" fill="#ffd166" />
          </g>
        ) : null}
        {hasItem("coffee") ? (
          <g className="buddy-coffee">
            <rect x="4" y="36" width="6" height="6" fill="#ffd166" />
            <rect x="10" y="38" width="2" height="3" fill="none" stroke="#ffd166" strokeWidth="1" />
            <rect x="5" y="34" width="4" height="1" fill="#f4fff8" opacity="0.7" />
          </g>
        ) : null}
        {hasGear("rocket-boots") ? (
          <g className="buddy-rocket-boots">
            <rect x="11" y="40" width="9" height="3" fill="#45d8ff" />
            <rect x="28" y="40" width="9" height="3" fill="#45d8ff" />
            <rect className="buddy-rocket-flame buddy-rocket-flame-l" x="13" y="43" width="4" height="2" fill="#ff3d9d" />
            <rect className="buddy-rocket-flame buddy-rocket-flame-r" x="31" y="43" width="4" height="2" fill="#ff3d9d" />
          </g>
        ) : null}
      </g>
    </svg>
  );
}
