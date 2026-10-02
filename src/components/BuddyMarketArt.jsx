// Shared pixel silhouettes: the stand, catalogue, wardrobe and room use the
// same artwork so a purchase looks like the item Buddy actually receives.
export function BuddyMarketArt({ id }) {
  switch (id) {
    case "market-beanie": return <g shapeRendering="crispEdges">
      <path d="M9 2h6v3h3v3h2v8h2v6H2v-6h2V8h2V5h3z" fill="#193b32" />
      <path d="M8 6h8v3h3v9H5V9h3z" fill="#6d9670" />
      <path d="M8 8h1v9H8m3-10h1v10h-1m3-9h1v9h-1m3-7h1v7h-1" fill="#a8bd85" />
      <path d="M3 17h18v4H3z" fill="#45664c" /><path d="M4 17h16v1H4zM10 2h4v3h-4z" fill="#c4d19b" />
      <path d="M15 18h3v3h-3z" fill="#d8af73" />
    </g>;
    case "market-vest": return <g shapeRendering="crispEdges">
      <path d="M4 2h5v3h6V2h5v6h3v14H1V8h3z" fill="#443a29" />
      <path d="M5 3h3v3h3v15H3V9h2m11-6h3v6h2v12h-8V6h3z" fill="#b98c54" />
      <path d="M5 4h2v4H5m12-4h2v4h-2M4 11h6v6H4m10-6h6v6h-6" fill="#d6b580" />
      <path d="M5 12h4v1H5m10-1h4v1h-4M4 18h6v1H4m10-1h6v1h-6" fill="#806347" />
      <path d="M11 7h2v14h-2z" fill="#efe0b5" />
    </g>;
    case "market-lantern": return <g shapeRendering="crispEdges">
      <path d="M8 1h8v2h2v5h-2V3H8v5H6V3h2zM5 8h14v3h2v9h-2v3H5v-3H3v-9h2z" fill="#344d47" />
      <path d="M6 11h12v8H6z" fill="#bd8749" /><path d="M8 11h8v8H8z" fill="#ffd57e" />
      <path d="M10 12h3v6h-3z" fill="#fff3bc" /><path d="M5 8h14v2H5m0 10h14v2H5" fill="#8a9b78" />
      <path d="M6 11h1v8H6m11-8h1v8h-1" fill="#e0b36b" />
    </g>;
    case "market-terrarium": return <g shapeRendering="crispEdges">
      <path d="M7 1h10v3h2v3h2v14H3V7h2V4h2z" fill="#285451" /><path d="M5 7h14v12H5z" fill="#4a7b70" />
      <path d="M5 17h14v3H5z" fill="#51613d" /><path d="M6 16h4v2H6m8-3h4v3h-4" fill="#91b274" />
      <path d="M10 11h2v6h-2m4-4h1v4h-1" fill="#f1dbb1" /><path d="M8 10h6v3H8m5 0h5v2h-5" fill="#d48777" />
      <path d="M9 10h2v1H9m5 3h1v1h-1M6 7h2v7H6m1-9h10v2H7" fill="#c4e1ca" /><path d="M7 2h10v3H7z" fill="#a57d50" />
    </g>;
    case "market-moon": return <g shapeRendering="crispEdges">
      <path d="M10 1h7v2h-5v3h-2v6h2v3h5v-2h3v5h-3v3H8v-3H5v-3H3V7h2V4h3V2h2z" fill="#bc9557" />
      <path d="M9 4h3v2h-2v7h2v3h5v-1h2v3h-3v2H9v-3H6v-3H4V8h2V5h3z" fill="#ffdc92" />
      <path d="M7 6h2v2H7v6H5V8h2z" fill="#fff0c9" /><path d="M8 21h10v2H8z" fill="#668678" />
      <path d="M18 3h2v2h2v2h-2v2h-2V7h-2V5h2z" fill="#fff0c9" />
    </g>;
    case "market-arcade": return <g shapeRendering="crispEdges">
      <path d="M4 1h16v13h2v9H2v-9h2z" fill="#302e46" /><path d="M5 2h14v4H5z" fill="#d991af" />
      <path d="M6 7h12v8H6z" fill="#79aaab" /><path d="M7 8h10v6H7z" fill="#172e3d" />
      <path d="M9 10h2v2H9m4-3h2v2h-2m-3 3h4v1h-4" fill="#9de0b4" />
      <path d="M4 16h16v3H4z" fill="#766c94" /><path d="M6 16h2v2H6m8 0h2v1h-2" fill="#ffd787" />
      <path d="M5 20h14v2H5z" fill="#526c72" /><path d="M7 3h10v1H7z" fill="#ffe3b8" />
    </g>;
    default: return null;
  }
}

export function MarketItemIcon({ id, className = "" }) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><BuddyMarketArt id={id} /></svg>;
}

