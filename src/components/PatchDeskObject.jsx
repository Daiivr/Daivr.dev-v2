import { useId } from "react";

// Local SVG materials stay sharp at every size without bitmap downloads or noise filters.
export function PatchDeskObject({ kind }) {
  const id = useId().replace(/:/g, "");
  const paint = (material) => `url(#${id}-${material})`;
  const common = { viewBox: "0 0 240 180", fill: "none", "aria-hidden": true, focusable: false };
  const materials = <defs>
    <linearGradient id={`${id}-plastic`} x2=".25" y2="1"><stop stopColor="var(--patch-plastic-1, #5e6b66)" /><stop offset=".12" stopColor="var(--patch-plastic-2, #36433e)" /><stop offset=".8" stopColor="var(--patch-plastic-3, #23302c)" /><stop offset="1" stopColor="var(--patch-plastic-4, #14201e)" /></linearGradient>
    <linearGradient id={`${id}-blue`} x2=".2" y2="1"><stop stopColor="var(--patch-blue-1, #657887)" /><stop offset=".18" stopColor="var(--patch-blue-2, #3b5360)" /><stop offset=".8" stopColor="var(--patch-blue-3, #263944)" /><stop offset="1" stopColor="var(--patch-blue-4, #17282e)" /></linearGradient>
    <linearGradient id={`${id}-paper`} x2="1" y2=".2"><stop stopColor="#c2b083" /><stop offset=".12" stopColor="#e4d5ab" /><stop offset=".7" stopColor="#d4c397" /><stop offset="1" stopColor="#b1a077" /></linearGradient>
    <linearGradient id={`${id}-metal`} x2="1" y2=".8"><stop stopColor="var(--patch-metal-1, #6f7c77)" /><stop offset=".35" stopColor="var(--patch-metal-2, #c5d0c3)" /><stop offset=".5" stopColor="var(--patch-metal-3, #93a49b)" /><stop offset=".58" stopColor="var(--patch-metal-4, #d1d9ce)" /><stop offset="1" stopColor="var(--patch-metal-5, #66776f)" /></linearGradient>
    <linearGradient id={`${id}-leather`} x2=".3" y2="1"><stop stopColor="#80624a" /><stop offset=".5" stopColor="#5b4433" /><stop offset="1" stopColor="#382b23" /></linearGradient>
    <linearGradient id={`${id}-glass`} x2=".7" y2="1"><stop stopColor="var(--patch-glass-1, #173e35)" /><stop offset=".4" stopColor="var(--patch-glass-2, #061b16)" /><stop offset="1" stopColor="var(--patch-glass-3, #020d0b)" /></linearGradient>
    <linearGradient id={`${id}-shine`} x2="1" y2="1"><stop stopColor="#deede2" stopOpacity=".13" /><stop offset=".48" stopColor="#d4ecdf" stopOpacity=".03" /><stop offset=".49" stopColor="#d4ecdf" stopOpacity="0" /></linearGradient>
    <pattern id={`${id}-grain`} width="13" height="11" patternUnits="userSpaceOnUse"><path d="M1 2h2m6 4h3M4 9h1" stroke="#dbe3cd" strokeOpacity=".1" /><path d="M3 4h2m5 5h2" stroke="#04100b" strokeOpacity=".25" /></pattern>
    <pattern id={`${id}-mesh`} width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 0h4v4H0z" fill="#24352f" /><circle cx="1.5" cy="1.5" r="1" fill="#06110e" /><path d="M0 3.5h4" stroke="#526356" strokeOpacity=".3" strokeWidth=".5" /></pattern>
    <pattern id={`${id}-brushed`} width="12" height="3" patternUnits="userSpaceOnUse"><path d="M0 .5h8m2 2h2" stroke="#f2edcf" strokeOpacity=".18" strokeWidth=".4" /></pattern>
    <pattern id={`${id}-scan`} width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 1h4" stroke="#050d09" strokeOpacity=".35" /></pattern>
  </defs>;
  const screws = (points, color = "#a0aea1") => points.map(([x, y], n) => <g key={n}><circle cx={x} cy={y} r="2" fill="#0b1713" /><circle cx={x} cy={y-.3} r="1.4" fill={color} /><path d={`M${x-1} ${y-.3}h2`} stroke="#253c2f" strokeWidth=".6" /></g>);

  if (kind === "monitor") return <svg {...common}>{materials}
    <ellipse cx="122" cy="163" rx="82" ry="8" fill="#000" opacity=".35" />
    <path d="M109 124h23l4 27h-31z" fill={paint("plastic")} stroke="#59675a" /><path d="M89 149h64l12 11H78z" fill={paint("metal")} stroke="#30483a" /><path d="M81 159h82v4H81z" fill="#1c2b22" />
    <path d="M21 13h199v115l-7 8H28l-7-8z" fill="#13221c" stroke="#182b22" strokeWidth="2" /><path d="M22 12h197v116H22z" fill={paint("plastic")} stroke="#738477" />
    <path d="M22 12h197v116H22z" fill={paint("grain")} /><path d="M26 16h189M26 16v106" stroke="#b1bc9c" strokeOpacity=".25" />
    <path d="M32 23h176v83H32z" fill="#020a08" stroke="#15271d" strokeWidth="4" /><rect x="35" y="26" width="170" height="77" rx="4" fill={paint("glass")} stroke="#476357" />
    <path d="M39 29h162v71H39z" fill={paint("shine")} /><text x="48" y="45" fill="currentColor" fontSize="9" fontFamily="monospace">DAI.EXE / LIVE BUILD</text>
    <path d="m49 58 8 6-8 6m16 0h10" stroke="currentColor" strokeWidth="2.5" /><path d="M85 63h83M49 83h39m8 0h47M49 91h103" stroke="currentColor" strokeOpacity=".3" strokeWidth="2" />
    <path d="M36 27h168v74H36z" fill={paint("scan")} /><path d="M43 115h76" stroke="#14251c" strokeWidth="4" />{Array.from({length: 13}, (_, n) => <path key={n} d={`M${44+n*6} 112v6`} stroke="#7c8a73" strokeOpacity=".35" />)}
    <path d="M157 113h17v6h-17z" fill="#233a2b" stroke="#70876b" /><circle cx="190" cy="116" r="4" fill="#13291b" stroke="#668a62" /><circle cx="190" cy="116" r="1.6" fill="currentColor" />{screws([[28,19],[212,19],[28,122],[212,122]])}
    <path d="M61 164h121l19 12H42z" fill={paint("plastic")} stroke="#667567" /><path d="M66 166h111l11 7H54z" fill="#13211b" />{[0,1,2].map((row) => <g key={row}>{Array.from({length: 13}, (_, col) => <path key={col} d={`M${66+col*8-row*3} ${166+row*2.4}h6l2 1.6h-7z`} fill="#748374" opacity={row === 2 ? .7 : 1} />)}</g>)}
  </svg>;

  if (kind === "notebook") return <svg {...common}>{materials}
    <ellipse cx="118" cy="151" rx="92" ry="10" fill="#000" opacity=".26" />
    <path d="m36 39 82-17 88 13v118l-86-9-84 13z" fill={paint("leather")} stroke="#281c16" strokeWidth="3" /><path d="m41 42 77-15 83 12v109l-81-8-79 12z" stroke="#af8d60" strokeWidth=".6" strokeDasharray="2 3" />
    <path d="m44 37 74-13 79 10v109l-77-9-76 13z" fill="#a49570" stroke="#7f7256" /><path d="m45 141 74-12 77 10m-150 5 73-12 77 10" stroke="#eee1b5" strokeWidth=".7" />
    <path d="m45 31 74-12 77 12v108l-77-11-74 13z" fill={paint("paper")} stroke="#eadcaa" strokeWidth=".8" /><path d="m45 31 74-12 77 12v108l-77-11-74 13z" fill={paint("grain")} />
    <path d="m113 22 6-3 6 1v108l-6-1-6 1z" fill="#645539" opacity=".3" /><path d="M119 23v105" stroke="#6b5a40" strokeOpacity=".45" />
    <path d="m54 47 51-8m-51 20 51-8m-51 20 51-8m-51 20 51-8m-51 20 51-8m-51 20 51-8m-51 20 51-8m25-78 51 8m-51 4 51 8m-51 4 51 8m-51 4 51 8m-51 4 51 8m-51 4 51 8" stroke="#877856" strokeOpacity=".3" strokeWidth=".7" />
    <path d="m58 43 29-4m-29 17 40-6m-40 18 32-4m-32 16 40-5m-40 17 19-3m45-43 34 5m-34 7 29 4m-29 8 35 5" stroke="#5a5946" strokeWidth="1.6" strokeLinecap="round" />
    <path d="m144 101 8 8 19-19" stroke="#718061" strokeWidth="3" /><path d="m175 29 21 2v19l-15-14z" fill="#f0e4c0" /><path d="m175 29 6 8 15 13" stroke="#ac9b76" />
    <path d="m119 20 9 1v30l-5-5-4 4z" fill="#9f5644" /><path d="M122 21v20" stroke="#ce8569" strokeWidth=".7" />
    <g transform="rotate(16 191 102)"><path d="M187 58h7v87l-3.5 13-3.5-13z" fill="#c89f55" stroke="#725536" /><path d="M187 66h2v77h-2z" fill="#efd58a" /><path d="M189 147h3l-1.5 10z" fill="#273024" /><path d="M186.5 62h8v8h-8z" fill={paint("metal")} /><path d="M187 56h7v7h-7z" fill="#b67769" /></g>
    <circle cx="73" cy="109" r="13" stroke="#8a6c3b" strokeWidth="3" opacity=".06" />
  </svg>;

  if (kind === "cartridges") return <svg {...common}>{materials}
    <ellipse cx="123" cy="159" rx="95" ry="11" fill="#000" opacity=".3" />
    <g transform="translate(21 22) rotate(-12 65 66)"><path d="M9 7h105l10 12v115H0V19z" fill="#14252d" stroke="#0b1518" strokeWidth="3" /><path d="M8 3h105l10 12v112H0V15z" fill={paint("blue")} stroke="#79989f" /><path d="M8 3h105l10 12v112H0V15z" fill={paint("grain")} /><path d="M12 16h97v70H12z" fill="#bcad87" stroke="#243832" strokeWidth="2" /><path d="M17 21h87v48H17z" fill="#253b54" /><path d="m18 65 22-28 13 15 16-18 35 31z" fill="#89909c" /><path d="m18 65 23-16 18 17 22-22 23 23z" fill="#485e63" /><path d="M81 25h10v9H81z" fill="#decea1" /><text x="23" y="80" fill="#34413d" fontSize="8" fontFamily="monospace">SIDE QUEST / 01</text><path d="M13 92h97m-97 5h97" stroke="#122732" /><path d="M24 104h74v18H24z" fill="#12201d" />{Array.from({length:7},(_,n)=><path key={n} d={`M${30+n*10} 106v13`} stroke="#b1a473" strokeWidth="3" />)}{screws([[6,20],[117,20],[7,117],[116,117]],"#779399")}</g>
    <g transform="translate(107 27) rotate(9 61 67)"><path d="M8 9h105l10 12v112H0V21z" fill="#0b1b16" stroke="#07110d" strokeWidth="3" /><path d="M8 3h105l10 12v112H0V15z" fill={paint("plastic")} stroke="#81917c" /><path d="M8 3h105l10 12v112H0V15z" fill={paint("grain")} /><path d="M12 16h98v70H12z" fill={paint("paper")} stroke="#202f21" strokeWidth="2" /><path d="M17 21h88v48H17z" fill="#29383c" />
    <path d="M44 34h37v26H44zM36 42h8v15h-8zm45 0h8v15h-8z" fill="#8e9d8a" /><path d="M47 45h15m-7-7v15" stroke="#1d362c" strokeWidth="3" /><circle cx="76" cy="42" r="2" fill="#dbb966" /><circle cx="82" cy="50" r="2" fill="#aa6555" /><text x="21" y="80" fill="#485044" fontSize="8" fontFamily="monospace">ONE MORE ROUND</text><path d="m99 16 11 0v10z" fill="#b5a67c" />
    <path d="M13 92h97m-97 5h97" stroke="#12251a" /><path d="M24 104h74v18H24z" fill="#102119" />{Array.from({length:7},(_,n)=><path key={n} d={`M${30+n*10} 106v13`} stroke="#c5b17a" strokeWidth="3" />)}{screws([[6,20],[117,20],[7,117],[116,117]])}</g>
  </svg>;

  if (kind === "buddy") return <svg {...common}>{materials}
    <ellipse cx="123" cy="158" rx="78" ry="10" fill="#000" opacity=".3" />
    <path d="M89 120h18v26H85v10h29v-34m22-2h-18v26h24v10h-31v-34" fill={paint("metal")} stroke="#355345" /><path d="M89 151h23m7 0h22" stroke="currentColor" strokeOpacity=".35" strokeWidth="2" />
    <path d="M58 51h123l6 6v71H56V57z" fill="#142d22" stroke="#06140f" strokeWidth="3" /><path d="M57 50h124v74H57z" fill={paint("plastic")} stroke="#91a68b" /><path d="M57 50h124v74H57z" fill={paint("grain")} />
    <path d="M67 59h104v55H67z" fill="#020c08" stroke="#476451" strokeWidth="2" /><path d="M71 63h96v47H71z" fill={paint("glass")} /><path d="M72 64h94v45H72z" fill={paint("shine")} /><path d="M85 77h12v5H85zm55 0h12v5h-12zM91 96v6h55v-6" fill="currentColor" /><path d="M71 63h96v47H71z" fill={paint("scan")} />
    <path d="M116 50V34h15" stroke="#7f9a7d" strokeWidth="4" /><path d="M129 26h10v12h-10z" fill="#315d43" stroke="#8bb191" /><path d="M131 28h6v6h-6z" fill="currentColor" />
    <path d="M44 69h10v35H44zm141 0h10v35h-10z" fill={paint("metal")} stroke="#2a4938" /><path d="M44 80h10m-10 13h10m131-13h10m-10 13h10" stroke="#122c1d" strokeWidth="3" />
    <path d="M173 60h5v9h-5z" fill="#e5c873" /><path d="M174 76h3v4h-3zm0 10h3v4h-3z" fill="currentColor" opacity=".5" />{screws([[62,55],[176,55],[62,119],[176,119]])}
    <path d="M207 96v52m0-22-12-7m12-10 14-11" stroke="#587651" strokeWidth="2" /><path d="M207 120c-13 0-15-10-12-14 9 0 13 7 12 14m1-11c0-11 8-18 16-15-1 11-8 17-16 15m-1-7c-7-7-7-17-1-22 7 6 8 15 1 22" fill="#6d8c5c" /><path d="M195 143h24l-4 20h-16z" fill={paint("leather")} stroke="#98765a" /><path d="M194 142h26v5h-26z" fill="#ac8b65" /><path d="M200 150h2v9h-2z" fill="#c09f75" opacity=".3" />
  </svg>;

  if (kind === "radio") return <svg {...common}>{materials}
    <ellipse cx="123" cy="161" rx="87" ry="8" fill="#000" opacity=".3" /><path d="m133 67 41-49" stroke="#263c31" strokeWidth="5" /><path d="m133 66 41-49" stroke={paint("metal")} strokeWidth="3" /><path d="m151 43 3 2m7-15 3 2" stroke="#eef0d9" /><circle cx="174" cy="18" r="3" fill="#a3b5a6" />
    <path d="M74 70V58h87v12" stroke="#111d17" strokeWidth="9" /><path d="M74 70V58h87v12" stroke="#607065" strokeWidth="4" />
    <path d="M38 70h164v88H38z" fill="#17241d" stroke="#0b120d" strokeWidth="3" /><path d="M38 68h164v86H38z" fill={paint("leather")} stroke="#7b6c50" /><path d="M44 73h152v75H44z" fill={paint("plastic")} stroke="#8b9682" /><path d="M44 73h152v75H44z" fill={paint("grain")} />
    <path d="M51 80h65v61H51z" fill={paint("mesh")} stroke="#0d1913" strokeWidth="2" /><circle cx="83" cy="110" r="25" stroke="#0e2218" strokeWidth="3" opacity=".5" />
    <path d="M123 80h66v27h-66z" fill="#17231a" stroke="#a1ac8c" /><path d="M126 83h60v20h-60z" fill="#574f32" /><path d="M128 86h55v12h-55z" fill="#8a8250" opacity=".35" /><path d="M130 88v11m7-11v6m7-6v11m7-11v6m7-6v11m7-11v6m7-6v11m7-11v6" stroke="#e4d99c" strokeWidth=".8" /><path d="M153 84v18" stroke="#ea9b66" strokeWidth="2" /><path d="M126 83h60v20h-60z" fill={paint("shine")} />
    <circle cx="137" cy="127" r="13" fill="#0a1710" /><circle cx="137" cy="126" r="11" fill={paint("metal")} stroke="#b0b9a3" /><circle cx="137" cy="126" r="7" fill={paint("plastic")} /><path d="m137 125 3-5" stroke="#dccf93" strokeWidth="1.5" /><path d="M162 119h22v6h-22zm0 12h22v6h-22z" fill="#1c2a20" stroke="#6b7965" /><path d="M163 120h20m-20 12h20" stroke="#a7b096" strokeWidth=".7" />
    <path d="M48 154h13v9H48zm132 0h13v9h-13z" fill="#12251a" />{screws([[47,76],[193,76],[47,145],[193,145]])}
  </svg>;

  return <svg {...common}>{materials}
    <ellipse cx="123" cy="162" rx="72" ry="9" fill="#000" opacity=".28" />
    <g transform="rotate(-8 120 90)"><path d="M61 21h108l14 14v130H61z" fill="#1a2827" stroke="#07130f" strokeWidth="3" /><path d="M59 18h108l14 14v130H59z" fill={paint("blue")} stroke="#7b9290" /><path d="M59 18h108l14 14v130H59z" fill={paint("grain")} />
    <path d="M74 19h84v50H74z" fill={paint("metal")} stroke="#bec8b7" strokeWidth=".7" /><path d="M74 19h84v50H74z" fill={paint("brushed")} /><path d="M128 27h19v34h-19z" fill="#13261f" stroke="#697f70" /><path d="M83 26h29m-29 3h21" stroke="#566f60" strokeOpacity=".4" strokeWidth=".7" />
    <path d="M76 84h88v70H76z" fill="#1b2e25" stroke="#809084" /><path d="M80 88h80v62H80z" fill={paint("paper")} /><path d="M80 88h80v62H80z" fill={paint("grain")} /><path d="M80 89h80v9H80z" fill="#7c8570" /><text x="86" y="115" fill="#444d40" fontSize="10" fontFamily="monospace" fontStyle="italic">FIRST SAVE</text><path d="M87 123h65m-65 10h65m-65 10h65" stroke="#887c58" strokeOpacity=".4" strokeWidth=".6" /><path d="m90 131 26-1m-26 10 35 1" stroke="#6a715b" strokeWidth="1.3" />
    <path d="m148 138 12-2v14h-14z" fill="#eee0b5" /><path d="m148 138-2 12" stroke="#9f956f" /><path d="M65 144h7v10h-7zm104 0h6v10h-6z" fill="#0a1912" stroke="#698270" strokeWidth=".7" /><path d="M64 23v108m3-105v49m-3 62v4" stroke="#acc1ad" strokeOpacity=".12" />
    </g>
  </svg>;
}
