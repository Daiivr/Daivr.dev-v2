import { useId } from "react";
import { GATE_MARKER_GLYPHS, GATE_PATINA_THEMES } from "./gatePatinaThemes";

// A small repeating tile keeps the grain static and avoids filtering a full door.
function PaintWear({ id }) {
  return (
    <>
      <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".55 .85" numOctaves="3" seed="23" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncR type="linear" slope="3" intercept="-.8" />
          <feFuncG type="linear" slope="3" intercept="-.8" />
          <feFuncB type="linear" slope="3" intercept="-.8" />
        </feComponentTransfer>
      </filter>
      <pattern id={`${id}-tile`} width="48" height="48" patternUnits="userSpaceOnUse">
        <rect width="48" height="48" fill="white" filter={`url(#${id}-grain)`} />
        <path d="m3 8 12-2m14 27 16-3M8 43l6-1" stroke="black" strokeWidth=".8" opacity=".5" />
      </pattern>
      <mask id={`${id}-wear`} x="-15%" y="-15%" width="130%" height="140%" style={{ maskType: "luminance" }}>
        <rect x="-15%" y="-15%" width="130%" height="140%" fill={`url(#${id}-tile)`} />
      </mask>
    </>
  );
}

function SeasonalTag({ lines }) {
  return (
    <>
      {lines.map((line, row) => {
        const scale = Math.min(1.5, 222 / (line.length * 34));
        return (
          <g key={row} transform={`translate(16 ${row ? 84 : 12}) scale(${scale} 1.3)`} strokeWidth="5.5">
            {[...line].map((letter, index) => (
              <path key={index} d={GATE_MARKER_GLYPHS[letter]} transform={`translate(${index * 34} ${index % 2 ? -1 : 1}) rotate(${index % 2 ? 2 : -2} 13 20)`} />
            ))}
          </g>
        );
      })}
      <path d="m10 144 228-8m-213 15 167-5m-151-14-1 6m171-8-1 12" strokeWidth="2" />
    </>
  );
}

