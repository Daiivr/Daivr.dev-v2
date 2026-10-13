import { LogIn } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { RankingAvatar } from "./RankingAvatar";

// Ranking de grupo de PokéSurvivor en la tele: la tabla historica de partidas
// en grupo del propio juego (GET /api/pokesurvivor/ranking?mode=g, la sube el
// anfitrion al acabar; server/pokesurvivor.mjs). Cada equipo sale con los
// compañeros Pokemon de sus miembros, como en el ranking del juego.
const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

// Medidas del primer fotograma de Idle (tools/pokesurvivor/build.mjs, idleFrames).
let framesRequest = null;
const loadFrames = () => (framesRequest ??= fetch("/pokesurvivor/idle-frames.json")
  .then((response) => (response.ok ? response.json() : Promise.reject(new Error("frames"))))
  .catch(() => { framesRequest = null; return {}; }));

const loadImage = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = src;
});

// Fila 0 de la hoja = mirando hacia abajo. Se recorta al contorno del bicho
// para que todos llenen su casilla igual.
function cropFirstFrame(image, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, width, height, 0, 0, width, height);
  const { data } = context.getImageData(0, 0, width, height);
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] < 16) continue;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  return x1 < 0 ? null : { canvas, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

const portraits = new Map();
function portrait(dex, shiny) {
  const key = `${dex}${shiny ? "s" : ""}`;
  if (!portraits.has(key)) {
    const request = loadFrames().then(async (frames) => {
      const entry = frames[dex];
      if (!entry) return null;
      const useShiny = shiny && entry.length !== 3;
      const [width, height] = useShiny && entry.length === 4 ? entry.slice(2) : entry;
      const base = `/pokesurvivor/assets/pokemon/${dex}/`;
      const image = await loadImage(`${base}${useShiny ? "s/" : ""}Idle.png`).catch(() => (useShiny ? loadImage(`${base}Idle.png`) : null));
      return image ? cropFirstFrame(image, width, height) : null;
    }).catch(() => null);
    request.then((crop) => { if (!crop) portraits.delete(key); });
    portraits.set(key, request);
  }
  return portraits.get(key);
}

function PokeSprite({ dex, shiny }) {
  const ref = useRef(null);
  useEffect(() => {
    let live = true;
    portrait(dex, shiny).then((crop) => {
      const canvas = ref.current;
      if (!live || !canvas || !crop) return;
      canvas.width = crop.w; canvas.height = crop.h;
      canvas.getContext("2d").drawImage(crop.canvas, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
      canvas.classList.add("is-ready");
    });
    return () => { live = false; };
  }, [dex, shiny]);
  return <canvas ref={ref} className={shiny ? "rank-coop-mon is-shiny" : "rank-coop-mon"} width="1" height="1" aria-hidden="true" />;
}

export function PokesurvivorCoopRanking({ me, refreshKey }) {
  const [state, setState] = useState({ loading: true, error: false, rows: [], mine: null });

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: false }));
    fetch("/api/pokesurvivor/ranking?mode=g&period=a", { credentials: "include", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("ranking-offline"))))
      .then((data) => setState({ loading: false, error: false, rows: (data.rows || []).slice(0, 10), mine: data.me?.row ? data.me : null }))
      .catch(() => { if (!controller.signal.aborted) setState({ loading: false, error: true, rows: [], mine: null }); });
    return () => controller.abort();
  }, [refreshKey, me?.id]);

  const { loading, error, rows, mine } = state;
  return (
    <>
      {me ? (
        <div className="tower-ranking-self">
          <RankingAvatar src={me.avatarUrl} name={me.username} loading="eager" />
          <span><small>LINKED AS {me.username}</small><strong>{mine ? `#${mine.pos} // ${clock(mine.t)} // ${mine.row.names.join(" · ")}` : loading ? "LOOKING FOR YOUR SQUAD..." : "NO CO-OP RUN RECORDED"}</strong></span>
        </div>
      ) : <a href="/api/comments/auth/discord"><LogIn size={15} /> CONNECT DISCORD TO RANK</a>}
      {loading ? <p>GATHERING THE SQUADS...</p> : error ? <p>RANKING LINK OFFLINE</p> : rows.length ? (
        <ol className="rank-coop-list">
          {rows.map((row, index) => (
            <li className={me && row.uids.includes(String(me.id)) ? "is-player" : ""} data-rank={index + 1} key={row.id}>
              <b>{String(index + 1).padStart(2, "0")}</b>
              <span className="rank-coop-team" data-size={row.dex.length}>{row.dex.map((dex, member) => <PokeSprite key={`${member}-${dex}`} dex={dex} shiny={Boolean(row.shiny?.[member])} />)}</span>
              <span className="rank-coop-who"><strong>{row.names.join(" · ")}</strong><small>LV {row.lv || 1} · {Number(row.kills || 0).toLocaleString("en-US")} KOS</small></span>
              <em>{clock(row.t)}</em>
            </li>
          ))}
        </ol>
      ) : <p>NO SQUAD HAS SURVIVED YET. HOST A CO-OP RUN!</p>}
    </>
  );
}
