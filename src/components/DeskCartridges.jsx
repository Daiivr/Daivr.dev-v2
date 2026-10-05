import { Gamepad2 } from "lucide-react";

// Gold, silver-cyan and pink, like a podium: the cartridge's label colour says
// where it sits in the top three.
const RANK_TONES = ["var(--color-cabinet)", "var(--color-cyan-arcade)", "var(--color-glitch)"];

function formatHours(ms) {
  const minutes = Math.floor((Number(ms) || 0) / 60000);
  const hours = Math.floor(minutes / 60);
  if (hours >= 1) return `${hours}H ${String(minutes % 60).padStart(2, "0")}M`;
  return minutes >= 1 ? `${minutes}M` : "<1M";
}

/** The three most played games from Dai's Discord stats (the same record the
    Game Boy's stats drawer lists), as Dai Boy cartridges left next to it.
    DiscordPresencePanel refreshes those stats every minute, so when a new game
    climbs into the top three its cartridge slides in on its own. The art is
    the one Discord sent while the game was being played (kept by the stats
    server), then SteamGridDB's, then a gamepad. */
export function DeskCartridges({ library, images = {} }) {
  const top = (library || []).filter((game) => game?.name && game.totalMs > 0).slice(0, 3);
  if (!top.length) return null;

  return (
    <div className="tabletop-carts" role="list" aria-label="Most played games">
      {top.map((game, index) => {
        const image = game.image || images[game.name];
        return (
          <div
            className="tabletop-cart"
            role="listitem"
            key={game.name}
            style={{ "--cart-accent": RANK_TONES[index] }}
            aria-label={`Number ${index + 1}: ${game.name}, ${formatHours(game.totalMs).toLowerCase()} played`}
          >
            <span className="tabletop-cart-label" aria-hidden="true">
              <span className="tabletop-cart-head"><b>{String(index + 1).padStart(2, "0")}</b><i>DAI BOY</i></span>
              <span className={`tabletop-cart-art${image ? "" : " is-empty"}`}>
                {image ? <img src={image} alt="" loading="lazy" decoding="async" /> : <Gamepad2 size={18} />}
                <small>{formatHours(game.totalMs)}</small>
              </span>
              <span className="tabletop-cart-title"><span>{game.name}</span></span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