// Decorative paint and scoring stay attached to their respective sliding panel.
export function GatePatina({ side, seasonalEvent }) {
  const left = side === "left";
  const theme = GATE_PATINA_THEMES[seasonalEvent];
  const panel = left ? 0 : 1;
  const id = `patina-${useId().replace(/:/g, "")}`;

  return (
    <span className={`entry-gate-patina is-${side}`} data-season={theme ? seasonalEvent : "default"} style={theme ? {
      "--gate-tag-color": theme.colors[panel],
      "--gate-mark-color": theme.colors[2],
    } : undefined} aria-hidden="true">
      <svg className="gate-scratches" viewBox="0 0 600 800" preserveAspectRatio="none" fill="none">
        <defs>
          <PaintWear id={`${id}-metal`} />
          <g id={`${id}-scores`}>
          {theme ? (
            <path d={theme.marks} transform={left ? undefined : "translate(600 0) scale(-1 1)"} />
          ) : left ? (
            <>
              <path d="m72 185 39-12m-32 20 62-25m-48 33 20-9M436 290l34-47m-29 57 50-62m-32 41 22-29M80 577l76-9m-58 15 31-6M366 681l47-15m-35 21 25-9M44 358l3 49m-1 13 1 17M544 536l-3 42m-2 9-1 14" />
              <path d="m211 233 12-3m125 194 9-5m-75 218 18-6m172-240 7-10M123 711l28-2" opacity=".5" />
            </>
          ) : (
            <>
              <path d="m108 180 47 12m-42-5 28 10M411 302l53-19m-45 25 66-19m-43 28 22-10M77 470l28-39m-21 46 40-51M441 670l69-12m-54 20 38-9M546 158l-2 60m-1 9-2 14M55 617l2 25m0 10 1 39" />
              <path d="m327 163 12 4m-143 418 16-5m189-24 8-11m-61 181 28-3M164 328l9-6" opacity=".5" />
            </>
          )}
          </g>
        </defs>
        <use href={`#${id}-scores`} className="gate-scratch-groove" />
        <g mask={`url(#${id}-metal-wear)`}>
          <use href={`#${id}-scores`} className="gate-scratch-edge" transform="translate(0 1.1)" />
          <use href={`#${id}-scores`} className="gate-scratch-core" />
          <use href={`#${id}-scores`} className="gate-scratch-fragments" transform="translate(1.5 -2)" />
        </g>
        <g className="gate-scratch-scuff">
          <path d={left ? "m78 584 94-16M438 294l45-53M372 689l43-16" : "m415 310 72-24M83 480l41-50M446 680l64-16"} />
        </g>
      </svg>

      <svg className="gate-paint-tag" viewBox="0 0 260 155" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <defs>
          <PaintWear id={`${id}-paint`} />
          <g id={`${id}-lettering`}>
        {theme ? <SeasonalTag lines={theme.tags[panel]} /> : left ? (
          <>
            {/* Uneven hand-lettered STAY / WEIRD, with dry-brush gaps. */}
            <g strokeWidth="8">
              <path d="M53 25Q21 11 20 34q0 10 20 13t-4 18L13 60M67 24l48-3M89 23l-9 47M116 69l23-48 15 49m-28-18 22-2M166 21l14 24 25-24m-25 24-5 25" />
              <path d="m15 89 2 44 20-31 7 31 22-47M105 86l-27 3-6 45 27-3m-23-19 22-3M125 86l-8 46M143 132l7-47q42-4 24 20l-29 7m17-7 21 29M202 134l8-48q54 15-8 48" />
            </g>
            <path d="m10 144 211-9m-200 16 148-4M227 42l10-5-7 18 14-5" strokeWidth="2" />
            <path d="m34 65-2 12m109-7-1 9m65 55-2 11" strokeWidth="1.5" opacity=".65" />
          </>
        ) : (
          <>
            {/* NO CLIP, a little crooked, like marker on a cabinet. */}
            <g strokeWidth="9">
              <path d="m37 60 5-43 32 46 9-48M110 19q-24 10-17 35t31 6q20-14 10-33t-24-8" />
              <path d="M57 89q-43-19-43 22t40 21M79 83l-8 52 33-3M130 84l-9 48M155 133l6-48q49-4 31 20l-34 9" />
            </g>
            <path d="m24 145 177-6m-157 12 119-5m-16-91 37-17-9 16 42-7m-10-7 13 7-11 10" strokeWidth="2.5" />
            <path d="m42 60-2 13m80-12-1 9m57 39-2 16" strokeWidth="1.5" opacity=".65" />
          </>
        )}
          </g>
        </defs>
        <use href={`#${id}-lettering`} className="gate-tag-shadow" transform="translate(2.5 3.5)" />
        <use href={`#${id}-lettering`} className="gate-tag-overspray" />
        <g mask={`url(#${id}-paint-wear)`}>
          <use href={`#${id}-lettering`} className="gate-tag-highlight" transform="translate(-.7 -.8)" />
          <use href={`#${id}-lettering`} />
          <path d={left ? "M32 61q-2 12-1 22m109-13-1 13m64 46-1 18" : "M40 60q-2 12-1 20m79-16-1 12m54 38-2 28"} strokeWidth="1.8" opacity=".7" />
          <path d={left ? "m15 17 9-8 30 3m157 70 17 11-7 20M12 140l70-1" : "m33 11 12-7 30 4m85 72 33 1 10 9M24 141l66-3"} className="gate-tag-highlight" strokeWidth="1.3" />
        </g>
        <g fill="currentColor" stroke="none" opacity=".45">
          <circle cx="7" cy="38" r="1.5" /><circle cx="231" cy="112" r="1" />
          <circle cx="54" cy="76" r="1" /><circle cx="195" cy="15" r="1.8" />
          <circle cx="218" cy="142" r="1.3" /><circle cx="8" cy="120" r=".8" />
          <circle cx="17" cy="20" r=".8" /><circle cx="11" cy="27" r=".6" />
          <circle cx="57" cy="9" r="1.2" /><circle cx="62" cy="13" r=".6" />
          <circle cx="220" cy="96" r="1.6" /><circle cx="226" cy="102" r=".7" />
          <circle cx="236" cy="89" r=".8" /><circle cx="201" cy="146" r="1.1" />
        </g>
      </svg>

      <svg className="gate-paint-doodle" viewBox="0 0 120 110" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <defs><PaintWear id={`${id}-doodle`} /></defs>
        <g mask={`url(#${id}-doodle-wear)`}>
        {theme ? <path d={theme.doodles[panel]} /> : left ? (
          <>
            <path d="m27 33 66-3 2 48-69 3Zm30-1 1-13m-6-1 11-1M39 48l10-1 1 9-11 1Zm29-2 11-1 1 9-11 1ZM48 66l25-2M34 82l-1 14 13-1m32-15 2 13 12-1M17 45l-6 2 1 18 6-1m84-22 7-1 1 19-7 1" />
            <path d="m8 87 7-6m-5 18 10-7M98 17l8-6m-5 17 12-2" opacity=".6" />
          </>
        ) : (
          <>
            <path d="m57 12 11 26 30-5-22 23 14 28-30-13-24 24 3-34-27-15 31-7Z" />
            <path d="m45 43 4 7m17-12 4 7M49 60q12 8 20-3m30 32 9 9m-8-20 13 4M23 18l-8-7" />
          </>
        )}
        </g>
      </svg>
    </span>
  );
}
