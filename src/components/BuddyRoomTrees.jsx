// Uneven boughs, open branches, and overlapping crowns give the pixel forest depth.
export function BuddyRoomTrees({ winter, autumn }) {
  return <>
    <g fill={winter ? "#728e98" : "#354f53"} opacity=".8">
      {[70, 92, 122, 142, 167, 188, 215, 239, 260, 280].map((x, i) => <path key={x} d={`M${x} ${164 + i % 3 * 7}l-5 12h3l-9 15h5l-12 20h36l-12-20h5l-9-15h3z`} />)}
    </g>
    {[[79, 144, .98], [155, 166, .83], [209, 151, 1.07], [273, 168, .87]].map(([x, y, scale], i) => <g key={x} transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className="room-window-tree" style={{ animationDelay: `${-i * 1.7}s` }}>
        <path d="M-2 10h3l2 72h-6z" fill="#6b6856" />
        <path d="M0 0l-3 8-3 2 3 1-8 9-4 1 6 2-6 6-7 4 6 1-4 7-10 5 7 1-5 6-11 7 11-1-6 6 17-3 5 3 7-2 8 2 15-1-7-5 9 1-10-8-7-3 5-1-9-9-5-2 6-1-9-8-4-1 5-2-7-8-4-2 2-2z" fill={winter ? "#668487" : "#254a42"} />
        <path d="M0 2l-3 10-6 9 7-2-8 12-8 3 11-1-6 11-10 4 13-2-10 12-10 3 13-1 10-7 4-17z" fill={winter ? "#c6d5d3" : "#638879"} />
        <path d="M1 15l6 8-5-1 8 10-8-2 13 14-12-4 16 14-12-2 13 10-18-7z" fill={winter ? "#96b0b0" : "#3b6355"} />
        <path d="M-10 25l8-3M-17 39l11-4M-21 54l11-3M5 34l7 3M8 49l11 5M-13 61l6-2" stroke={winter ? "#eef0dc" : "#8aab87"} strokeWidth="2" opacity=".65" />
        <path d="M-1 36v34M-1 46l-9 5M0 56l10 6" stroke="#182f30" fill="none" opacity=".65" />
      </g>
    </g>)}
    {[[114, 169, .94], [243, 175, .78]].map(([x, y, scale], i) => <g key={x} transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className="room-window-tree" style={{ animationDelay: `${-3 - i * 2.1}s` }}>
        <path d="M-2 26h4l1 39h-5z" fill="#9b9a81" />
        <path d="M0 43l-14-19m15 13 13-24M0 30l-4-16" stroke="#8d8d78" strokeWidth="2" fill="none" />
        <path d="M-10 2h13v3h10v6h7v7h5v12h-5v9h-9v5H-8v-4h-13v-7h-7V21h5V12h8V5h5z" fill={winter ? "#9bada9" : autumn ? "#846143" : "#366752"} />
        <path d="M-10 2H3v4h7v8H3v5h-13v6h-13V14h8V6h5zM-24 25h12v-5h9v10h-7v7h-10v-5h-4z" fill={winter ? "#d7dfd4" : autumn ? "#c79b5e" : "#7e9d68"} />
        <path d="M5 10h11v8h6v8h-7v7H3v-7h5v-7H1v-5h4zM-6 32h10v8H-6z" fill={winter ? "#b4c6c2" : autumn ? "#ad7b49" : "#58805c"} />
        <path d="M-13 9h6v3h-6zM-21 23h5v3h-5zM-10 28h4v3h-4zM7 13h5v3H7zM10 30h5v3h-5z" fill={winter ? "#eef0dc" : autumn ? "#e0bb79" : "#a5b980"} />
        <path d="M-1 48h3M-2 58h3" stroke="#424c49" strokeWidth="2" />
      </g>
    </g>)}
  </>;
}
