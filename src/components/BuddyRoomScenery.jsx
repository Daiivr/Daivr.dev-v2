import { memo, useId } from "react";
import { BuddyRoomTrees } from "./BuddyRoomTrees";

// Repeated SVG tiles keep the room detailed without downloading texture images.
export const BuddyRoomScenery = memo(function BuddyRoomScenery({ room, season }) {
  const prefix = useId().replace(/:/g, "");
  const id = (name) => `${prefix}-${name}`;
  const paint = (name) => `url(#${id(name)})`;
  const winter = season === "winter";
  const autumn = season === "autumn" || season === "halloween";
  return <svg className="room-scenery" viewBox="0 0 800 500" aria-hidden="true" shapeRendering="crispEdges">
    <defs>
      <clipPath id={id("window-clip")}><path d="M64 68h218v165H64z" /></clipPath>
      <radialGradient id={id("lamp-glow")}><stop stopColor="#ffdc97" stopOpacity=".15" /><stop offset="1" stopColor="#ffdc97" stopOpacity="0" /></radialGradient>
      <linearGradient id={id("wall-light")} x2="0" y2="1"><stop stopColor="#e0d4ba" stopOpacity=".08" /><stop offset=".65" stopColor="#091522" stopOpacity=".1" /><stop offset="1" stopColor="#091522" stopOpacity=".5" /></linearGradient>
      <linearGradient id={id("floor-light")} x2="0" y2="1"><stop stopColor="#091522" stopOpacity=".45" /><stop offset=".7" stopColor="#15202b" stopOpacity="0" /><stop offset="1" stopColor="#091522" stopOpacity=".28" /></linearGradient>
      <linearGradient id={id("sky")} x2="0" y2="1"><stop stopColor={season === "halloween" ? "#26182f" : "#142438"} /><stop offset=".65" stopColor={autumn ? "#736179" : winter ? "#45677b" : "#537d87"} /><stop offset="1" stopColor="#acc8b1" /></linearGradient>
      <linearGradient id={id("glass")}><stop stopColor="#d5efff" stopOpacity=".12" /><stop offset=".55" stopColor="#d5efff" stopOpacity="0" /><stop offset="1" stopColor="#d5efff" stopOpacity=".06" /></linearGradient>
      <pattern id={id("wallpaper")} width="40" height="48" patternUnits="userSpaceOnUse">
        <path d="M0 0v48M2 0v48" stroke="#e4ddcd" strokeOpacity=".025" />
        <path d="M20 12h2v4h4v2h-4v4h-2v-4h-4v-2h4zM0 36h2v4h4v2H2v4H0z" fill="var(--room-trim)" opacity=".3" />
        <path d="M10 5h2v1h-2zM30 30h1v2h-1z" fill="#e0d2be" opacity=".12" />
      </pattern>
      <pattern id={id("wood")} width="91" height="20" patternUnits="userSpaceOnUse">
        <path d="M2 3h40m8 0h32M10 8h24l6 2h35M0 16h18l8-3h23l9 3h32" fill="none" stroke="#201e29" strokeOpacity=".25" strokeWidth="2" />
        <path d="M4 5h29m28 7h20M29 17h20" stroke="#f4d8ac" strokeOpacity=".2" />
        <path d="M38 6h9v4h-9z" fill="#302832" opacity=".25" />
      </pattern>
      <pattern id={id("boards")} width="160" height="58" patternUnits="userSpaceOnUse">
        <path d="M0 0h160v28H0z" fill="#c3a78a" opacity=".09" /><path d="M80 30h80v26H80z" fill="#071923" opacity=".08" />
        <path d="M0 0h160M0 29h160M0 0v29M80 29v29" stroke="#14232a" strokeWidth="2" opacity=".6" />
        <path d="M2 2h156M82 31h77M2 31h76" stroke="#d7bd9c" opacity=".2" />
        <path d="M12 9h45l11 4h58M20 19h58l6-3h60M4 40h39l11 5h77M8 51h91l13-4h35" stroke="#1d252e" opacity=".24" fill="none" />
        <path d="M106 7h17v5h-17zM27 44h14v4H27z" fill="#20242c" opacity=".24" /><path d="M110 9h8M30 46h7" stroke="#d0ad8d" opacity=".35" />
        <path d="M6 5h2v2H6zM152 5h2v2h-2zM85 34h2v2h-2zM73 34h2v2h-2z" fill="#1a252b" opacity=".55" />
      </pattern>
      <pattern id={id("weave")} width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 0h3v1H0zM3 3h3v1H3z" fill="#fff3d6" opacity=".19" /><path d="M1 1v3M4 4v2" stroke="#15212b" opacity=".25" /></pattern>
      <pattern id={id("quilt")} width="24" height="22" patternUnits="userSpaceOnUse"><path d="M0 0h12v11H0zM12 11h12v11H12z" fill="#fff4dc" opacity=".13" /><path d="M0 0h24v22H0zM12 0v22M0 11h24" stroke="#102f36" strokeOpacity=".15" fill="none" /><path d="M4 5h4M16 16h4" stroke="#fff8e0" strokeOpacity=".35" /></pattern>
      <pattern id={id("panel")} width="68" height="80" patternUnits="userSpaceOnUse"><path d="M4 5h60v67H4z" fill="none" stroke="#0e202a" strokeWidth="3" opacity=".6" /><path d="M7 8h55v61H7z" fill="none" stroke="var(--room-trim)" opacity=".4" /></pattern>
    </defs>

    {/* Wallpaper, inset wainscoting, ceiling beam, and staggered hardwood. */}
    <path d="M0 0h800v350H0z" fill="var(--room-wall)" />
    <path d="M0 18h800v245H0z" fill={paint("wallpaper")} />
    <path d="M0 263h800v78H0z" fill="#0c1b29" opacity=".3" /><path d="M0 263h800v78H0z" fill={paint("panel")} />
    <path d="M0 0h800v350H0z" fill={paint("wall-light")} />
    <path d="M0 0h800v18H0zM0 332h800v18H0zM0 261h800v7H0z" fill="var(--room-wood)" />
    <path d="M0 0h800v18H0zM0 332h800v18H0zM0 261h800v7H0z" fill={paint("wood")} />
    <path d="M0 18h800v3H0zM0 261h800v2H0zM0 332h800v3H0z" fill="var(--room-wood-light)" opacity=".6" />
    <path d="M0 21h800v7H0zM0 268h800v5H0zM0 345h800v8H0z" fill="#08131e" opacity=".45" />
    <path d="M0 350h800v150H0z" fill="var(--room-floor)" /><path d="M0 350h800v150H0z" fill={paint("boards")} /><path d="M0 350h800v150H0z" fill={paint("floor-light")} />
    <path d="M73 350h100l107 104H105zM182 350h83l142 104H291z" fill="#a7d6dc" opacity=".045" />

    {/* Recessed window with mountain ridges, stars, mist, and shaded firs. */}
    <path d="M49 55h252v200H49z" fill="#091521" opacity=".55" transform="translate(7 7)" />
    <path d="M48 52h250v199H48z" fill="var(--room-wood)" /><path d="M48 52h250v199H48z" fill={paint("wood")} />
    <path d="M49 53h248v4H49zM49 53h4v194h-4z" fill="var(--room-wood-light)" />
    <path d="M58 62h230v177H58z" fill="#0b1422" /><path d="M64 68h218v165H64z" fill={paint("sky")} />
    <path className="room-window-stars" d="M79 87h2v2h-2zM117 80h3v3h-3zM147 111h2v2h-2zM207 83h2v2h-2zM266 117h3v2h-3zM191 114h2v2h-2z" fill="#dce5dd" opacity=".75" />
    <g clipPath={paint("window-clip")}>
      {(winter || room.palette === "aurora") ? <g className="room-window-aurora" fill="#82d4ba"><path d="M64 80l45 5 34-8 48 19 47-12 44 8v9l-44-8-47 12-48-19-34 8-45-5z" opacity=".12" /><path d="M64 87l45 5 34-8 48 19 47-12 44 8v4l-44-8-47 12-48-19-34 8-45-5z" opacity=".1" /></g> : null}
      <g className="room-window-cloud cloud-near" fill="#cfdae0" opacity=".12"><path d="M63 106h12v-4h31v4h18v4H63zM195 118h16v-5h25v5h27v4h-68z" /></g>
      <g className="room-window-cloud cloud-far" fill="#bdd0d7" opacity=".09"><path d="M132 88h13v-4h32v4h26v3h-71zM230 128h15v-4h29v4h25v3h-69z" /></g>
      {[0, 1].map((star) => <g key={star} className={`room-shooting-star shooting-star-${star}`}>
        <path d="M-31-11l12 4" stroke="#b9dce0" strokeWidth="1" opacity=".2" /><path d="M-19-7l12 4" stroke="#cee7e6" strokeWidth="1.5" opacity=".5" /><path d="M-7-3l7 3" stroke="#e9f4e5" strokeWidth="2" />
        <path d="M-1-1h3v3h-3z" fill="#fff9dc" /><path d="M-3-3h7v7h-7z" fill="#e5f8ef" opacity=".12" />
      </g>)}
      <g className="room-window-bird" stroke="#c4d5ce" strokeWidth="1.5" fill="none"><path className="room-window-wings" d="M0 0l4 2 4-2" /><path d="M4 2v1" /></g>
      <g className="room-window-bird bird-follower" stroke="#a7bab9" strokeWidth="1.5" fill="none"><path className="room-window-wings" d="M0 0l3 2 3-2" /></g>
    </g>
    <path d="M235 80h16v4h5v18h-5v5h-16v-5h-5V84h5z" fill={season === "halloween" ? "#f1c388" : "#e3e5ce"} />
    <path d="M235 83h5v6h-5zM246 96h7v5h-7zM233 93h4v5h-4z" fill="#9daeb5" opacity=".45" />
    <path d="M64 158l36-39 51 26 47-40 47 30 37 9v89H64z" fill={winter ? "#829bab" : "#465367"} />
    <path d="M100 119l-17 38 25-9 16 4-8-25zM198 105l-20 42 21-8 10 9 5-32z" fill={winter ? "#d6dce0" : "#76818b"} opacity=".65" />
    <path d="M64 182l29-18 32 6 29 24 38-32 41 9 49 29v33H64z" fill={winter ? "#a0b2bd" : "#324b55"} />
    <path d="M64 195h218v5H64zM86 203h170v4H86z" fill="#b3d0cf" opacity=".1" />
    <g clipPath={paint("window-clip")}>
      <BuddyRoomTrees winter={winter} autumn={autumn} />
    </g>
    <path d="M64 223h218v10H64z" fill={winter ? "#c1cfd0" : "#243f3c"} />
    <g clipPath={paint("window-clip")}>
      {winter ? [80, 110, 168, 204, 264, 150, 225, 97, 184, 251].map((x, i) => <g className="room-window-snow" key={x} style={{ animationDelay: `${-i * 1.7}s`, animationDuration: `${10 + i % 4 * 2}s` }}><rect x={x} y="67" width={i % 2 ? "2" : "3"} height={i % 2 ? "2" : "3"} fill="#dcecef" opacity=".7" /></g>) : autumn ? [95, 205, 259].map((x, i) => <g className="room-window-leaf" key={x} style={{ animationDelay: `${-i * 4.7}s` }}><path d={`M${x} 151h5v3h-2v3h-4v-4h1z`} fill={["#ce9860", "#b77753", "#d9b479"][i]} /></g>) : [90, 138, 220, 258].map((x, i) => <g key={x} className="room-window-firefly" style={{ animationDelay: `${-i * 1.7}s` }}><rect x={x} y={209 - i % 2 * 12} width="3" height="3" fill="#d0e6a8" /><rect x={x - 2} y={207 - i % 2 * 12} width="7" height="7" fill="#d0e6a8" opacity=".1" /></g>)}
      <path className="room-window-mist" d="M58 212h234v3H58zM84 219h156v2H84z" fill="#bacdcc" opacity=".09" />
    </g>
    {season === "spring" ? <path d="M82 220h4v4h-4zM140 215h4v4h-4zM249 225h4v4h-4z" fill="#e9a2bf" /> : null}
    <path d="M64 68h218v165H64z" fill={paint("glass")} /><path d="M65 70h26L65 122zM92 70h9l-36 72v-17zM179 154h20l-20 40z" fill="#cce8ef" opacity=".07" />
    <path d="M168 62h9v176h-9zM58 143h230v9H58z" fill="#14242d" /><path d="M168 63h2v80h-2zM60 143h108v2H60zM179 143h106v2H179z" fill="#899a98" opacity=".6" />
    <path d="M42 237h263v12H42zM50 249h248v8H50z" fill="var(--room-wood)" /><path d="M42 237h263v12H42z" fill={paint("wood")} /><path d="M42 237h263v3H42z" fill="var(--room-wood-light)" />
    <path d="M51 257h247v6H51z" fill="#081521" opacity=".4" />

    {/* Gathered curtains frame the view without hiding the moving landscape. */}
    <path d="M36 44h274v4H36zM34 41h5v10h-5zM308 41h5v10h-5z" fill="#b0a086" />
    <path d="M39 49h29l-5 30-7 41-5 49 6 61H34l5-53 1-54zM281 49h27v70l3 59 4 52h-23l5-61-5-49-7-41z" fill="var(--room-accent)" />
    <path d="M43 50h4l-1 86-6 91h-4l6-91zM57 50h5l-5 58-8 61 5 58h-5l-5-58 8-61zM285 50h5l9 119-4 58h-5l4-58zM302 50h3l1 86 7 91h-4l-6-91z" fill="#10222d" opacity=".35" />
    <path d="M47 51h4v55h-4zM296 51h3v49h-3z" fill="#f8ebd5" opacity=".35" />
    <path d="M37 155h18v5H37zM290 155h20v5h-20z" fill="#bdaa7e" /><path d="M42 160v10h3v-10zM304 160v10h3v-10z" fill="#d2c19a" />

    {/* A tiny framed star chart above Buddy's reading table. */}
    <path d="M378 154l21-12 21 12" stroke="#75847f" fill="none" strokeWidth="2" />
    <path d="M359 155h85v64h-85z" fill="#081621" opacity=".5" /><path d="M355 151h85v64h-85z" fill="var(--room-wood)" /><path d="M355 151h85v64h-85z" fill={paint("wood")} />
    <path d="M358 154h79v58h-79z" fill="var(--room-wood-light)" /><path d="M363 159h69v48h-69z" fill="#172a39" />
    <path d="M376 190l14-19 13 20 17-15" stroke="#7cb3ba" strokeWidth="1" fill="none" opacity=".55" />
    <path d="M374 188h4v4h-4zM388 169h4v4h-4zM401 189h4v4h-4zM418 174h4v4h-4zM370 167h2v2h-2zM415 197h2v2h-2z" fill="#d1d6af" />
    <path d="M416 162h7v3h-4v5h5v3h-8v-3h-3v-5h3z" fill="#b6cbd0" />

    {/* Shelves have routed edges, grain, and little brass brackets. */}
    {[353, 560].map((x) => <g key={x}>
      <path d={`M${x + 5} 100h163v11h-163z`} fill="#081723" opacity=".45" />
      <path d={`M${x} 90h164v13h-164z`} fill="var(--room-wood)" /><path d={`M${x} 90h164v13h-164z`} fill={paint("wood")} />
      <path d={`M${x} 89h164v4h-164z`} fill="var(--room-wood-light)" /><path d={`M${x + 2} 101h160v2h-160z`} fill="#1c2228" />
      <path d={`M${x + 14} 104v17h5v-12h10v-5zM${x + 140} 104v17h-5v-12h-10v-5z`} fill="#a19270" /><path d={`M${x + 16} 116h1v2h-1zM${x + 137} 116h1v2h-1z`} fill="#202a30" />
    </g>)}
    {/* Floor textiles render before every piece of furniture and its shadow. */}
    {room.rug !== "none" ? <g className="room-floor-rug">
      <path d="M270 394h243l42 69H228z" fill="#071521" opacity=".4" /><path d="M270 390h243l40 69H230z" fill="var(--room-accent)" />
      <path d="M277 396h230l31 56H245z" fill="var(--room-wall)" /><path d="M283 403h218l23 42H259z" fill="var(--room-accent)" opacity=".22" />
      {room.rug === "checker" ? <path d="M287 403h42v18h-42zM371 403h42v18h-42zM455 403h42v18h-42zM329 424h42v19h-42zM413 424h42v19h-42z" fill="var(--room-accent)" opacity=".7" /> : <g><path d="M395 402h22v7h-12v20h20v-8h8v17h-31v-7h-13v-21h6zM291 416h5v5h-5zM474 423h5v5h-5zM352 435h3v3h-3zM450 407h3v3h-3z" fill="var(--room-accent)" /></g>}
      <path d="M270 390h243l40 69H230z" fill={paint("weave")} />
      {Array.from({ length: 29 }, (_, i) => <path key={i} d={`M${235 + i * 11} 460v5`} stroke="var(--room-accent)" strokeWidth="3" opacity=".6" />)}
    </g> : null}

    {/* Aquarium cabinet, drawers, hardware, and cast shadow. */}
    <g className="room-aquarium-cabinet">
    <path d="M508 424h215l14 13H513z" fill="#081723" opacity=".4" />
    <path d="M515 328h198v72H515z" fill="var(--room-wood)" /><path d="M515 328h198v72H515z" fill={paint("wood")} />
    <path d="M525 338h78v50h-78zM615 338h87v50h-87z" fill="var(--room-wall)" /><path d="M529 342h70v42h-70zM619 342h79v42h-79z" stroke="var(--room-trim)" strokeWidth="2" fill="none" opacity=".5" />
    <path d="M590 358h4v10h-4zM624 358h4v10h-4z" fill="#c5af81" />
    <path d="M515 395h14v34h-14zM698 395h14v34h-14z" fill="var(--room-wood)" /><path d="M517 396h3v31h-3zM700 396h3v31h-3z" fill="var(--room-wood-light)" />
    <path d="M501 315h225v15H501z" fill="var(--room-wood)" /><path d="M501 315h225v15H501z" fill={paint("wood")} /><path d="M501 313h225v4H501z" fill="var(--room-wood-light)" />
    </g>

    {/* Quilted blankets, pillow piping, and wooden bed frames. */}
    <path d="M53 419h187l12 22H50z" fill="#08131f" opacity=".45" />
    {room.bed === "cushion" ? <g>
      <path d="M66 361h145v12h12v12h5v25h-8v6H56v-6h-7v-25h5v-12h12z" fill="var(--room-accent)" /><path d="M59 388h158v20H59z" fill="var(--room-wall)" opacity=".35" />
      <path d="M68 367h140v4H68zM57 379h3v20h-3zM213 379h3v20h-3zM67 407h141v3H67z" fill="#ede1cd" opacity=".35" /><path d="M70 372h135v31H70z" fill={paint("quilt")} />
      <path d="M81 365h43v17H81z" fill="#e5d9c4" /><path d="M85 368h35v10H85z" fill="#f3e9d8" /><path d="M85 368h35v10H85z" fill={paint("weave")} />
    </g> : <g>
      <path d="M52 343h17v93H52zM224 343h14v93h-14zM69 405h155v14H69z" fill="var(--room-wood)" /><path d="M52 343h17v93H52zM224 343h14v93h-14zM69 405h155v14H69z" fill={paint("wood")} />
      <path d="M53 343h15v4H53zM54 348h3v86h-3zM225 343h12v4h-12zM226 348h3v86h-3zM69 405h155v3H69z" fill="var(--room-wood-light)" />
      <path d="M70 356h154v49H70z" fill="#d2c6b1" /><path d="M125 358h99v47h-99z" fill="var(--room-accent)" /><path d="M125 358h99v47h-99z" fill={paint("quilt")} />
      <path d="M125 358h99v8h-99z" fill="#e2e4cd" opacity=".3" /><path d="M216 368h8v37h-8zM125 400h99v5h-99z" fill="#142a35" opacity=".25" />
      <path d="M80 358h40v30H80z" fill="#b5afa6" /><path d="M83 358h34v25H83z" fill="#f0e5d2" /><path d="M87 362h26v17H87z" fill={paint("weave")} /><path d="M80 388h41v3H80z" fill="#30404a" opacity=".2" />
      {room.bed === "bunk" ? <g>
        <path d="M52 275h17v84H52zM224 275h14v84h-14zM69 287h155v15H69z" fill="var(--room-wood)" /><path d="M52 275h17v84H52zM224 275h14v84h-14zM69 287h155v15H69z" fill={paint("wood")} />
        <path d="M54 277h3v80h-3zM226 277h3v80h-3zM69 287h155v3H69z" fill="var(--room-wood-light)" />
        <path d="M69 270h155v17H69z" fill="var(--room-accent)" /><path d="M69 270h155v17H69z" fill={paint("quilt")} /><path d="M78 270h40v10H78z" fill="#e0d6c8" />
        <path d="M193 299h7v118h-7zM213 299h7v118h-7zM196 325h20v5h-20zM196 348h20v5h-20zM196 371h20v5h-20zM196 394h20v5h-20z" fill="var(--room-wood-light)" /><path d="M197 300h3v117h-3zM217 300h3v117h-3z" fill="#16252d" opacity=".35" />
      </g> : null}
    </g>}

    {/* A gray-and-white husky rests clear of the bed legs and the main rug. */}
    <g className="room-sleeping-dog" transform="translate(128 450)">
      <path d="M-49 18h95l9 7-8 8h-98l-9-7z" fill="#091b22" opacity=".4" />
      <path d="M-47 13h88l12 7v9l-12 6h-88l-12-6v-9z" fill="#34474c" />
      <path d="M-45 15h85l10 7-8 8h-89l-9-7z" fill="#647e7b" />
      <path d="M-45 17h82M-48 29h89" stroke="#a3b9a3" opacity=".45" strokeWidth="2" />
      <g className="room-dog-breath">
        <path d="M-18-10h6v-6H3v-4h16v4h9v4h6v8h4v14h-4v8h-8v5h-43v-4h-9V-4h8z" fill="#303d48" />
        <path d="M-16-8h6v-6H5v-3h12v4h9v5h6v8h3v10h-5v8H-15v-4h-8V-3h7z" fill="#788995" />
        <path d="M-10-10H5v-4h12v4h9v6h-9v-3H1v4h-15v-3h4z" fill="#a8b8bd" />
        <path d="M-4-7H9v3h11v5h7v5H15V3H3v-4H-9v-3h5z" fill="#536775" />
        <path d="M16 2h12v4h4v7h-8v5H6v-4h10z" fill="#526471" />
        <path d="M-16-1h7v5h7v4h9v10h-22v-4h-6V7h3zM17 12h10v6H13v-3h4z" fill="#e0e5db" />
      </g>
      {/* Local (0, 0) is the attachment at the rump, independent of tail bounds. */}
      <g transform="translate(31 5)">
        <g className="room-dog-tail">
          <path d="M-5-6h8v3h5v5h4v9H1V6h-6z" fill="#354551" />
          <path d="M-3-4h4v4h5v5h3v5H3V4h-6z" fill="#8da2ad" />
          {/* Overlapping joints bend in sequence; the white tip follows last. */}
          <g transform="translate(7 8)"><g className="room-dog-tail-middle">
            <path d="M-5-5h8v3h4v10H3v6H-7V8h-3V1h5z" fill="#354551" />
            <path d="M-3-5h4v5h3v6H0v6h-5V6h-2V1h4z" fill="#a7b9bf" />
            <path d="M1 1h3v5H1z" fill="#d8e3de" />
            <g transform="translate(-3 10)"><g className="room-dog-tail-tip">
              <path d="M-4-5h8v8H0v4h-14V4h-5V0h4v-4h5v3h6z" fill="#354551" />
              <path d="M-3-4h5v5h-4v4h-10V2h-4V0h4v-2h2v3h7z" fill="#edf0df" />
              <path d="M-10 3h8v2h-10z" fill="#b1c4c5" />
            </g></g>
          </g></g>
        </g>
      </g>
      <path className="room-dog-neck" d="M-24-13h12v7h5v7h3l-3 5h3l-10 12h-12z" fill="#d8e0d9" />
      <path d="M-39 19h17v4h16v6h-34v-3h-3v-4h4z" fill="#546975" />
      <path d="M-38 20h14v5h16v2h-30v-2h-3v-3h3z" fill="#eef0e1" />
      <path d="M-34 24v3m5-3v3M-17 25v2" stroke="#a4b4b6" />
      <g className="room-dog-head">
        {/* Three-quarter face: two eye masks, a tapered blaze, and a short muzzle. */}
        <path d="M-41-5v-14h3v-5h3v4h4v5h3v10z" fill="#354650" /><path d="M-38-8v-10h2v4h3v6z" fill="#b6c4c5" /><path d="M-37-9v-5h2v5z" fill="#a49a9f" />
        <path d="M-36-12h17v3h7v6h4v15h-4v6h-6v4h-17v-3h-7v-5h-5V0h4v-7h7z" fill="#354650" />
        <path d="M-35-10h15v3h6v6h4v11h-5v6h-6v4h-13v-3h-7v-5h-5V1h4v-6h7z" fill="#879da8" />
        <path d="M-34-8h13v3h-13zM-40-1h5v4h-5z" fill="#b3c3c7" />
        <path d="M-30-9h4v6h3v6h5v4h5v5h-4v5h-7v3h-11v-3h-6v-5h-3V6h5V2h6v-5h3z" fill="#e4e9df" />
        <g className="room-dog-face">
          <path d="M-40 0h8v3h-3v4h-6zM-25 1h9v7h-6V5h-3z" fill="#506773" />
          <path d="M-39 8h13v3h5v5h-6v3h-10v-3h-5v-5h3z" fill="#f4f2e3" />
          <path d="M-37 8h8v4h-2v2h-4v-2h-2z" fill="#27343c" /><path d="M-36 8h4v1h-4z" fill="#829ba5" />
          <path className="room-dog-eye-closed" d="M-39 3l2 2h3M-24 4l2 2h4" stroke="#283b46" strokeWidth="2" fill="none" />
          <g className="room-dog-eye-open"><path d="M-39 2h5v4h-5zM-24 3h6v4h-6z" fill="#233640" /><path d="M-38 2h3v3h-3zM-23 3h4v3h-4z" fill="#91d2df" /><path d="M-37 2h1v3h-1zM-21 3h2v3h-2z" fill="#233640" /><path d="M-38 2h1v1h-1zM-23 3h1v1h-1z" fill="#f4f6e9" /></g>
          <path d="M-33 14v2h-4m4 0h4" stroke="#859994" fill="none" />
        </g>
        <g className="room-dog-ear"><path d="M-20-6v-8h3v-6h3v-5h3v5h3v16h-6z" fill="#354650" /><path d="M-17-7v-7h3v-5h3v13h-3z" fill="#c1ccca" /><path d="M-14-8v-6h2v7z" fill="#a79b9e" /></g>
      </g>
    </g>

    {/* Side table and shaded household objects. */}
    {room.prop === "lamp" ? <ellipse cx="377" cy="287" rx="93" ry="105" fill={paint("lamp-glow")} /> : null}
    <path d="M335 354h88l9 8h-95z" fill="#08131f" opacity=".4" />
    <path d="M327 309h101v12H327zM337 321h9v37h-9zM410 321h9v37h-9z" fill="var(--room-wood)" /><path d="M327 309h101v12H327z" fill={paint("wood")} /><path d="M327 308h101v3H327zM338 323h2v32h-2zM411 323h2v32h-2z" fill="var(--room-wood-light)" />
    {room.prop === "plant" ? <g>
      <path d="M365 284h27v6h-3v19h-21v-19h-3z" fill="#ac7963" /><path d="M365 284h27v4h-27zM369 292h4v15h-4z" fill="#d4a382" /><path d="M387 290h3v19h-3zM371 299h15v2h-15z" fill="#684d4a" opacity=".5" />
      <path d="M375 248h4v36h-4zM363 266h14v4h-14zM378 254h13v3h-13z" fill="#486f53" /><path d="M355 256h14v4h5v10h-14v-4h-5zM381 241h14v-4h6v12h-6v6h-14zM380 267h20v8h-7v5h-13zM366 235h7v4h4v15h-7v-7h-4z" fill="#7dae86" /><path d="M356 256h12v3h-12zM386 241h9v3h-9zM382 268h16v3h-16zM366 236h3v9h-3z" fill="#b3cea0" />
    </g> : room.prop === "lamp" ? <g>
      <path d="M359 275h37l36 34H325z" fill="#f1d5a0" opacity=".09" /><path d="M374 272h7v31h-7zM360 303h36v6h-36z" fill="#758e8c" /><path d="M375 276h2v25h-2zM363 303h30v2h-30z" fill="#d0c8a7" />
      <path d="M363 245h28l10 31h-49z" fill="#d6b984" /><path d="M367 247h20l8 25h-36z" fill="#f1dcb0" /><path d="M370 247l-5 25M379 247v25M385 248l5 24" stroke="#b38d60" opacity=".4" /><path d="M352 274h49v3h-49z" fill="#f6e5b9" /><path d="M387 277v11h2v-11z" fill="#c7b38a" />
    </g> : <g>
      <path d="M354 296h50v13h-50z" fill="#b18264" /><path d="M358 299h44v7h-44z" fill="#e1d5b6" /><path d="M360 282h45v13h-45z" fill="#669b98" /><path d="M362 285h39v7h-39z" fill="#cccdb6" /><path d="M357 270h42v11h-42z" fill="#8880aa" /><path d="M360 273h36v5h-36z" fill="#e4d5b7" /><path d="M361 302h36M365 288h31M362 275h29" stroke="#806f67" opacity=".5" />
    </g>}
    <path d="M737 340h42l8 12h-50z" fill="#08131f" opacity=".4" /><path d="M739 275h31v7h-3v65h-25v-65h-3z" fill="#69737a" /><path d="M742 283h5v61h-5z" fill="#91a29a" /><path d="M750 290v49M759 290v49" stroke="#324c51" strokeWidth="2" />
    <path d="M751 220h4v56h-4zM731 223h21v5h-21zM753 243h25v5h-25z" fill="#416a55" /><path d="M726 210h16v5h8v11h-17v-6h-7zM757 231h24v12h-8v6h-16zM747 194h9v7h5v19h-10v-8h-4z" fill="#6f9b79" /><path d="M728 211h12v4h-12zM761 232h17v4h-17zM748 196h4v14h-4z" fill="#a0bb8e" />
    {/* Quiet aquarium light spills onto the wall and cabinet. */}
    <path d="M506 194h212v129H506z" fill="#8fe5de" opacity=".025" />
  </svg>;
});
