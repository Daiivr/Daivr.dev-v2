import { goodsImage } from "../lib/pixelWorld/marketGoods";

// Las piezas del mercado son los sprites de pixel de pixelWorld/marketGoods.js
// (los mismos del inventario y las baldas del cuarto), asi que lo que se
// compra es lo que Buddy recibe. En la ficha van a escala entera.
export function MarketItemIcon({ id, className = "", scale = 4 }) {
  const art = goodsImage(id);
  if (!art) return null;
  return <img className={`market-item-art ${className}`.trim()} src={art.url} width={art.w * scale} height={art.h * scale} alt="" aria-hidden="true" draggable="false" />;
}

// Dentro de un SVG (inventario, coleccion, el puesto en miniatura): centrada
// en una caja cuadrada de `size`, sin deformarse.
export function MarketItemImage({ id, x = 0, y = 0, size = 24 }) {
  const art = goodsImage(id);
  if (!art) return null;
  const k = size / Math.max(art.w, art.h), w = art.w * k, h = art.h * k;
  return <image href={art.url} x={x + (size - w) / 2} y={y + (size - h) / 2} width={w} height={h} style={{ imageRendering: "pixelated" }} />;
}

// El puesto en miniatura de la cabecera: las piezas del dia sobre el
// mostrador, con su precio colgando debajo.
export function MarketStandArt({ open, items = [] }) {
  const slot = 87 / Math.max(3, items.length), start = 27 + (87 - slot * items.length) / 2;
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
    {open ? items.map((item, index) => <g key={item.id} transform={`translate(${Math.round(start + index * slot)} 44)`}><path d={`M0 17h${Math.round(slot) - 2}v4H0z`} fill="#b39360" /><MarketItemImage id={item.id} x={(slot - 2 - 18) / 2} y={0} size={18} /></g>)
      : <><path d="M27 42h87v23H27z" fill="#48584a" />{[45, 51, 57, 63].map((y) => <path key={y} d={`M28 ${y}h85v1H28z`} fill="#273e34" />)}</>}
    <path d="M17 64h111v7H17z" fill="#372d25" /><path d="M18 64h109v3H18z" fill="var(--stand-wood-light, #c19b65)" />
    <path d="M24 71h97v22H24z" fill="var(--stand-wood, #765137)" />
    {[73, 81, 89].map((y) => <g key={y}><path d={`M25 ${y}h95v1H25z`} fill="var(--stand-wood-grain, #ac8151)" /><path d={`M25 ${y + 6}h95v1H25z`} fill="#483729" /></g>)}
    <path d="M31 76h15v1H31m7 1h14v1H38m50 6h23v1H88m-54 7h24v1H34m55-16h12v1h-12M25 70h3v23h-3m88-23h3v23h-3" fill="var(--stand-wood-grain, #c09a62)" opacity=".65" />
    {open ? items.map((item, index) => { const w = Math.round(slot) - 3; return <g key={item.id} transform={`translate(${Math.round(start + index * slot)} 73)`}><path d={`M3-3h1v5H3m${w - 7}-5h1v5h-1`} fill="#dbc48b" /><path d={`M0 1h${w}v12H0z`} fill="#3d2e21" /><path d={`M1 2h${w - 2}v10H1z`} fill="#aa8351" /><text x={w / 2} y="10" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#ffefba">{item.price}</text></g>; })
      : <><path d="M51 73h42v15H51z" fill="#322c25" /><path d="M53 75h38v11H53z" fill="#584738" /><text x="72" y="83" textAnchor="middle" fontSize="7" letterSpacing="1" fontFamily="monospace" fill="var(--stand-lettering, #ffe2a5)">CLOSED</text></>}
    <path d="M21 92h103v4H21m8 0h5v4h-5m78-4h5v4h-5" fill="#45392b" />
    <path d="M9 71h12v25H7V74h2z" fill="var(--stand-wood, #6e5035)" /><path d="M8 78h13v2H8m0 9h13v2H8" fill="var(--stand-wood-light, #b49560)" />
    <path d="M9 68h10v4H9m1-8h3v5h-3m4-8h2v8h-2" fill="#759463" />
    <path d="M120 42h11v3h-11m5-8h1v6h-1" fill="#ac945e" /><path d="M120 45h11v13h-11z" fill="#3b4838" />
    <path className={open ? "market-lantern-lit" : ""} d="M122 47h7v8h-7z" fill={open ? "#ffd68b" : "#8f8961"} />
    <path d="M122 56h7v2h-7m2-12h2v10h-2" fill="#998354" />
    <path d="M126 84h11v12h-11z" fill="var(--stand-wood, #96704b)" /><path d="M128 86h7v8h-7z" fill="#594330" /><path d="M129 80h5v5h-5z" fill="#799661" />
  </svg>;
}
