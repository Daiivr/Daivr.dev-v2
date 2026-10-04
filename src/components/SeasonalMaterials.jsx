// Local SVG materials stay crisp at every viewport size. Grain is applied only
// to the small props, never to a full-screen surface or an animated filter.
const MATERIALS = {
  pumpkin: ["#ffbd64", "#dd782c", "#71321f"],
  bark: ["#977d87", "#51404e", "#241e2d"],
  brass: ["#ead09a", "#9c7441", "#3b2c26"],
  snow: ["#f0faff", "#b7d6e7", "#678eaa"],
  pine: ["#689591", "#315b61", "#142f41"],
  wood: ["#a08472", "#68504a", "#342d37"],
  pink: ["#f2b6c9", "#bd678e", "#6f365d"],
  purple: ["#c8b0df", "#8f6bad", "#493956"],
  teal: ["#d0f8e7", "#83c5c0", "#387b86"],
  gold: ["#fff0bd", "#c89f55", "#6c4a2a"],
  paper: ["#f5ecd1", "#d6caaa", "#a1947c"],
  plastic: ["#92a8b7", "#4f6a81", "#283548"],
  silver: ["#edf3f3", "#9dabb6", "#526171"],
  wax: ["#ffeed0", "#d4b896", "#8f6b60"],
};

export function SeasonalMaterials({ id, materials }) {
  return <defs>
    {materials.map(name => <linearGradient key={name} id={`${id}-${name}`} x1="0" y1="0" x2="1" y2=".65">
      <stop stopColor={MATERIALS[name][0]} /><stop offset=".42" stopColor={MATERIALS[name][1]} /><stop offset="1" stopColor={MATERIALS[name][2]} />
    </linearGradient>)}
    <radialGradient id={`${id}-glow`}><stop stopColor="#ffe8ad" stopOpacity=".46" /><stop offset=".35" stopColor="#fbb557" stopOpacity=".19" /><stop offset="1" stopColor="#ee8c42" stopOpacity="0" /></radialGradient>
    <linearGradient id={`${id}-fire`} x2="0" y2="1"><stop stopColor="#fff5cb" /><stop offset=".55" stopColor="#ffd16d" /><stop offset="1" stopColor="#d87a2a" /></linearGradient>
    <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="3" stitchTiles="stitch" seed="8" result="noise" />
      <feColorMatrix in="noise" type="saturate" values="0" />
      <feComponentTransfer><feFuncA type="linear" slope=".23" /></feComponentTransfer>
      <feBlend in="SourceGraphic" mode="soft-light" />
      <feComposite in2="SourceGraphic" operator="in" />
    </filter>
  </defs>;
}
