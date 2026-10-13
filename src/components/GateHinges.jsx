import { useId } from "react";

function Hinge() {
  const id = useId().replace(/:/g, "");
  return <svg viewBox="0 0 48 112" focusable="false">
    <defs>
      <linearGradient id={`${id}-steel`}><stop stopColor="#18251e"/><stop offset=".28" stopColor="#a0ad91"/><stop offset=".46" stopColor="#687a61"/><stop offset=".72" stopColor="#354b3c"/><stop offset="1" stopColor="#0c1911"/></linearGradient>
      <linearGradient id={`${id}-leaf`} x2=".8" y2="1"><stop stopColor="#66775e"/><stop offset=".4" stopColor="#344c3b"/><stop offset="1" stopColor="#182c21"/></linearGradient>
      <pattern id={`${id}-brush`} width="7" height="4" patternUnits="userSpaceOnUse"><path d="M0 .5 H5 M3 2.5 H7" stroke="#d1dab7" strokeOpacity=".12" strokeWidth=".45"/></pattern>
    </defs>
    <path d="M14 9 H42 L47 14 V99 L42 105 H14 Z" fill="#050d09"/>
    <path d="M15 7 H40 L44 11 V98 L40 102 H15 Z" fill={`url(#${id}-leaf)`} stroke="#7d8d70" strokeWidth=".7"/>
    <path d="M19 10 H39 L41 13 V96 L38 99 H19" fill={`url(#${id}-brush)`} stroke="#0c1e13" strokeWidth="1"/>
    <path d="M22 11 H38 M43 15 V91" stroke="#bfcca7" strokeOpacity=".35" strokeWidth=".65"/>
    <rect x="7" y="3" width="11" height="104" rx="4" fill="#09170e"/>
    {[7, 39, 71].map(y=><g key={y}><rect x="5" y={y} width="15" height="29" rx="3" fill={`url(#${id}-steel)`} stroke="#0d1b12"/><path d={`M7 ${y+2} H18 M7 ${y+26} H18`} stroke="#dce0bc" strokeOpacity=".36" strokeWidth=".7"/></g>)}
    <rect x="7" y="2" width="11" height="4" rx="1.5" fill={`url(#${id}-steel)`}/><rect x="7" y="101" width="11" height="5" rx="1.5" fill={`url(#${id}-steel)`}/>
    {[22,55,88].map(y=><g key={y}><circle cx="31" cy={y+1} r="4.6" fill="#0b1911"/><path d={`M28 ${y-3} H34 L36 ${y} L34 ${y+3} H28 L26 ${y} Z`} fill={`url(#${id}-steel)`} stroke="#87977c" strokeWidth=".5"/><path d={`M29 ${y+1} L33 ${y-1}`} stroke="#0a160e" strokeWidth="1.1"/></g>)}
    <path d="M23 38 L27 35 M24 40 L26 38 M35 72 L39 68" stroke="#d3d5b7" strokeOpacity=".28" strokeWidth=".7"/>
  </svg>;
}

export function GateHinges() {
  return <span className="gate-door-hinges" aria-hidden="true"><i><Hinge /></i><i><Hinge /></i></span>;
}
