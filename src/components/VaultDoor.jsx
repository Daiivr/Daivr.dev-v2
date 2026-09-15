import { useId } from "react";

// Shared hardware for the cabinet entry and the full-size vault seal.
const gear = Array.from({ length: 16 }, (_, tooth) => [0, .18, .72, .9].map((offset, corner) => {
  const angle = (tooth + offset) / 16 * Math.PI * 2;
  const radius = corner === 1 || corner === 2 ? 238 : 218;
  return `${250 + Math.cos(angle) * radius},${250 + Math.sin(angle) * radius}`;
})).flat().join(" ");

export function VaultDoor({ className = "", compact = false }) {
  const id = useId().replace(/:/g, "");
  return <svg className={`vault-door ${className}`} viewBox="0 0 500 500" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-steel`} x1="0" y1="0" x2=".7" y2="1"><stop stopColor="#c4c0a6" /><stop offset=".18" stopColor="#747e7a" /><stop offset=".4" stopColor="#38474b" /><stop offset=".68" stopColor="#1a282e" /><stop offset=".9" stopColor="#64706d" /><stop offset="1" stopColor="#9a9a80" /></linearGradient>
      <radialGradient id={`${id}-face`} cx=".3" cy=".16" r=".95"><stop stopColor="#677a79" /><stop offset=".4" stopColor="#405b63" /><stop offset=".8" stopColor="#2b424b" /><stop offset="1" stopColor="#142a33" /></radialGradient>
      <linearGradient id={`${id}-gold`} x2=".6" y2="1"><stop stopColor="#f0d99a" /><stop offset=".5" stopColor="#c4a252" /><stop offset="1" stopColor="#796335" /></linearGradient>
      <filter id={`${id}-wear`} x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".64" numOctaves="3" seed="76" /><feColorMatrix type="saturate" values="0" /><feComposite in2="SourceGraphic" operator="in" /></filter>
      <filter id={`${id}-pitting`} x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="3" seed="12" /><feColorMatrix type="matrix" values="0 0 0 0 .12 0 0 0 0 .10 0 0 0 0 .07 0 0 0 2 -1.05" /><feComposite in2="SourceGraphic" operator="in" /></filter>
      <linearGradient id={`${id}-piston`}><stop stopColor="#111d22" /><stop offset=".25" stopColor="#6e7e7c" /><stop offset=".45" stopColor="#ccd0b7" /><stop offset=".6" stopColor="#7d8b80" /><stop offset="1" stopColor="#19292d" /></linearGradient>
      <mask id={`${id}-stencil`}><rect width="500" height="500" fill="white" /><path d="M249 170v153M311 168v155M147 249h217" stroke="black" strokeWidth="3" /></mask>
    </defs>
    <polygon points={gear} fill="#080f13" stroke="#060c0f" strokeWidth="14" transform="translate(0 18)" />
    <polygon points={gear} fill="#303c3c" stroke="#141f25" strokeWidth="3" transform="translate(0 14)" />
    <polygon points={gear} fill="#323e40" stroke="#78817b" strokeWidth="2" transform="translate(0 9)" />
    <polygon points={gear} fill="#17252c" stroke="#131d21" strokeWidth="3" transform="translate(0 5)" />
    <polygon points={gear} fill={`url(#${id}-steel)`} stroke="#8a8d7c" strokeWidth="2" />
    <circle cx="250" cy="250" r="205" fill="#172327" stroke="#151d20" strokeWidth="5" />
    <circle cx="250" cy="250" r="192" fill={`url(#${id}-steel)`} stroke="#939583" strokeWidth="2" />
    <circle cx="250" cy="250" r="201" fill="none" stroke="#b4baa0" strokeWidth="1" opacity=".4" />
    <circle cx="250" cy="250" r="184" fill="none" stroke="#07151b" strokeWidth="4" />
    <circle cx="250" cy="250" r="175" fill={`url(#${id}-face)`} stroke="#0c1b21" strokeWidth="8" />
    <circle cx="250" cy="250" r="164" fill="none" stroke="#b6a16b" strokeWidth="3" opacity=".46" strokeDasharray="251 12 65 9 145 18" />
    <path d="M105 148h289M80 331h340" stroke="#0d232c" strokeWidth="3" opacity=".8" /><path d="M107 151h286M83 334h334" stroke="#a7b1a0" opacity=".17" />
    {Array.from({ length: 12 }, (_, i) => <g key={i} transform={`rotate(${i * 30} 250 250)`}>
      <path d="M242 65h16l6 21h-28Z" fill="#17252a" stroke="#8b9188" />
      <circle cx="250" cy="53" r="5" fill="#111e23" stroke="#adb1a0" strokeWidth="2" />
      <path d="M247 53h6" stroke="#74817b" />
    </g>)}
    {Array.from({ length: 6 }, (_, i) => <g key={i} transform={`rotate(${i * 60} 250 250)`}>
      <path d="M229 68h42v71l-7 12h-28l-7-12Z" fill="#0a1b23" stroke="#10252d" strokeWidth="7" />
      <path d="M230 70v67l8 11h25l7-11V70" fill="none" stroke="#809087" strokeWidth="2" />
      <g className="vault-door-bolt" style={{ "--bolt-order": i }}><rect x="241" y="56" width="18" height="75" rx="2" fill={`url(#${id}-piston)`} stroke="#16262a" strokeWidth="2" /><path d="M242 65h16m-16 6h16m-16 6h16" stroke="#d6d5b5" opacity=".5" /><rect x="236" y="115" width="28" height="20" rx="2" fill={`url(#${id}-steel)`} stroke="#101f26" strokeWidth="2" /><path d="M241 122h18" stroke="#bdc3ac" opacity=".6" /></g>
      <path d="M227 89h8m30 0h8M229 143h7m28 0h7" stroke="#aa9c71" strokeWidth="3" />
    </g>)}
    <text x="253" y="183" textAnchor="middle" fill="#c4c2a3" fontFamily="monospace" fontSize="8" fontWeight="700" letterSpacing="7">VAULT</text>
    <text x="252" y="312" textAnchor="middle" fill="#071c24" opacity=".7" fontFamily="Impact, 'Arial Narrow', sans-serif" fontSize="146" fontWeight="900" letterSpacing="-4">76</text>
    <text x="250" y="309" textAnchor="middle" fill={`url(#${id}-gold)`} mask={`url(#${id}-stencil)`} fontFamily="Impact, 'Arial Narrow', sans-serif" fontSize="146" fontWeight="900" letterSpacing="-4">76</text>
    <g fill="none" stroke="#c2c6ac" opacity=".13"><path d="m114 182 32-11m-42 122 23-8m200 63 41-13m-24-174 22-5M203 225l27-5m39 70 31-7M159 370l38-10" /><path d="m124 330 25-7m186-110 39-10M210 120l29-6" /></g>
    {!compact && <>
      <g transform="translate(-7 -5) rotate(-3 188 363)"><rect x="151" y="344" width="75" height="40" rx="3" fill="#1b3039" stroke="#738174" strokeWidth="2" /><rect x="157" y="350" width="63" height="28" rx="1" fill="#263d44" stroke="#0b222b" strokeWidth="3" /><path d="M159 347h4m51 0h4m-59 34h4m51 0h4" stroke="#c0be9b" /><g className="vault-door-wheel"><circle cx="189" cy="364" r="17" fill="#192d34" stroke="#a3a488" strokeWidth="4" /><path d="M189 349v30m-15-15h30" stroke="#777f70" strokeWidth="4" /><circle cx="189" cy="364" r="5" fill="#c3b88c" stroke="#111f25" strokeWidth="2" /></g></g>
      <g fontFamily="monospace"><path d="M284 343h53" stroke="#8b977c" opacity=".45" /><text x="284" y="355" fill="#bdbea0" fontSize="6" letterSpacing="1">APPALACHIA</text><text x="284" y="367" fill="#9aa99c" fontSize="5" letterSpacing=".8">SEAL / 2076</text></g>
      <path d="m123 207 13 5 4 20-17-6Z" fill="#b8a66e" opacity=".7" /><path d="m129 214 2 9m-1 2v1" stroke="#273c41" strokeWidth="2" />
      <path d="M332 168c35 28 12 58 43 76" fill="none" stroke="#14252b" strokeWidth="8" /><path d="M332 166c35 28 12 58 43 76" fill="none" stroke="#788478" strokeWidth="3" /><path d="m330 164 6 7m33 65 7 8" stroke="#b5a373" strokeWidth="7" />
      {Array.from({ length: 38 }, (_, i) => <g key={i} transform={`rotate(${i * 9.47} 250 250)`}><path d={`M${248 + i % 5} ${i % 2 ? 82 : 44}v${3 + i % 11}`} stroke={i % 3 ? "#d1cbb0" : "#0a1e26"} opacity=".28" strokeWidth={i % 4 === 0 ? 2 : .7} /></g>)}
      <polygon points={gear} fill="#fff" filter={`url(#${id}-wear)`} opacity=".22" style={{ mixBlendMode: "soft-light" }} />
      <polygon points={gear} fill="#fff" filter={`url(#${id}-pitting)`} opacity=".5" />
      <path d="M119 165a159 159 0 0 1 239-30" fill="none" stroke="#e9dcad" strokeWidth="2" opacity=".24" />
    </>}
  </svg>;
}
