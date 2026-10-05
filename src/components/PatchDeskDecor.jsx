import { useId } from "react";

// Atrezo del escritorio de Patch.log. Nada de esto se puede tocar: le da a la
// escena luz y un poco de vida (guirnalda, ventana con aurora, neon, taza) para
// que los seis objetos no floten en una pared vacia. Todo en SVG local, como
// los objetos, y con los colores del tema para que glitch lo repinte solo.

const BULB_COLORS = 4;

// Dos guirnaldas que cuelgan entre tres ganchos, lejos de las esquinas para
// dejar sitio a las placas de la pared.
function stringLightBulbs() {
  const swags = [[[160, 6], [330, 48], [500, 6]], [[500, 6], [670, 48], [840, 6]]];
  const bulbs = [];
  swags.forEach(([start, control, end]) => {
    for (let step = 1; step <= 8; step += 1) {
      const t = step / 9;
      const x = (1 - t) ** 2 * start[0] + 2 * (1 - t) * t * control[0] + t ** 2 * end[0];
      const y = (1 - t) ** 2 * start[1] + 2 * (1 - t) * t * control[1] + t ** 2 * end[1];
      bulbs.push([x, y]);
    }
  });
  return bulbs;
}
const BULBS = stringLightBulbs();

export function PatchDeskDecor() {
  const id = useId().replace(/:/g, "");
  return <div className="patch-desk-decor" aria-hidden="true">
    <span className="patch-decor-glow is-monitor" />
    <span className="patch-decor-glow is-buddy" />

    <svg className="patch-decor-lights" viewBox="0 0 1000 60" fill="none" focusable="false">
      <path d="M160 6Q330 48 500 6Q670 48 840 6" stroke="#06100c" strokeWidth="2.4" />
      <path d="M160 6Q330 48 500 6Q670 48 840 6" stroke="#41594c" strokeWidth=".8" />
      {[160, 500, 840].map((x) => <circle key={x} cx={x} cy="6" r="3" fill="#7f9284" stroke="#0a1510" />)}
      {BULBS.map(([x, y], index) => <g key={index} className={`patch-decor-bulb is-c${index % BULB_COLORS}`} style={{ animationDelay: `${(index * 0.37) % 2.6}s` }}>
        <circle className="patch-decor-bulb-halo" cx={x} cy={y + 9} r="11" />
        <rect x={x - 2} y={y} width="4" height="4" fill="#24332b" />
        <ellipse className="patch-decor-bulb-glass" cx={x} cy={y + 9} rx="3.4" ry="4.6" />
        <ellipse cx={x - 1} cy={y + 7.5} rx="1" ry="1.6" fill="#fff" opacity=".7" />
      </g>)}
    </svg>

    <svg className="patch-decor-window" viewBox="0 0 120 160" fill="none" focusable="false">
      <defs>
        <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor="#01050b" /><stop offset=".6" stopColor="#05161c" /><stop offset="1" stopColor="var(--patch-sky-3, #0b2a29)" /></linearGradient>
        <linearGradient id={`${id}-aurora-a`} x2="0" y2="1"><stop stopColor="var(--patch-accent)" stopOpacity="0" /><stop offset=".72" stopColor="var(--patch-accent)" stopOpacity=".5" /><stop offset="1" stopColor="var(--patch-accent)" stopOpacity="0" /></linearGradient>
        <linearGradient id={`${id}-aurora-b`} x2="0" y2="1"><stop stopColor="var(--patch-secondary)" stopOpacity="0" /><stop offset=".7" stopColor="var(--patch-secondary)" stopOpacity=".42" /><stop offset="1" stopColor="var(--patch-secondary)" stopOpacity="0" /></linearGradient>
        <linearGradient id={`${id}-frame`} x2=".3" y2="1"><stop stopColor="var(--patch-plastic-1, #5e6b66)" /><stop offset=".2" stopColor="var(--patch-plastic-2, #36433e)" /><stop offset="1" stopColor="var(--patch-plastic-4, #14201e)" /></linearGradient>
        <clipPath id={`${id}-pane`}><rect x="10" y="10" width="100" height="122" /></clipPath>
      </defs>
      <rect x="3" y="3" width="114" height="136" fill={`url(#${id}-frame)`} stroke="#091410" strokeWidth="2" />
      <g clipPath={`url(#${id}-pane)`}>
        <rect x="10" y="10" width="100" height="122" fill={`url(#${id}-sky)`} />
        {[[22, 20], [44, 14], [70, 24], [96, 16], [30, 42], [86, 46], [58, 36], [104, 34], [16, 58]].map(([x, y], index) => <circle key={index} className="patch-decor-star" cx={x} cy={y} r={index % 3 ? .7 : 1.1} fill="#e6f5ee" style={{ animationDelay: `${index * 0.6}s` }} />)}
        <circle cx="92" cy="26" r="6" fill="#e9f1dc" opacity=".9" /><circle cx="94.5" cy="24.5" r="5.4" fill="#05141a" opacity=".55" />
        <g className="patch-decor-aurora">
          <path d="M-10 92C10 60 26 84 44 62s36 14 54-12 22-2 34-10V0H-10z" fill={`url(#${id}-aurora-a)`} />
          <path d="M-10 74C14 50 30 70 52 50s30 8 50-14 18 4 30 0V0H-10z" fill={`url(#${id}-aurora-b)`} />
        </g>
        <path d="M10 132V112l14-14 10 8 16-22 14 14 10-8 18 18 10-8 8 6v26z" fill="#071319" />
        <path d="m50 84-6 8 5-2 3 4 4-3zm-26 14-5 5 4-1 3 2zm60 0-5 6 4-1 3 3 3-2z" fill="#a9c2bb" opacity=".45" />
        <path d="M10 124c22-6 36 2 56-3s30 2 44-2v13H10z" fill="#0d211f" />
        <path d="M14 14 40 14 14 52z" fill="#fff" opacity=".05" />
      </g>
      <path d="M60 10v122M10 71h100" stroke="#0a1611" strokeWidth="4" /><path d="M60 10v122M10 71h100" stroke="#53685b" strokeWidth="1.2" />
      <rect x="10" y="10" width="100" height="122" stroke="#020806" strokeWidth="2" />
      <path d="M0 139h120v9H0z" fill="#2b3b32" stroke="#0a140f" /><path d="M2 140h116" stroke="#8ea18f" strokeOpacity=".4" />
    </svg>

    <svg className="patch-decor-neon" viewBox="0 0 100 64" fill="none" focusable="false">
      <rect x="3" y="3" width="94" height="58" rx="5" fill="#04100bcc" stroke="#2a3d33" />
      <circle cx="10" cy="10" r="1.6" fill="#8a9a8a" /><circle cx="90" cy="10" r="1.6" fill="#8a9a8a" /><circle cx="10" cy="54" r="1.6" fill="#8a9a8a" /><circle cx="90" cy="54" r="1.6" fill="#8a9a8a" />
      <g className="patch-decor-neon-tube" strokeLinecap="round" strokeLinejoin="round">
        <path d="M34 18 18 32l16 14M56 14 44 50M66 18l16 14-16 14" stroke="currentColor" strokeWidth="7" strokeOpacity=".22" />
        <path d="M34 18 18 32l16 14M56 14 44 50M66 18l16 14-16 14" stroke="currentColor" strokeWidth="3.4" />
        <path d="M34 18 18 32l16 14M56 14 44 50M66 18l16 14-16 14" stroke="#fff" strokeOpacity=".7" strokeWidth="1.1" />
      </g>
    </svg>

    <svg className="patch-decor-mug" viewBox="0 0 90 110" fill="none" preserveAspectRatio="xMidYMax meet" focusable="false">
      <defs><linearGradient id={`${id}-ceramic`} x2="1"><stop stopColor="var(--patch-mug-1, #2a5e4c)" /><stop offset=".35" stopColor="var(--patch-mug-2, #1d4739)" /><stop offset="1" stopColor="var(--patch-mug-3, #0d241c)" /></linearGradient></defs>
      <g className="patch-decor-steam" stroke="#e8fff3" strokeLinecap="round" strokeWidth="2.2">
        <path d="M28 34c-6-8 6-12 0-20s4-12 2-16" /><path d="M40 32c-6-8 6-12 0-20s4-12 2-16" /><path d="M52 34c-6-8 6-12 0-20s4-12 2-16" />
      </g>
      <ellipse cx="42" cy="104" rx="32" ry="4.5" fill="#000" opacity=".35" />
      <path d="M64 54c18 0 18 30 0 30" stroke="#0b1d16" strokeWidth="10" /><path d="M64 54c15 0 15 30 0 30" stroke="var(--patch-mug-2, #1d4739)" strokeWidth="6" />
      <path d="M16 42h52l-3 56c0 4-3 6-7 6H26c-4 0-7-2-7-6z" fill={`url(#${id}-ceramic)`} stroke="#07150f" />
      <ellipse cx="42" cy="42" rx="26" ry="6" fill="var(--patch-mug-1, #2f6b56)" stroke="#07150f" /><ellipse cx="42" cy="43" rx="22" ry="4.2" fill="#2a170c" />
      <path d="M23 50v44" stroke="#fff" strokeOpacity=".12" strokeWidth="3" />
      <path d="m33 66 7 5-7 5m11 0h9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>;
}

