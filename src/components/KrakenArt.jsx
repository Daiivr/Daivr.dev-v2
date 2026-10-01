import { useId } from "react";

const ARMS = [
  "M168 96C135 83 101 94 72 65S34 32 28 52S40 78 49 61",
  "M157 103C116 104 96 129 58 111S14 95 19 77",
  "M160 113C136 136 96 117 77 135S39 146 42 130",
  "M175 117C150 125 158 150 126 143S100 135 105 127",
  "M194 97C225 83 251 91 274 55S307 23 320 41S310 68 303 52",
  "M203 105C243 103 261 130 292 105S339 96 337 76",
  "M201 114C233 129 250 115 273 133S312 145 315 125",
  "M186 119C200 133 203 150 224 139S246 137 245 127"
];
const GRIPS = ["M161 106C116 72 88 98 68 119S27 123 27 146C27 158 43 159 46 149", "M202 106C241 76 271 97 291 120S334 123 334 146C334 158 319 159 315 149"];
const MANTLE = "M139 98V67l7-15V39l14-13 12-18h14l10 13 16 12v19l10 17v28l-13 17-26 8-28-8z";

export function KrakenArt() {
  const id=useId().replace(/:/g, "");
  const paint=name=>`url(#${id}-${name})`;
  const arm=(d,i,grip=false)=><g className={grip ? `kraken-grip-arm grip-${i}` : `kraken-arm arm-${i}`} key={i} style={{"--arm-i":i}}>
    <path d={d} fill="none" stroke="#171722" strokeWidth="22" strokeLinecap="round"/>
    <path d={d} fill="none" stroke="#8f7d9c" strokeWidth="18" strokeLinecap="round"/>
    <path d={d} fill="none" stroke={paint('arm')} strokeWidth="14" strokeLinecap="round"/>
    <path d={d} fill="none" stroke={paint('skin')} strokeWidth="13" strokeLinecap="round"/>
    <path className="kraken-suckers" d={d} fill="none" stroke="#b896a8" strokeWidth="5" strokeDasharray="1 10" strokeLinecap="round"/>
    <path d={d} fill="none" stroke="#483749" strokeWidth="2" strokeDasharray="1 10" strokeLinecap="round"/>
  </g>;
  return <g className="kraken-creature">
    <defs>
      <linearGradient id={`${id}-arm`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#a08ba1"/><stop offset=".3" stopColor="#65506f"/><stop offset=".7" stopColor="#392e49"/><stop offset="1" stopColor="#201f32"/></linearGradient>
      <linearGradient id={`${id}-mantle`} x1="0" y1="0" x2="1" y2=".7"><stop stopColor="#ae919f"/><stop offset=".28" stopColor="#75627e"/><stop offset=".6" stopColor="#49394f"/><stop offset="1" stopColor="#252339"/></linearGradient>
      <pattern id={`${id}-skin`} width="11" height="9" patternUnits="userSpaceOnUse"><path d="M1 2h3v2H1zM7 6h2v1H7z" fill="#d4b9ba" opacity=".23"/><path d="M5 1h2v3H5zM1 7h3v1H1zM9 3h1v2H9z" fill="#160f24" opacity=".38"/></pattern>
    </defs>
    <g className="kraken-free-arms">{ARMS.map((d,i)=>[1,5].includes(i) ? null : arm(d,i))}</g>
    <g className="kraken-grips">{GRIPS.map((d,i)=>arm(d,i,true))}</g>
    <g className="kraken-mantle-rise"><g className="kraken-mantle">
      <path d={MANTLE} fill={paint('mantle')} stroke="#a592a3" strokeWidth="2"/>
      <path d="M148 77V58l9-15V33l16-19h5l-9 26-3 22-8 18z" fill="#b2929d" opacity=".65"/>
      <path d="M180 16l-6 23 3 23-4 14h9l7-17-5-23 3-13zM205 49l10 18v28l-8 9V78l-6-13z" fill="#291e38" opacity=".6"/>
      <path d="M154 39l5-5m-9 23 5-6m37-21 5 6m-38 33 3-7m31 2 4 6" stroke="#cfb0ac" strokeWidth="2" opacity=".6"/>
      <path d={MANTLE} fill={paint('skin')}/>
      <path d="M150 102h18v5h-15m36-5h21l-5 5h-16M166 113h26v3h-26" fill="#80667a"/>
      <path className="kraken-runes" d="M174 24h5v4h-5m-15 21h4v4h-4m29-3h4v4h-4m-16 5h5v5h-5m-29 9h4v4h-4m60 2h4v4h-4" fill="#baf4dc"/>
      <path d="M145 80h26v16h-26zM187 80h27v16h-27z" fill="#101720"/>
      <g className="leviathan-eye"><path d="M150 84h18v9h-18zM190 84h18v9h-18z" fill="#edc57a"/><path d="M160 84h4v9h-4zM200 84h4v9h-4z" fill="#382c43"/><path d="M152 84h3v3h-3zM192 84h3v3h-3z" fill="#fff3c1"/></g>
      <path d="M145 78h13v3h13v3h-17v-3h-9M187 83h13v-3h14v-3h-15v3h-12" fill="#aa8d96"/>
      <path d="M173 98h13v8l-6 9-7-9z" fill="#121824"/><path d="M175 98h9v3h-9z" fill="#c8be9e"/>
    </g></g>
    <g className="kraken-grip-sparks" fill="#b2ddd1"><path d="M18 148h3v3h-3m19 0h2v3h-2m286-4h3v3h-3m16-2h2v4h-2"/></g>
  </g>;
}
