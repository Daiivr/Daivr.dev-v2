import { useEffect, useId, useRef } from "react";
import { krakenPose } from "../../shared/kraken-motion.mjs";

const MANTLE = "M139 98V67l7-15V39l14-13 12-18h14l10 13 16 12v19l10 17v28l-13 17-26 8-28-8z";


export function KrakenArt({ phase = 'monster', response = '' }) {
  const id = useId().replace(/:/g, "");
  const root = useRef(null);
  const responseRef = useRef(response);
  useEffect(() => { responseRef.current = response; }, [response]);
  useEffect(() => {
    const node = root.current;
    const groups = [...node.querySelectorAll('.kraken-flex-arm')];
    const paths = groups.map(group => ({ outline: [...group.querySelectorAll('.kraken-arm-surface')], cups: group.querySelector('.kraken-suckers') }));
    const mantle = node.querySelector('.kraken-mantle-rise');
    const ledges = node.querySelector('.kraken-contact-ledges');
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const start = performance.now();
    let frame, previous = -Infinity;
    const draw = now => {
      if (now - previous < 32 && !preference.matches) { frame = requestAnimationFrame(draw); return; }
      previous = now;
      const elapsed = (now - start) / 1000;
      const pose = krakenPose(phase, elapsed, now / 1000, responseRef.current, preference.matches);
      paths.forEach((parts, i) => {
        parts.outline.forEach(path => path.setAttribute('d', pose.arms[i].outline));
        parts.cups.setAttribute('d', pose.arms[i].cups);
      });
      mantle.style.transform = `translate(${pose.head.x}px, ${pose.head.y}px)`;
      ledges.style.opacity = phase === 'retreat' ? Math.max(0, 1 - elapsed / 1.4) : phase === 'omen' && !preference.matches ? Math.min(1, Math.max(0, (elapsed - 1.8) / 1.2)) : 1;
      if (!preference.matches) frame = requestAnimationFrame(draw);
    };
    const restart = () => { cancelAnimationFrame(frame); draw(performance.now()); };
    preference.addEventListener('change', restart);
    draw(start);
    return () => { cancelAnimationFrame(frame); preference.removeEventListener('change', restart); };
  }, [phase]);
  const paint = name => `url(#${id}-${name})`;
  const pose = krakenPose(phase, 0, 0, response, true);
  const arm = (shape, i) => <g className={`kraken-flex-arm ${i >= 6 ? 'is-gripping' : ''}`} key={i}>
    <path className="kraken-arm-surface" d={shape.outline} fill={paint('arm')} stroke="#161421" strokeWidth="3" strokeLinejoin="round"/>
    <path className="kraken-arm-surface" d={shape.outline} fill={paint('skin')} stroke="#8b748f" strokeWidth="1" strokeLinejoin="round"/>
    <path className="kraken-suckers" d={shape.cups} fill="#423044" stroke="#be9caa" strokeWidth="1.2"/>
  </g>;
  return <g className="kraken-creature kraken-articulated" ref={root}>
    <defs>
      <linearGradient id={`${id}-arm`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#a08ba1"/><stop offset=".3" stopColor="#65506f"/><stop offset=".7" stopColor="#392e49"/><stop offset="1" stopColor="#201f32"/></linearGradient>
      <linearGradient id={`${id}-mantle`} x1="0" y1="0" x2="1" y2=".7"><stop stopColor="#ae919f"/><stop offset=".28" stopColor="#75627e"/><stop offset=".6" stopColor="#49394f"/><stop offset="1" stopColor="#252339"/></linearGradient>
      <pattern id={`${id}-skin`} width="11" height="9" patternUnits="userSpaceOnUse"><path d="M1 2h3v2H1zM7 6h2v1H7z" fill="#d4b9ba" opacity=".23"/><path d="M5 1h2v3H5zM1 7h3v1H1zM9 3h1v2H9z" fill="#160f24" opacity=".38"/></pattern>
    </defs>
    <g>{pose.arms.slice(0,6).map(arm)}</g>
    <g>{pose.arms.slice(6).map((shape,i)=>arm(shape,i+6))}</g>
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
    <g className="kraken-contact-ledges">
      {[0, 1].map(side => <g key={side} transform={side ? 'translate(360 0) scale(-1 1)' : undefined}>
        <ellipse cx="35" cy="145" rx="23" ry="3" fill="#020709" opacity=".8"/>
        <path d="M12 145h13v-2h8v3h9v-2h16v4H12z" fill="#14272b"/>
        <path d="M12 144h13m17 0h16" stroke="#5e8f91" strokeWidth="1"/>
        <path d="M26 141q-5 8 4 9m13-10q6 8-3 10" fill="none" stroke="#a788a2" strokeWidth="4" strokeLinecap="round"/>
        <path d="M27 143h2m13 0h2" stroke="#dfbac1" strokeWidth="2"/>
      </g>)}
    </g>
    <g className="kraken-grip-sparks" fill="#b2ddd1"><path d="M18 148h3v3h-3m19 0h2v3h-2m286-4h3v3h-3m16-2h2v4h-2"/></g>
  </g>;
}
