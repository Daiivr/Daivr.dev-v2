// Small, shared previews make room controls read like the cabinet's inventory.
export function BuddyRoomOptionArt({ id }) {
  const colors = { aurora: ["#28454c", "#85c4ab", "#647c83"], plum: ["#42354e", "#c09ccd", "#877295"], amber: ["#493c32", "#d8b775", "#957955"] };
  const palette = colors[id];
  return <svg className="room-option-art" viewBox="0 0 72 34" aria-hidden="true" shapeRendering="crispEdges">
    {palette ? <>
      <path d="M6 3h60v27H6z" fill={palette[0]} /><path d="M6 25h60v5H6z" fill={palette[2]} />
      <path d="M12 7h17v13H12z" fill="#0a1b27" /><path d="M14 9h13v9H14z" fill={palette[2]} /><path d="M19 9h2v9h-2z" fill="#16252d" />
      <path d="M39 16h20v8H39zM37 15h2v13h-2zM59 15h2v13h-2z" fill={palette[1]} /><path d="M42 17h5v4h-5z" fill="#e5ebd5" /><path d="M6 3h60v1H6z" fill={palette[1]} opacity=".7" />
    </> : ["cot", "bunk", "cushion"].includes(id) ? <>
      <path d="M10 29h53v2H10z" fill="currentColor" opacity=".12" />
      {id === "cushion" ? <><path d="M17 15h38v4h5v9H12v-9h5z" fill="currentColor" opacity=".65" /><path d="M18 19h35v6H18z" fill="currentColor" opacity=".35" /><path d="M22 15h12v7H22z" fill="#deead9" /></> : <>
        <path d="M12 17h3v14h-3zM57 17h3v14h-3zM15 25h42v3H15z" fill="currentColor" opacity=".45" /><path d="M15 18h42v7H15z" fill="currentColor" opacity=".8" /><path d="M19 18h11v5H19z" fill="#deead9" />
        {id === "bunk" ? <><path d="M12 3h3v17h-3zM57 3h3v17h-3zM15 6h42v3H15z" fill="currentColor" opacity=".6" /><path d="M15 3h42v3H15z" fill="currentColor" /><path d="M45 9h2v22h-2zM52 9h2v22h-2zM47 14h5v2h-5zM47 21h5v2h-5z" fill="#b4c5c2" /></> : null}
      </>}
    </> : ["checker", "moon", "none"].includes(id) ? <>
      <path d="M11 7h50l8 23H3z" fill="currentColor" opacity={id === "none" ? ".12" : ".75"} />
      {id === "none" ? <path d="M12 15h49M8 23h57M27 8v6m15 2v6m-19 2v5" stroke="currentColor" opacity=".4" /> : <><path d="M15 10h42l5 17H9z" fill="#0d2024" /><path d={id === "moon" ? "M33 11h8v3h-5v7h8v-3h3v7H32v-4h-3v-7h4z" : "M17 11h8v6h-8zM33 11h8v6h-8zM49 11h7v6h-7zM25 19h8v6h-8zM41 19h8v6h-8z"} fill="currentColor" opacity=".8" /><path d="M9 30v3m6-3v3m6-3v3m6-3v3m6-3v3m6-3v3m6-3v3m6-3v3m6-3v3m6-3v3" stroke="currentColor" opacity=".4" /></>}
    </> : id === "plant" ? <>
      <path d="M29 22h15v4h-2v6H31v-6h-2z" fill="#b98c72" /><path d="M35 8h3v15h-3zM25 9h10v6H25zM38 5h11v6H38zM39 15h11v5H39z" fill="currentColor" /><path d="M26 9h7v2h-7zM40 5h8v2h-8z" fill="#d6e7bb" opacity=".5" />
    </> : id === "lamp" ? <>
      <path d="M25 18h22l10 14H15z" fill="currentColor" opacity=".1" /><path d="M35 17h3v12h-3zM28 29h18v3H28z" fill="#819b98" /><path d="M28 3h16l6 15H22z" fill="currentColor" /><path d="M31 5h9l4 11H27z" fill="#f7e8bd" opacity=".6" />
    </> : <>
      <path d="M18 24h36v8H18z" fill="#b19375" /><path d="M23 14h33v9H23z" fill="currentColor" opacity=".65" /><path d="M19 4h31v9H19z" fill="#9d91b6" /><path d="M22 27h29v2H22zM26 17h27v3H26zM22 7h25v3H22z" fill="#e5dfc4" />
    </>}
  </svg>;
}
