import "../styles/seasonal-scenery.css";
import { memo, useId } from "react";
import { SeasonalMaterials } from "./SeasonalMaterials";

// Small, static illustrations shared by the entry gate and the cabinet. Keep
// these separate from the lazy canvas effects so the entrance paints at once.
function Sparkles() {
  return <div className="season-sparkles">{Array.from({ length: 16 }, (_, i) => (
    <i key={i} style={{ "--x": `${(i * 43 + 7) % 100}%`, "--y": `${(i * 29 + 9) % 100}%`, "--spark-size": `${i % 3 === 0 ? 7 : 3}px` }} />
  ))}</div>;
}

function Moon({ winter = false }) {
  const id = useId();
  return <svg className="season-scenery-moon" viewBox="0 0 120 120" fill="none">
    <SeasonalMaterials id={id} materials={winter ? ["snow"] : ["gold"]} />
    <g filter={`url(#${id}-grain)`}>
      <circle cx="60" cy="60" r="52" fill={`url(#${id}-${winter ? "snow" : "gold"})`} />
      <circle cx="60" cy="60" r="51" stroke={winter ? "#e4f7ff" : "#ffdb9e"} strokeOpacity=".4" />
      <g fill={winter ? "#668da6" : "#8d623b"} opacity=".3">
        <path d="M26 32q8-15 22-8t3 21-18 0-7-13M64 66q10-14 24-3t0 23-20-3-4-17M21 67q12-4 19 5t-8 12-11-17" />
        <circle cx="37" cy="88" r="5" /><circle cx="84" cy="35" r="6" /><circle cx="54" cy="60" r="3" /><circle cx="73" cy="99" r="3" /><circle cx="96" cy="59" r="4" />
      </g>
      <g stroke={winter ? "#edfcff" : "#fff1c5"} strokeWidth=".7" opacity=".48">
        <path d="M26 35q-3-13 12-15m24 55q-1-13 12-15M31 88q-1-7 6-7M80 37q-4-7 2-9M93 59q-1-5 4-4" />
      </g>
      {Array.from({ length: 32 }, (_, i) => {
        const angle = i * 2.4;
        const radius = 12 + (i * 17) % 34;
        return <circle key={i} cx={60 + Math.cos(angle) * radius} cy={60 + Math.sin(angle) * radius} r={.5 + i % 3 * .4} fill={winter ? "#6a8d9f" : "#79593b"} opacity=".28" />;
      })}
    </g>
  </svg>;
}

