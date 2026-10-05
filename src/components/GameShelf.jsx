import { ArrowUpRight, BookOpen, Clock3, Gamepad2, RadioTower, RotateCcw, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { games } from "../data/site";
import { DecodeText } from "./DecodeText";
import { GameCardFlip } from "./GameCardFlip";

const STEAM_PLAYTIME_ENDPOINT = "/api/steam-playtime";

const reduceMotionQuery =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

const initialSteamPlaytime = {
  status: "syncing",
  source: "fallback",
  games: {}
};

function parseHoursLabel(value) {
  const match = String(value || "").match(/[\d,.]+/);
  return match ? Number(match[0].replaceAll(",", "")) || 0 : 0;
}

export function GameShelf() {
  const [flippedCards, setFlippedCards] = useState(() => new Set());
  const [steamPlaytime, setSteamPlaytime] = useState(initialSteamPlaytime);

  useEffect(() => {
    const appIds = games.map((game) => game.appId).filter(Boolean);
    if (!appIds.length) {
      setSteamPlaytime({ status: "fallback", source: "fallback", games: {} });
      return undefined;
    }

    const controller = new AbortController();
    const url = `${STEAM_PLAYTIME_ENDPOINT}?appids=${encodeURIComponent(appIds.join(","))}`;

    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Steam playtime returned ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        setSteamPlaytime({
          status: payload?.source === "steam" ? "online" : "fallback",
          source: payload?.source || "fallback",
          updatedAt: payload?.updatedAt || "",
          games: payload?.games || {}
        });
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setSteamPlaytime({ status: "fallback", source: "fallback", games: {} });
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    games.forEach((game) => {
      const image = new Image();
      image.src = game.character;
      image.decode?.().catch(() => undefined);
    });
  }, []);

  useEffect(() => {
    function keepReviewWheelInside(event) {
      const copy = event.target.closest?.(".game-card-review-copy");
      if (!copy || !copy.closest(".game-card.is-flipped")) return;

      event.preventDefault();
      event.stopPropagation();

      const lineHeight = Number.parseFloat(window.getComputedStyle(copy).lineHeight) || 20;
      copy.scrollTop += Math.sign(event.deltaY) * lineHeight;
    }

    window.addEventListener("wheel", keepReviewWheelInside, { capture: true, passive: false });
    return () => window.removeEventListener("wheel", keepReviewWheelInside, { capture: true });
  }, []);

  function activateCard(event) {
    event.currentTarget.classList.add("is-active");
  }

  function toggleCardFlip(title) {
    const wasFlipped = flippedCards.has(title);
    setFlippedCards((current) => {
      const next = new Set(current);
      if (wasFlipped) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });

    if (!wasFlipped) {
      window.dispatchEvent(new CustomEvent("daivr-buddy-quest-progress", {
        detail: { type: "cartridge", id: `game:${title}` }
      }));
    }
  }

  function returnToCover(event, title) {
    const card = event.currentTarget.closest(".game-card");
    toggleCardFlip(title);
    card?.querySelector(".game-card-review-toggle")?.focus({ preventScroll: true });
  }

  function openReview(event, title) {
    const card = event.currentTarget.closest(".game-card");
    toggleCardFlip(title);
    window.requestAnimationFrame(() => {
      if (!card?.classList.contains("is-flipped")) return;
      card?.querySelector(".game-card-review-copy")?.focus({ preventScroll: true });
    });
  }

  function setCardPointer(event) {
    if (reduceMotionQuery?.matches) return;

    const card = event.currentTarget.closest?.(".game-card") || event.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

    card.style.setProperty("--tilt-x", `${(-y * 7).toFixed(2)}deg`);
    card.style.setProperty("--tilt-y", `${(x * 9).toFixed(2)}deg`);
    card.style.setProperty("--cover-x", `${(-x * 9).toFixed(2)}px`);
    card.style.setProperty("--cover-y", `${(-y * 7).toFixed(2)}px`);
    card.style.setProperty("--char-x", `${(x * 24).toFixed(2)}px`);
    card.style.setProperty("--char-y", `${(y * 12).toFixed(2)}px`);
    card.style.setProperty("--char-rot-x", `${(-y * 5).toFixed(2)}deg`);
    card.style.setProperty("--char-rot-y", `${(x * 8).toFixed(2)}deg`);
    card.style.setProperty("--logo-x", `${(x * 8).toFixed(2)}px`);
    card.style.setProperty("--logo-y", `${(y * 5).toFixed(2)}px`);
    card.style.setProperty("--shadow-x", `${(x * 18).toFixed(2)}px`);
    card.style.setProperty("--shadow-y", `${(y * 5).toFixed(2)}px`);
    card.style.setProperty("--shine-x", `${((x + 1) * 50).toFixed(2)}%`);
    card.style.setProperty("--shine-y", `${((y + 1) * 50).toFixed(2)}%`);
    card.style.setProperty("--foil-x", `${(x * 42).toFixed(2)}%`);
    card.style.setProperty("--foil-y", `${(y * 24).toFixed(2)}%`);
  }

  function resetCardPointer(event) {
    const card = event.currentTarget;
    card.classList.remove("is-active");
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
    card.style.setProperty("--cover-x", "0px");
    card.style.setProperty("--cover-y", "0px");
    card.style.setProperty("--char-x", "0px");
    card.style.setProperty("--char-y", "0px");
    card.style.setProperty("--char-rot-x", "0deg");
    card.style.setProperty("--char-rot-y", "0deg");
    card.style.setProperty("--logo-x", "0px");
    card.style.setProperty("--logo-y", "0px");
    card.style.setProperty("--shadow-x", "0px");
    card.style.setProperty("--shadow-y", "0px");
    card.style.setProperty("--shine-x", "50%");
    card.style.setProperty("--shine-y", "30%");
    card.style.setProperty("--foil-x", "0%");
    card.style.setProperty("--foil-y", "0%");
  }

  function getGameHours(game) {
    return steamPlaytime.games?.[game.appId]?.label || game.hours;
  }

  function getGameHourValue(game) {
    return parseHoursLabel(getGameHours(game));
  }

  const syncedCount = games.filter((game) => steamPlaytime.games?.[game.appId]).length;
  const hasLiveSteamHours = steamPlaytime.status === "online" && syncedCount > 0;
  const totalHours = games.reduce((sum, game) => sum + getGameHourValue(game), 0);
  const topGame = games.reduce((top, game) => (getGameHourValue(game) > getGameHourValue(top) ? game : top), games[0]);
  const badgePool = [...new Set(games.flatMap((game) => game.badges || []))];
  // Antes eran dos fichas separadas ("local hours" y "sync // local") diciendo
  // la misma mitad de la historia cada una. Una sola lo dice entero: el estado
  // como cifra y el detalle debajo.
  const syncLabel = steamPlaytime.status === "syncing" ? "sync" : hasLiveSteamHours ? "live" : "local";
  const syncDetail = steamPlaytime.status === "syncing" ? "contacting steam" : hasLiveSteamHours ? `steam ${syncedCount}/${games.length} synced` : "hours source";
  const topShare = totalHours > 0 ? Math.round((getGameHourValue(topGame) / totalHours) * 100) : 0;

  return (
    <section className="py-16 md:py-24" id="games">
      <div className="mb-8 max-w-3xl">
        <DecodeText as="p" className="pixel-label mb-2" duration={520} text="GAME.SHELF" />
        <DecodeText
          as="h2"
          className="font-display text-[clamp(2rem,4.8vw,4.6rem)] font-black uppercase leading-[.95] text-white text-balance"
          delay={140}
          duration={980}
          text="Favorite game archive."
        />
      </div>

      <div className="game-shelf game-collection panel-strong overflow-visible p-4 md:p-6">
        <div className="game-shelf-titlebar">
          <span className="game-shelf-lights" aria-hidden="true"><i /><i /><i /></span>
          <code>DAI'S ARCADE / FAVORITES 01</code>
          <span className="game-shelf-titlebar-mode"><BookOpen size={13} aria-hidden="true" /> personal collection</span>
        </div>
        <header className="game-shelf-toolbar">
          <div className="game-shelf-intro">
            <p>Kept within reach.</p>
            <span>The worlds I keep coming back to. Tap a cover to read my notes.</span>
          </div>
          {/* Cifras grandes con su rotulo debajo: eran tres frases sueltas del
              mismo peso y no se sabia cual era el dato. */}
          <div className="game-shelf-stats">
            <span><Gamepad2 size={13} aria-hidden="true" /><b>{String(games.length).padStart(2, "0")}</b><small>cartridges</small></span>
            <span><Clock3 size={13} aria-hidden="true" /><b>{Math.round(totalHours).toLocaleString("en-US")}</b><small>hours logged</small></span>
            <span className={hasLiveSteamHours ? "is-live" : ""}><RadioTower size={13} aria-hidden="true" /><b>{syncLabel}</b><small>{syncDetail}</small></span>
          </div>
        </header>

        <div className={`game-collection-plaque game-card-${topGame.accent}`} aria-label="Game shelf summary">
          <img className="game-collection-plaque-cover" src={topGame.image} alt="" aria-hidden="true" decoding="async" />
          <div className="game-collection-plaque-copy">
            <span><Trophy size={13} aria-hidden="true" /> Most played</span>
            <strong>{topGame.title}</strong>
            <i className="game-collection-plaque-bar" style={{ "--share": `${topShare}%` }} aria-hidden="true" />
          </div>
          <b>{Math.round(getGameHourValue(topGame)).toLocaleString("en-US")}h<small>{topShare}% of all hours</small></b>
          <span className="game-collection-inscription">PERSONAL ARCHIVE <i /> {badgePool.length} traits collected</span>
        </div>

        <div className="game-shelf-stage">
          <span className="game-shelf-corner game-shelf-corner-tl" aria-hidden="true" />
          <span className="game-shelf-corner game-shelf-corner-tr" aria-hidden="true" />
          <span className="game-shelf-corner game-shelf-corner-bl" aria-hidden="true" />
          <span className="game-shelf-corner game-shelf-corner-br" aria-hidden="true" />

          <div className="game-shelf-grid">
            {games.map((game, gameIndex) => {
              const isFlipped = flippedCards.has(game.title);
              const hours = getGameHourValue(game);
              const hourPercent = totalHours > 0 ? Math.min(100, (hours / totalHours) * 100) : 0;
              const reviewId = `game-review-${game.appId}`;

              return (
                <article
                  className={`game-card game-card-${game.accent} ${isFlipped ? "is-flipped" : ""}`}
                  key={game.title}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) resetCardPointer(event);
                  }}
                  onFocus={activateCard}
                  onPointerEnter={activateCard}
                  onPointerLeave={resetCardPointer}
                  onPointerMove={setCardPointer}
                >
                  <div className="game-card-scene">
                    {/* La portada desenfocada detras del cartucho: cada juego
                        tiñe la estanteria con sus propios colores. */}
                    <img className="game-card-ambient" src={game.image} alt="" aria-hidden="true" decoding="async" />
                    <div className="game-card-cartridge-bar" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <i />
                    </div>
                    <div className="game-card-flip">
                      <GameCardFlip flipped={isFlipped}>
                        <div className="game-card-front" inert={isFlipped} aria-hidden={isFlipped}>
                          <div className="game-case-spine" aria-hidden="true"><span>{game.bay}</span><b>{game.title}</b><i /></div>
                          <button
                            className="game-card-cover-wrap"
                            type="button"
                            aria-label={`Show review for ${game.title}`}
                            aria-pressed={isFlipped}
                            aria-controls={reviewId}
                            tabIndex={isFlipped ? -1 : 0}
                            onClick={(event) => openReview(event, game.title)}
                          >
                            <img className="game-card-cover" src={game.image} alt={`Cover art for ${game.title}`} loading="eager" decoding="async" fetchPriority="high" style={game.coverPosition ? { objectPosition: game.coverPosition } : undefined} />
                            <span className="game-card-foil" aria-hidden="true" />
                          </button>
                          <img className="game-card-character" src={game.character} alt="" loading="eager" decoding="async" fetchPriority="high" aria-hidden="true" />
                          <div className="game-card-logo-wrap" aria-hidden="true">
                            <img className="game-card-logo" src={game.logo} alt="" loading="eager" decoding="async" fetchPriority="high" />
                          </div>
                          <span className="game-card-bay">{game.bay}</span>
                          <span className="game-card-favorite-ribbon">{game.favoriteRank || game.kicker}</span>
                        </div>
                        <div className="game-card-back" inert={!isFlipped} aria-hidden={!isFlipped}>
                        <div className="game-case-spine" aria-hidden="true"><span>{game.bay}</span><b>{game.title}</b><i /></div>
                        <div className="game-card-review" id={reviewId} onPointerMove={setCardPointer} onKeyDown={(event) => {
                          if (event.key === "Escape") {
                            event.stopPropagation();
                            returnToCover(event, game.title);
                          }
                        }}>
                          <span className="game-card-review-kicker"><BookOpen size={13} aria-hidden="true" /> Dai's field notes</span>
                          <strong>{game.title}</strong>
                          <div className="game-card-review-copy" tabIndex="0" role="region" aria-label={`Review of ${game.title}`}>
                            {game.review || "Review pending. Your notes for this game will live here once they are ready."}
                          </div>
                          <button
                            className="game-card-review-action"
                            type="button"
                            aria-label={`Back to cover for ${game.title}`}
                            onClick={(event) => returnToCover(event, game.title)}
                          >
                            back to cover
                          </button>
                        </div>
                        </div>
                      </GameCardFlip>
                    </div>

                  </div>

                  <div className="game-card-meta" data-rank={String(gameIndex + 1).padStart(2, "0")}>
                    <span className="game-card-kicker">{game.kicker}</span>
                    <strong>{game.title}</strong>
                    <em>{game.meta} · {game.genre}</em>
                    <div className="game-card-badges" aria-label={`${game.title} badges`}>
                      {(game.badges || []).map((badge) => (
                        <span key={badge}>{badge}</span>
                      ))}
                    </div>
                    <div className="game-card-playtime" style={{ "--game-hours-progress": `${hourPercent}%` }}>
                      <div className="game-card-hours-head">
                        <span><Clock3 size={13} aria-hidden="true" /> time in world</span>
                        <span>{Math.round(hourPercent)}% of shelf</span>
                      </div>
                      <b className="game-card-hours-value">{Math.round(hours).toLocaleString("en-US")}<span>HRS</span></b>
                      <i aria-hidden="true" />
                    </div>
                    {/* steam_app 524220 y SN//0524220 eran el mismo numero dos
                        veces. Queda el serial, y el hueco lo ocupa algo que no
                        se sabia por tarjeta: si esas horas vienen de Steam. */}
                    <div className="game-card-id">
                      <span className="game-card-serial">{game.serial}</span>
                      <b className={steamPlaytime.games?.[game.appId] ? "is-live" : ""}>
                        {steamPlaytime.games?.[game.appId] ? "steam live" : "local"}
                      </b>
                    </div>
                    <button
                      className="game-card-review-toggle arcade-focus"
                      type="button"
                      aria-label={`${isFlipped ? "Close" : "Read"} review for ${game.title}`}
                      aria-expanded={isFlipped}
                      aria-controls={reviewId}
                      onClick={(event) => isFlipped ? returnToCover(event, game.title) : openReview(event, game.title)}
                    >
                      {isFlipped ? <RotateCcw size={15} aria-hidden="true" /> : <BookOpen size={15} aria-hidden="true" />}
                      {isFlipped ? "Back to cover" : "Read my review"}
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="game-shelf-readout">
          <span><i /> {hasLiveSteamHours ? "steam profile linked" : "local shelf cache"}</span>
          <span className="game-shelf-dots">··· ··· ··· ···</span>
          <span>{String(hasLiveSteamHours ? syncedCount : games.length).padStart(2, "0")}/{String(games.length).padStart(2, "0")} cartridges</span>
        </div>
      </div>
    </section>
  );
}