// Va por encima de los objetos: la luz del flexo cae sobre el disquete y su
// mesa, y el propio flexo no pisa ninguna pieza clicable.
export function PatchDeskLighting() {
  const id = useId().replace(/:/g, "");
  return <div className="patch-desk-lighting" aria-hidden="true">
    <svg className="patch-decor-lamp" viewBox="0 0 340 264" fill="none" preserveAspectRatio="xMaxYMax meet" focusable="false">
      <defs>
        <radialGradient id={`${id}-beam`} cx="231" cy="109" r="230" gradientUnits="userSpaceOnUse"><stop stopColor="#ffe3a3" stopOpacity=".34" /><stop offset=".55" stopColor="#ffd27a" stopOpacity=".1" /><stop offset="1" stopColor="#ffd27a" stopOpacity="0" /></radialGradient>
        <radialGradient id={`${id}-pool`}><stop stopColor="#ffd98c" stopOpacity=".2" /><stop offset="1" stopColor="#ffd98c" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}-metal`} x2="1" y2=".8"><stop stopColor="var(--patch-metal-1, #6f7c77)" /><stop offset=".4" stopColor="var(--patch-metal-2, #c5d0c3)" /><stop offset="1" stopColor="var(--patch-metal-5, #66776f)" /></linearGradient>
      </defs>
      <g className="patch-decor-beam">
        {/* Boca de la pantalla girada 48 grados: de (211,88) a (250,131). */}
        <path d="M211 88 26 238l130 26 94-133z" fill={`url(#${id}-beam)`} />
        <ellipse cx="118" cy="226" rx="104" ry="28" fill={`url(#${id}-pool)`} />
      </g>
      <ellipse cx="300" cy="254" rx="34" ry="6" fill="#000" opacity=".4" />
      <path d="M270 252c0-8 14-12 30-12s30 4 30 12z" fill={`url(#${id}-metal)`} stroke="#18261e" />
      <path d="M300 242 318 150" stroke="#0c1712" strokeWidth="7" strokeLinecap="round" /><path d="M300 242 318 150" stroke={`url(#${id}-metal)`} strokeWidth="4" strokeLinecap="round" />
      <path d="m305 226 6-4-4-6 6-4-4-6 6-4-4-6 6-4-4-6 6-4" stroke="#8c9a8c" strokeWidth="1.1" />
      <path d="M318 150 250 92" stroke="#0c1712" strokeWidth="7" strokeLinecap="round" /><path d="M318 150 250 92" stroke={`url(#${id}-metal)`} strokeWidth="4" strokeLinecap="round" />
      <circle cx="318" cy="150" r="6" fill="#1c2a22" stroke="#9aa99a" /><circle cx="250" cy="92" r="6" fill="#1c2a22" stroke="#9aa99a" />
      <g transform="translate(250 92) rotate(48)">
        <path d="M-9-4h18l20 30h-58z" fill="#20372c" stroke="#0a140f" strokeWidth="1.5" /><path d="M-7-2h8l-12 26h-6z" fill="#fff" opacity=".08" />
        <ellipse cy="26" rx="29" ry="5" fill="#ffe7b0" className="patch-decor-bulb-glow" />
      </g>
    </svg>
  </div>;
}