function HauntedCorner() {
  const id = useId();
  const paint = name => `url(#${id}-${name})`;
  return <svg className="season-corner-art haunted-corner" viewBox="0 0 360 320" fill="none">
    <SeasonalMaterials id={id} materials={["pumpkin", "bark", "brass", "wax"]} />
    {/* Pools of light connect the props to the floor and weathered trunk. */}
    <ellipse cx="210" cy="295" rx="140" ry="22" fill="#0b0814" opacity=".65" />
    <ellipse cx="191" cy="294" rx="107" ry="30" fill={paint("glow")} />
    <circle cx="270" cy="177" r="64" fill={paint("glow")} />
    <g filter={paint("grain")}>
      <path d="M308 306c-11-24-13-48-9-74 4-29-6-52-5-77l-16-38-27-15-15-25-12-33 4-13 2 19 12 22 13 21 30 13-9-39 2-31 8-23-4 31 2 22 12 28 11-36 9-28 12-22-8 28-7 32-5 39 8-9 15-26 13-14-8 18-11 22-16 26-6 27 3 34-4 40 4 34 8 40 14 18-17-5-11-10-2 13-8-2-6-13-15 8-22 4z" fill={paint("bark")} stroke="#a28b9d" strokeWidth=".65" />
      <g stroke="#a58b96" strokeWidth="1.2" opacity=".6" strokeLinecap="round">
        <path d="M304 282q-6-21-2-46t-3-45m5-13q6-18 2-36t3-43M293 120l-14-12-22-8-16-25m49 22-7-30 1-26m26 67 14-33 11-15" />
        <path d="M312 290q-14-27-6-48m1-36 1-26m-9-14-6-28m-6 145-1 15-13 5" />
      </g>
      <g stroke="#211b28" strokeWidth="1.4" opacity=".8"><path d="M309 153q-9 10-5 27m8 39q-13 6-8 18m-11-74-5-23m19-46 8-32" /><path d="M300 253q10-10 10-20m-14-30 2 16" /></g>
      <path d="M297 189q-7 8-2 14 9 4 9-7t-7-7zm1 4q5-3 4 5t-5 0" stroke="#bc9479" strokeWidth="1" />
      <g stroke="#776071" strokeWidth="1.4" strokeLinecap="round"><path d="m246 89-26-6-21-19m31 19-4-18m59-13-10-18-1-21m52 59 15 1 13-7m-10 23 12-7m-44-47 1-22" /></g>
    </g>
    {/* A fine web hangs between branches, with a few catches of lamplight. */}
    <g stroke="#dcc8e4" strokeWidth=".55" opacity=".32">
      <path d="m245 91 51 53m-51-53 59 31m-59-31 61 11M257 104q7-4 1-7m9 18q9-8 1-14 4-8 0-9m11 34q9-12 0-20 4-9 0-12m9 44q11-15 0-27 5-10 0-15" />
    </g>
    <path d="M267 108v29" stroke="#a78d6b" strokeWidth="1.2" strokeDasharray="2 1" />
    <g className="season-lantern">
      <path d="M262 145v-5a5 5 0 0 1 10 0v5" stroke="#d1b57d" strokeWidth="2" />
      <path d="m245 156 22-15 22 15-6 46h-32z" fill={paint("brass")} stroke="#d7b277" strokeWidth="1" />
      <path d="m250 159 17-5 17 5-5 38h-24z" fill="#392720" />
      <path d="m255 162 12-4 12 4-3 31h-18z" fill={paint("fire")} opacity=".48" />
      <path d="M259 190q-5-9 6-20-2 9 6 13 5 8-4 10z" fill={paint("fire")} />
      <path d="M263 185q2-6 4-7-1 6 2 9 1 4-3 5-4-1-3-7" fill="#fff8d7" />
      <path d="m247 156 20-6 20 6m-20-5v48m-15-34 4 30m24-30-4 30" stroke="#e5c18b" strokeWidth="1.1" />
      <path d="m247 156 20 4 20-4m-36 44h32l4 5h-40z" fill={paint("brass")} stroke="#67482f" />
      <path d="m252 160 3 23m17-23 6 2-2 16" stroke="#ffefc3" strokeWidth="1.5" opacity=".48" />
      <path d="M254 153h26m-25 50h23" stroke="#f9d895" strokeWidth=".8" />
      <g fill="#463627"><circle cx="253" cy="157" r="1" /><circle cx="282" cy="157" r="1" /><circle cx="254" cy="200" r="1" /><circle cx="281" cy="200" r="1" /></g>
    </g>
    {/* Lobes have individual light falloff; the cut edges sit inside the skin. */}
    {[{ x: 119, y: 221, s: 1 }, { x: 226, y: 259, s: .64 }].map(({ x, y, s }) => <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="44" cy="67" rx="49" ry="9" fill="#0c0812" opacity=".65" />
      <g filter={paint("grain")}>
        <path d="M39 14 37 0q1-9 12-11l-4 9 3 17z" fill="#66754b" stroke="#acb580" strokeWidth="1" /><path d="m42 9-1-10 5-6" stroke="#c1c794" strokeWidth="1.2" />
        <ellipse cx="22" cy="39" rx="22" ry="30" fill={paint("pumpkin")} /><ellipse cx="66" cy="39" rx="23" ry="30" fill={paint("pumpkin")} />
        <ellipse cx="32" cy="39" rx="22" ry="33" fill={paint("pumpkin")} /><ellipse cx="56" cy="39" rx="22" ry="33" fill={paint("pumpkin")} /><ellipse cx="44" cy="40" rx="17" ry="34" fill={paint("pumpkin")} />
        <g stroke="#ffcb7e" strokeWidth="1.2" opacity=".48"><path d="M27 14Q10 34 21 58m19-46q-12 22-4 49m20-47q10 7 12 17" /></g>
        <path d="M11 36 30 24l-1 17zm45 4 2-17 18 14zM18 48l16 5 4-7 10 1 3 8 20-7-9 15-13 3-17-2z" fill="#54291f" stroke="#efad59" strokeWidth="1.3" />
        <path d="m15 36 12-7-1 9zm45 0 1-7 11 7zM22 52l12 5 7-7 4 1 3 8 17-6-6 8-12 3-13-3z" fill={paint("fire")} />
        <path d="m43 37-5 7h10z" fill="#74351e" /><path d="m43 39-3 4h6z" fill="#ffd078" />
        <g fill="#6e3a27" opacity=".45"><circle cx="13" cy="45" r="1" /><circle cx="76" cy="47" r="1.2" /><circle cx="66" cy="19" r="1" /><circle cx="33" cy="19" r=".8" /></g>
      </g>
      <path d="M48 8q11-19 24-10t-1 9q-7 1-5-6" stroke="#788252" strokeWidth="1.5" />
    </g>)}
    {[{ x: 85, y: 253, h: 43 }, { x: 104, y: 268, h: 29 }].map(({ x, y, h }) => <g key={x}>
      <ellipse cx={x + 5} cy={y + h} rx="11" ry="3" fill="#b3a092" opacity=".7" />
      <path d={`M${x} ${y}h10v${h}h-10z`} fill={paint("wax")} />
      <path d={`M${x} ${y + 2}q2 3 2 12t3 0v-6q2-4 4 0v-6`} stroke="#ffedcf" strokeWidth="2" />
      <ellipse cx={x + 5} cy={y} rx="5" ry="2" fill="#e8d0b1" /><path d={`M${x + 5} ${y}v-5`} stroke="#352a29" />
      <circle cx={x + 5} cy={y - 8} r="20" fill={paint("glow")} />
      <path d={`M${x + 5} ${y - 4}q-9-6 0-19 0 7 4 10 4 6-4 9`} fill={paint("fire")} />
      <path d={`M${x + 5} ${y - 5}q-4-4 0-8 4 5 0 8`} fill="#fff9df" />
    </g>)}
    <g filter={paint("grain")}>
      {[{ x: 66, y: 302, r: -15 }, { x: 119, y: 303, r: 32 }, { x: 196, y: 293, r: -25 }, { x: 278, y: 310, r: 10 }, { x: 242, y: 309, r: -35 }].map(({ x, y, r }) => <g key={x} transform={`translate(${x} ${y}) rotate(${r})`}>
        <path d="M-9 0-6-5-1-3 2-9 5-3 11-3 7 2 8 6 2 4-3 7-3 3z" fill="#a26b43" /><path d="m-8 3 15-5" stroke="#dca268" strokeWidth=".7" />
      </g>)}
      <path d="M295 300q-5-7-11-1m27-4q5-9 11-4m-33 13-4-9m29 9 7-5" stroke="#85875a" strokeWidth="1.4" />
      <g fill="#766b77"><ellipse cx="206" cy="307" rx="5" ry="2" /><ellipse cx="73" cy="297" rx="3" ry="2" /><ellipse cx="335" cy="308" rx="6" ry="3" /></g>
    </g>
  </svg>;
}

