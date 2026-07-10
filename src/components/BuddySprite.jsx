/*
  Sprite pixel del buddy (mini monitor CRT) y su paracaidas, compartidos entre
  ScreenBuddy (footer), el perchado del splash de bienvenida y la caida de
  entrada (BuddyDrop). Puramente presentacional: las animaciones (parpadeo,
  LEDs, bufanda) viven en las clases buddy-* de screen-buddy.css.
*/

export function BuddyChuteCanopy({ className = "" }) {
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

        {/* cuerdas hacia la cabeza */}
        <rect x="6" y="15" width="1" height="7" fill="rgba(180, 255, 207, 0.75)" />
        <rect x="17" y="17" width="1" height="5" fill="rgba(180, 255, 207, 0.55)" />
        <rect x="30" y="17" width="1" height="5" fill="rgba(180, 255, 207, 0.55)" />
        <rect x="41" y="15" width="1" height="7" fill="rgba(180, 255, 207, 0.75)" />
      </g>
    </svg>
  );
}

export function BuddySprite({ className = "", expression = "idle", facing = 1, friendshipLevel = 1, width = 64, height = 61 }) {
  const isHappy = expression === "happy";
  const isAsleep = expression === "sleep";

  return (
    <svg
      className={className}
      viewBox="0 0 48 46"
      width={width}
      height={height}
      style={{ "--buddy-facing": facing }}
      aria-hidden="true"
    >
      <g shapeRendering="crispEdges">
        {/* antena (LED dorado en amistad lv5) */}
        <rect className="buddy-led" x="21" y="0" width="6" height="5" fill={friendshipLevel >= 5 ? "#ffd166" : "#45d8ff"} />
        <rect x="23" y="5" width="2" height="5" fill="#3fff97" />

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

          {/* lentes de sol: amistad lv3+ */}
          {friendshipLevel >= 3 ? (
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

        {/* bisel derecho: perillas + led */}
        <rect x="33" y="14" width="1" height="16" fill="rgba(63,255,151,.28)" />
        <rect x="36" y="16" width="4" height="4" fill="#ffd166" />
        <rect x="36" y="23" width="4" height="4" fill="#45d8ff" />
        <rect className="buddy-power" x="36" y="29" width="4" height="2" fill="#3fff97" />

        {/* gorro de fiesta: amistad lv2+ */}
        {friendshipLevel >= 2 ? (
          <g>
            <rect x="15" y="1" width="3" height="2" fill="#ffd166" />
            <rect x="15" y="3" width="3" height="2" fill="#ff3d9d" />
            <rect x="14" y="5" width="5" height="2" fill="#ff3d9d" />
            <rect x="13" y="7" width="7" height="2" fill="#ff3d9d" />
            <rect x="12" y="9" width="9" height="2" fill="#ff3d9d" />
          </g>
        ) : null}

        {/* bufanda: amistad lv4+ */}
        {friendshipLevel >= 4 ? (
          <g>
            <rect x="8" y="31" width="26" height="3" fill="#ff3d9d" />
            <rect x="28" y="33" width="4" height="3" fill="#ff3d9d" />
            <rect className="buddy-scarf-tail" x="29" y="36" width="4" height="5" fill="#ff3d9d" />
          </g>
        ) : null}

        {/* patas */}
        <rect className="buddy-leg buddy-leg-l" x="13" y="34" width="6" height="7" fill="#020604" stroke="#3fff97" strokeWidth="1.5" />
        <rect className="buddy-leg buddy-leg-r" x="29" y="34" width="6" height="7" fill="#020604" stroke="#3fff97" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