export function MarketStandArt({ open, items = [] }) {
  return <svg viewBox="0 0 144 102" aria-hidden="true" className="market-stand-art" shapeRendering="crispEdges">
    <ellipse cx="74" cy="98" rx="65" ry="3" fill="#031917" opacity=".65" />
    <path d="M20 29h6v66h-6m94-66h6v66h-6" fill="#4f3b2b" /><path d="M21 30h2v63h-2m92-63h2v63h-2" fill="var(--stand-wood-light, #b38a55)" />
    <path d="M29 12h84v4h7v6h7v7h5v8H12v-8h5v-7h6v-6h6z" fill="#244e43" />
    <path d="M30 14h82v3h7v6h7v7H18v-7h7v-6h5z" fill="var(--stand-canvas, #c0b78c)" />
    {[0, 1, 2, 3].map((i) => <path key={i} d={`M${32 + i * 22} 14h10l${i - 1} 16h-14z`} fill="var(--stand-awning, #477560)" />)}
    <path d="M18 24h108v1H18m-3 6h114v4H15" fill="#142f2a" opacity=".28" />
    {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${12 + i * 15} 31h15v7h-2v3h-11v-3h-2z`} fill={i % 2 ? "#b7b28b" : "#3d6654"} />)}
    <path d="M32 7h80v12H32z" fill="#392c24" /><path d="M34 8h76v9H34z" fill="var(--stand-wood, #82613f)" />
    <path d="M37 10h13v1H37m57 4h12v1H94" fill="var(--stand-wood-grain, #b09260)" />
    <text x="72" y="15" textAnchor="middle" fill="var(--stand-lettering, #f7e4b5)" fontSize="6" fontFamily="monospace" letterSpacing="1">WOODLAND GOODS</text>
    {open ? <>
      {items.map((item, index) => <g key={item.id} transform={`translate(${33 + index * 27} 44)`}><path d="M-2 17h24v4H-2z" fill="#b39360" /><g transform="scale(.72)"><BuddyMarketArt id={item.id} /></g></g>)}
    </> : <><path d="M27 42h87v23H27z" fill="#48584a" />{[45, 51, 57, 63].map((y) => <path key={y} d={`M28 ${y}h85v1H28z`} fill="#273e34" />)}</>}
    <path d="M17 64h111v7H17z" fill="#372d25" /><path d="M18 64h109v3H18z" fill="var(--stand-wood-light, #c19b65)" />
    <path d="M24 71h97v22H24z" fill="var(--stand-wood, #765137)" />
    {[73, 81, 89].map((y) => <g key={y}><path d={`M25 ${y}h95v1H25z`} fill="var(--stand-wood-grain, #ac8151)" /><path d={`M25 ${y + 6}h95v1H25z`} fill="#483729" /></g>)}
    <path d="M31 76h15v1H31m7 1h14v1H38m50 6h23v1H88m-54 7h24v1H34m55-16h12v1h-12M25 70h3v23h-3m88-23h3v23h-3" fill="var(--stand-wood-grain, #c09a62)" opacity=".65" />
    {open ? items.map((item, index) => <g key={item.id} transform={`translate(${31 + index * 28} 73)`}><path d="M3-3h1v5H3m14-5h1v5h-1" fill="#dbc48b" /><path d="M0 1h23v12H0z" fill="#3d2e21" /><path d="M1 2h21v10H1z" fill="#aa8351" /><text x="11" y="10" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#ffefba">{item.price}</text></g>) : <><path d="M51 73h42v15H51z" fill="#322c25" /><path d="M53 75h38v11H53z" fill="#584738" /><text x="72" y="83" textAnchor="middle" fontSize="7" letterSpacing="1" fontFamily="monospace" fill="var(--stand-lettering, #ffe2a5)">CLOSED</text></>}
    <path d="M21 92h103v4H21m8 0h5v4h-5m78-4h5v4h-5" fill="#45392b" />
    <path d="M9 71h12v25H7V74h2z" fill="var(--stand-wood, #6e5035)" /><path d="M8 78h13v2H8m0 9h13v2H8" fill="var(--stand-wood-light, #b49560)" />
    <path d="M9 68h10v4H9m1-8h3v5h-3m4-8h2v8h-2" fill="#759463" />
    <path d="M120 42h11v3h-11m5-8h1v6h-1" fill="#ac945e" /><path d="M120 45h11v13h-11z" fill="#3b4838" />
    <path className={open ? "market-lantern-lit" : ""} d="M122 47h7v8h-7z" fill={open ? "#ffd68b" : "#8f8961"} />
    <path d="M122 56h7v2h-7m2-12h2v10h-2" fill="#998354" />
    <path d="M126 84h11v12h-11z" fill="var(--stand-wood, #96704b)" /><path d="M128 86h7v8h-7z" fill="#594330" /><path d="M129 80h5v5h-5z" fill="#799661" />
  </svg>;
}