function WinterCorner() {
  const id = useId();
  const paint = name => `url(#${id}-${name})`;
  return <svg className="season-corner-art winter-corner" viewBox="0 0 320 240" fill="none">
    <SeasonalMaterials id={id} materials={["snow", "pine", "wood", "brass"]} />
    <g filter={paint("grain")}>
    <path d="m0 211 71-84 29 34 48-68 76 92 28-23 68 50v28H0z" fill="#274558" opacity=".65" />
    <path d="m52 151 19-24 29 34-26-10-9 9zm74-26 22-32 27 32-21-8-10 12-7-7z" fill={paint("snow")} opacity=".65" />
    <path d="m148 94 7 20-8 17 14 20m-92-23 6 21-9 25m37 11 15-16 3-15" stroke="#87b3c5" strokeWidth=".8" opacity=".5" />
    {[{ x: 240, y: 49, s: 1.1 }, { x: 282, y: 99, s: .82 }, { x: 45, y: 120, s: .65 }].map(({ x, y, s }) => <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 161V18" stroke="#796d66" strokeWidth="6" /><path d="M-1 155V51" stroke="#adc0b5" strokeWidth="1" />
      <path d="M0 0-8 23l-8 9 4 2-14 18 11-2-11 18-13 19 15-1-13 23-13 22 17-3-5 6 15-2-5 6 27-3 17 3-5-6 15 2-5-6 17 3-13-22-13-23 15 1-13-19-11-18 11 2-14-18 4-2-8-9z" fill={paint("pine")} />
      <g fill={paint("snow")}>
        <path d="m0 0-8 23-8 10 5 2-13 14q8 0 13-5l9 2 5-4 7 4 10 3-13-16 5-1-10-13z" />
        <path d="m-15 52-10 16-12 17q9 0 15-4l6 2 13-6 10 3 8-3 10 5 10 3-16-25 7 17-10-6-7 2-10-7-9 7-8-2-5 4z" />
        <path d="m-24 92-13 17-10 19 14-5 6 2 13-7 8 4 12-5 8 5 8-3 11 6 13 3-14-20 8 15-16-10-10 4-9-7-9 6-8-2-13 7z" />
      </g>
      <g stroke="#a4d3d6" strokeWidth=".7" opacity=".6"><path d="m-16 52-5 6m7 6-10 11m43-13 8 11m-40 20-10 17m6-7-7 10m45-17 10 17m-31-27 4 17m-5 24-5 5" /></g>
    </g>)}
    <path d="M0 227q64-25 130-10t190 2v21H0z" fill={paint("snow")} />
    <path d="M0 237q85-18 162-8t158-3v14H0z" fill="#dfedf1" /><path d="M18 229q36-9 65-7m137 13 52-4" stroke="#f5fdff" opacity=".65" />
    <g transform="translate(131 167)">
      <path d="M0 22 28 0l28 22v38H0z" fill={paint("wood")} />
      <path d="M0 32h56M0 39h56M0 47h56M0 55h56m-54-6 12-1m25 9 10 1" stroke="#c7a589" strokeWidth=".8" opacity=".6" />
      <path d="M39 0h8v13l-8-6z" fill="#8c8583" /><path d="M38-2h10v4H38z" fill="#dceaf0" /><path d="m40 5 6 1m-4 0v3" stroke="#4e4a52" strokeWidth=".7" />
      <path d="m-7 24 35-29 35 29-6 5L28 7 0 29z" fill={paint("snow")} />
      <path d="m-5 24 8-3 5-7 7-3 8-8 6-4 12 10 7 4 12 11" stroke="#f6fdff" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M0 27v7m5-11v8m43-10v8m6-3v9" stroke="#badfeb" strokeWidth="1.3" />
      <path d="M22 35h13v25H22z" fill="#253344" stroke="#b49d84" /><path d="M25 38v19m7-19v19" stroke="#7c7e85" strokeWidth=".6" /><circle cx="32" cy="49" r="1" fill="#ecd393" />
      <path d="M5 32h12v14H5zm35 0h12v14H40z" fill={paint("fire")} stroke="#ccb498" />
      <path d="M11 32v14m35-14v14M5 39h12m23 0h12" stroke="#655047" strokeWidth="1.2" />
      <path d="M4 47h14m21 0h14M21 60h15" stroke="#e8f2f4" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 20a4 4 0 1 1 8 0v6h-8z" fill="#e8c98a" stroke="#4d4548" strokeWidth="2" />
    </g>
    <g stroke="#82999f" strokeWidth="1.5"><path d="M83 222v-18m18 21v-16m-22 1 27 5m-27 2 27 5" /></g>
    <path d="m79 209 27 5" stroke="#edf7fa" strokeWidth="2" />
    <g fill="#95b5c7" opacity=".75"><ellipse cx="161" cy="231" rx="2" ry=".7" /><ellipse cx="168" cy="234" rx="2" ry=".8" /><ellipse cx="163" cy="237" rx="2" ry=".8" /></g>
    </g>
    <path d="M174 161q-10-9 0-19t-1-17" stroke="#d7eafa" strokeWidth="5" strokeLinecap="round" opacity=".13" />
    <ellipse cx="158" cy="219" rx="33" ry="14" fill={paint("glow")} />
  </svg>;
}

