export function PixelLeapFish({ color = "#45d8ff", species = "byte-minnow" }) {
  const striped = ["pixel-perch", "neon-tetra"].includes(species);
  return <svg className="pixel-leap-fish-svg" width="42" height="28" viewBox="0 0 42 28" fill="none" shapeRendering="crispEdges" aria-hidden="true" style={{ "--leap-fish-color": color }}>
    <g className="leap-fish-tail">
      <path d="M15 11H9L3 5H1v7l4 2-4 3v7h3l6-7h5z" fill="#123e51" />
      <path d="M13 12H9L3 7v5l5 3-5 5v2l7-7h3z" fill="var(--leap-fish-color)" />
      <path d="M3 8v3l6 3M3 21l6-6" stroke="#d5faff" strokeOpacity=".5" />
    </g>
    <path d="M17 9V5h4V3h5v6m-7 11v4h7v-5" fill="#277384" />
    <path d="M19 8V6h5v3m-3 11v2h3v-2" fill="var(--leap-fish-color)" />
    <path d="M13 8h18v2h5v3h4v6h-4v3H17v-2h-5v-3h-2v-5h3z" fill="#103344" />
    <path d="M14 10h17v2h5v3h3v3h-4v3H18v-2h-5v-3h-1v-3h2z" fill="var(--leap-fish-color)" />
    <path d="M16 10h14v2H16m-2 1h3v2h-3" fill="#e3fbeb" opacity=".8" />
    <path d="M15 17h8v1h12v2H19v-1h-4" fill="#d3f5d9" />
    <path d="M19 20h15v1H19m16-6h4v2h-4" fill="#143847" opacity=".45" />
    {striped ? <path d="M19 12h2v5h-2m5-5h2v5h-2" fill="#133d54" opacity=".6" /> : <path d="M17 14h2v1h-2m4-3h2v1h-2m1 4h2v1h-2m3-3h2v1h-2" fill="#efffe7" opacity=".45" />}
    <path d="M30 11h5v5h-5z" fill="#eefff4" /><path d="M33 12h2v3h-2" fill="#051c2b" /><path d="M36 17h3v1h-3" fill="#103344" />
    <path className="leap-fish-fin" d="M26 16h5v2h-2v3h-3z" fill="#256374" />
  </svg>;
}