function Bunting() {
  const id = useId();
  return <svg className="season-bunting" viewBox="0 0 1000 110" preserveAspectRatio="none" fill="none">
    <SeasonalMaterials id={id} materials={["pink", "teal", "gold"]} />
    <g filter={`url(#${id}-grain)`}>
    <path d="M0 6Q500 129 1000 6" stroke="#d5a58a" strokeWidth="2" />
    {Array.from({ length: 15 }, (_, i) => {
      const x = 25 + i * 65;
      const y = 6 + 246 * (x / 1000) * (1 - x / 1000);
      return <g key={i} transform={`translate(${x} ${y}) rotate(${14 - i * 2})`}>
        <path d="M-18 0h36L0 36z" fill={`url(#${id}-${["pink", "teal", "gold"][i % 3]})`} />
        <path d="M-13 4h26L0 29z" stroke="#fff" strokeOpacity=".45" strokeDasharray="2 2" strokeWidth=".75" />
        <path d="M-18 0h36v3h-34" fill="#fff" opacity=".18" /><path d="M0 3v31L5 6z" fill="#fff" opacity=".1" />
      </g>;
    })}
    </g>
  </svg>;
}

function Gifts() {
  const id = useId();
  const paint = name => `url(#${id}-${name})`;
  return <svg className="season-corner-art gift-corner" viewBox="0 0 270 240" fill="none">
    <SeasonalMaterials id={id} materials={["pink", "purple", "teal", "gold", "paper"]} />
    <ellipse cx="145" cy="222" rx="118" ry="12" fill="#110c1d" opacity=".5" />
    <g filter={paint("grain")}>
      <g transform="rotate(-9 75 165)">
        <path d="M24 133h78v78H24z" fill={paint("purple")} /><path d="m102 133 15-12v78l-15 12z" fill="#5c416e" /><path d="m20 123 80-6 21 10-16 15H20z" fill={paint("purple")} stroke="#ceb5df" strokeWidth=".6" />
        <path d="M20 131h85v11H20z" fill="#c19bcc" /><path d="M24 143h78v3H24z" fill="#412842" opacity=".5" />
        <g stroke="#e5c7ed" strokeWidth=".8" opacity=".45"><path d="m31 151 5 8-8-1 7-6-3 9m46-8 4 7-7-1 6-5-3 8m-38 22 4 7-7-1 6-5-3 8m45-8 4 7-7-1 6-5-3 8" /></g>
        <path d="M56 132h15v79H56z" fill={paint("gold")} /><path d="M58 134v74" stroke="#fff2c0" strokeWidth="1" />
        <path d="M63 129q-38-3-29-21 7-13 29 18 15-32 29-24 17 17-29 27" fill={paint("gold")} stroke="#f8dba2" strokeWidth=".8" />
        <path d="M59 125q-15-17-18-12t18 12m9-1q17-6 16-13t-16 13" fill="#8e6740" /><path d="m64 132-15 25 8-1 3 7 10-31" fill={paint("gold")} />
      </g>
      <path d="m126 93 95-9 18 14v109l-18 14h-95z" fill={paint("pink")} /><path d="m221 101 18-3v109l-18 14z" fill="#6e365b" />
      <path d="m120 84 98-10 27 13-22 21H120z" fill={paint("pink")} stroke="#f5c6d7" strokeWidth=".8" /><path d="M120 95h103v13H120z" fill="#e7a1b9" /><path d="M126 109h95v4h-95z" fill="#753a58" opacity=".6" />
      {Array.from({ length: 20 }, (_, i) => <circle key={i} cx={136 + i % 5 * 18} cy={124 + Math.floor(i / 5) * 23} r="1.6" fill="#f2bfd2" opacity=".55" />)}
      <path d="M161 96h18v125h-18z" fill={paint("teal")} /><path d="M163 99v119m13-118v118" stroke="#d6fff0" strokeWidth=".8" opacity=".7" />
      <path d="M169 94q-51-7-39-31 10-18 39 27 28-51 43-27 11 24-43 31" fill={paint("teal")} stroke="#cef5e3" />
      <path d="M164 88q-25-28-27-18t27 18m11-1q29-9 28-17t-28 17" fill="#3d7b85" />
      <path d="m171 94 22 30-9-1-2 10-17-36z" fill={paint("teal")} /><path d="m169 98-9 42-6-8-8 3 16-40z" fill={paint("teal")} />
      <ellipse cx="170" cy="93" rx="8" ry="6" fill={paint("teal")} stroke="#c2efde" strokeWidth=".6" />
      {/* A punched paper tag and thin twine sit over the wrapping. */}
      <path d="M180 111q22 3 15 24" stroke="#e8d1ad" strokeWidth=".8" /><path d="m192 129 18 5-5 27-21-6 3-21z" fill={paint("paper")} stroke="#c2ad8c" strokeWidth=".5" /><circle cx="193" cy="135" r="1.5" fill="#735a56" />
      <path d="m192 141 11 3m-12 1 8 2m-9 2 10 3" stroke="#a28179" strokeWidth=".8" />
      <path d="M91 184h69v41H91z" fill={paint("gold")} /><path d="m160 184 10-8v40l-10 9z" fill="#8d693f" /><path d="m87 176 74-5 13 8-11 11H87z" fill={paint("gold")} /><path d="M87 182h76v8H87z" fill="#edce8a" />
      <path d="M119 181h13v44h-13z" fill={paint("pink")} /><path d="M121 185v36" stroke="#f1b9cd" />
      <g stroke="#bc914d" strokeWidth=".6" opacity=".65"><path d="m98 196 7 5-7 5 7 5m39-15 7 5-7 5 7 5" /></g>
    </g>
    <g fill="#d8b67a"><path d="m44 224 8-3 2 3-8 3zm147 4 7-5 3 3-7 5zm50-16 8-2 1 3-8 2z" /></g>
    <path d="M56 212q-17 12-1 12t-4 8m151-12q-11 9 3 9t-1 8" stroke="#ba8cbb" strokeWidth="2" />
    <g stroke="#f2c885" strokeWidth="1"><path d="m229 46 3 7 8 2-8 3-3 8-3-8-8-3 8-2zM67 60v12m-6-6h12M251 136v10m-5-5h10" /></g>
  </svg>;
}

function AnniversarySeal() {
  const id = useId();
  const paint = name => `url(#${id}-${name})`;
  return <svg className="season-corner-art anniversary-seal" viewBox="0 0 240 240" fill="none">
    <SeasonalMaterials id={id} materials={["gold", "brass"]} />
    <ellipse cx="121" cy="226" rx="77" ry="8" fill="#0d0c0b" opacity=".45" />
    <g filter={paint("grain")}>
    <circle cx="120" cy="121" r="94" fill="#181715" stroke="#392d20" strokeWidth="3" />
    <circle cx="120" cy="119" r="92" fill={paint("brass")} stroke="#ebd09b" strokeWidth=".75" />
    <circle cx="120" cy="119" r="86" fill="#282622" stroke="#86643c" strokeWidth="2" />
    <circle cx="120" cy="119" r="80" fill="#1e2221" stroke="#e8c582" strokeWidth=".6" />
    {Array.from({ length: 60 }, (_, i) => <path key={i} d="M120 29v4" stroke={i % 5 === 0 ? "#ffdf9b" : "#674b2f"} strokeWidth={i % 5 === 0 ? 1.4 : .7} transform={`rotate(${i * 6} 120 119)`} />)}
    <circle cx="120" cy="120" r="76" stroke="#cca65c" strokeDasharray="1 5" strokeOpacity=".55" />
    <path d="M116 193C55 188 42 103 76 66m48 127c61-5 74-90 40-127" stroke="#dbb778" strokeWidth="2" />
    {[0, 1, 2, 3, 4, 5].map(i => <g key={i} fill={paint("gold")}>
      <g transform={`rotate(${-i * 15} 120 120)`}><path d="M66 105q-17-7-9-28 16 6 9 28" stroke="#d7ba7c" strokeWidth=".5" /><path d="m64 101-4-17m3 10-4-3" stroke="#6f542f" strokeWidth=".7" /></g>
      <g transform={`rotate(${i * 15} 120 120)`}><path d="M174 105q17-7 9-28-16 6-9 28" stroke="#d7ba7c" strokeWidth=".5" /><path d="m176 101 4-17m-3 10 4-3" stroke="#6f542f" strokeWidth=".7" /></g>
    </g>)}
    <path d="m120 48 4 9 10 1-8 7 2 10-8-5-8 5 2-10-8-7 10-1z" fill={paint("gold")} stroke="#ffe5ad" strokeWidth=".6" />
    <path d="m120 50 1 12 11-3-10 6 5 8-7-6-7 6 5-9-10-5 11 2z" fill="#fff1c4" opacity=".2" />
    <text x="121" y="137" textAnchor="middle" fill="#080b0b" fontSize="45" fontFamily="monospace" fontWeight="bold">V2</text>
    <text x="120" y="135" textAnchor="middle" fill={paint("gold")} stroke="#f3d799" strokeWidth=".35" fontSize="45" fontFamily="monospace" fontWeight="bold">V2</text>
    <path d="M88 151h24l8 3 8-3h24" stroke="#ca9c52" /><text x="120" y="171" textAnchor="middle" fill="#e3c184" fontSize="9" fontFamily="monospace" letterSpacing="3">JUL 02</text>
    <path d="m73 193 47 9 47-9-11 17 4 15-40-11-40 11 4-15z" fill={paint("brass")} stroke="#c49a56" />
    <path d="m78 197 42 9 42-9m-76 23 34-9 34 9" stroke="#f6d395" strokeWidth=".75" strokeDasharray="2 2" />
    <path d="m116 204 4 9 4-9" stroke="#594128" /><path d="M51 149q2 8 6 11m115-99 7 9m-76 111 7 2" stroke="#e3ce9f" opacity=".25" />
    </g>
    <path d="M43 64v12m-6-6h12m136 106v8m-4-4h8" stroke="#ffe6b0" strokeWidth=".8" />
  </svg>;
}

function RetroCorner() {
  const id = useId();
  const paint = name => `url(#${id}-${name})`;
  return <svg className="season-corner-art retro-corner" viewBox="0 0 260 230" fill="none">
    <SeasonalMaterials id={id} materials={["plastic", "silver", "paper", "pink"]} />
    <ellipse cx="157" cy="208" rx="78" ry="9" fill="#040c17" opacity=".5" />
    <g transform="rotate(9 165 115)" filter={paint("grain")}>
      <path d="M104 40h115l12 12v139H104z" fill="#202d3b" stroke="#172535" strokeWidth="2" />
      <path d="M101 37h115l12 12v139H101z" fill={paint("plastic")} stroke="#b9d5e1" strokeWidth="1" />
      <path d="M105 42v141h118" stroke="#cbdae3" strokeWidth=".8" opacity=".45" /><path d="M225 52v133H110" stroke="#1c2e40" strokeWidth="2" />
      <path d="M119 37h83v59h-83z" fill="#2b3c50" /><path d="M123 37h77v56h-77z" fill={paint("silver")} stroke="#cddce2" strokeWidth=".7" />
      <path d="M172 45h17v39h-17z" fill="#283e52" /><path d="M174 48v33h12" stroke="#0d2233" strokeWidth="2" />
      <path d="M127 40v49m3-48v48m3-48v48m4-48v48m4-48v48m4-48v48m4-48v48m4-48v48m4-48v48m4-48v48m4-48v48" stroke="#eef7ff" strokeWidth=".5" opacity=".25" />
      <path d="M118 109h95v69h-95z" fill={paint("paper")} stroke="#e8dabe" strokeWidth=".5" /><path d="M118 109h95v14h-95z" fill={paint("pink")} />
      <path d="m205 109 8 8v-8z" fill="#e6cbbb" /><path d="M128 136h65m-65 10h49m-49 10h58" stroke="#788691" strokeWidth="1" />
      <text x="128" y="119" fontFamily="monospace" fontWeight="bold" fontSize="7" fill="#ffe2e6">DAIOS 95</text>
      <text x="128" y="170" fontFamily="monospace" fontSize="5" fill="#756f67">DEFINITELY A REAL UPDATE</text>
      <path d="M108 45h6v7h-6zm106 126h6v7h-6z" fill="#1e3244" stroke="#a5b7c4" strokeWidth=".6" />
      <path d="m110 45 3 3m2 135 13-1m74-78 8 1m-102 30 2 15m93-88 3-6" stroke="#d2d6d0" strokeWidth=".8" opacity=".4" />
      <path d="m207 149 5-2m-90 34 7-1m68-83 5 2" stroke="#182b3c" opacity=".8" />
    </g>
    <path d="M43 129v76l19-18 15 30 15-8-16-29h26z" fill="#0c1a2a" opacity=".65" />
    <path d="M40 125v76l19-18 15 30 15-8-16-29h26z" fill={paint("silver")} stroke="#344f67" strokeWidth="3" strokeLinejoin="round" />
    <path d="M43 132v61l16-16 17 30" stroke="#edfcff" strokeWidth="1.2" />
    <g stroke="#7dacc4" strokeWidth="2"><path d="m24 80 12-9-12-9m25 19h19M216 207h18m-9-9v18" /></g>
  </svg>;
}

export const SeasonalScenery = memo(function SeasonalScenery({ event }) {
  if (!event) return null;
  return <div className={`season-scenery scenery-${event}`} aria-hidden="true">
    <div className="season-atmosphere" />
    <Sparkles />
    {event === "halloween" && <><Moon /><HauntedCorner /><div className="season-ground-mist" /></>}
    {event === "winter" && <><Moon winter /><div className="season-aurora-ribbon" /><WinterCorner /><div className="season-frost-edge" /></>}
    {event === "birthday" && <><Bunting /><Gifts /><div className="season-streamers"><i /><i /><i /></div></>}
    {event === "anniversary" && <><div className="season-gala-rays" /><AnniversarySeal /><div className="season-gala-frame" /></>}
    {event === "april-fools" && <><div className="season-retro-grid" /><RetroCorner /><div className="season-test-pattern">{Array.from({ length: 7 }, (_, i) => <i key={i} />)}</div></>}
  </div>;
});
