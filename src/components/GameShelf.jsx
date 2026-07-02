import { Gamepad2, RadioTower } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { games } from "../data/site";

const STEAM_PLAYTIME_ENDPOINT = "/api/steam-playtime";

const initialSteamPlaytime = {
  status: "syncing",
  source: "fallback",
  games: {}
};

export function GameShelf() {
  const [flippedCards, setFlippedCards] = useState(() => new Set());
  const [closingCards, setClosingCards] = useState(() => new Set());
  const [steamPlaytime, setSteamPlaytime] = useState(initialSteamPlaytime);
  const closingTimers = useRef(new Map());

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

  useEffect(() => {
    return () => {
      closingTimers.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  function activateCard(event) {
    event.currentTarget.classList.add("is-active");
  }

  function toggleCardFlip(title) {
    setFlippedCards((current) => {
      const next = new Set(current);
      if (next.has(title)) {
        next.delete(title);
        setClosingCards((closing) => new Set(closing).add(title));
        window.clearTimeout(closingTimers.current.get(title));
        const timer = window.setTimeout(() => {
          setClosingCards((closing) => {
            const nextClosing = new Set(closing);
            nextClosing.delete(title);
            return nextClosing;
          });
          closingTimers.current.delete(title);
        }, 260);
        closingTimers.current.set(title, timer);
      } else {
        next.add(title);
        setClosingCards((closing) => {
          const nextClosing = new Set(closing);
          nextClosing.delete(title);
          return nextClosing;
        });
        window.clearTimeout(closingTimers.current.get(title));
        closingTimers.current.delete(title);
      }
      return next;
    });
  }

  function returnToCover(event, title) {
    const card = event.currentTarget.closest(".game-card");
    event.currentTarget.blur();
    card?.classList.remove("is-active");
    resetCardPointer({ currentTarget: card });
    toggleCardFlip(title);
  }

  function setCardPointer(event) {
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
  }

  function getGameHours(game) {
    return steamPlaytime.games?.[game.appId]?.label || game.hours;
  }

  const syncedCount = games.filter((game) => steamPlaytime.games?.[game.appId]).length;
  const hasLiveSteamHours = steamPlaytime.status === "online" && syncedCount > 0;
  const steamStatusLabel =
    steamPlaytime.status === "syncing"
      ? "steam sync..."
      : hasLiveSteamHours
        ? "steam hours live"
        : "local hours";
  const syncReadout =
    steamPlaytime.status === "syncing"
      ? "sync // pending"
      : hasLiveSteamHours
        ? `sync // ${syncedCount}/${games.length}`
        : "sync // local";

  return (
    <section className="py-16 md:py-24" id="games">
      <div className="mb-8 max-w-3xl">
        <p className="pixel-label mb-2">GAME.SHELF</p>
        <h2 className="font-display text-[clamp(2rem,4.8vw,4.6rem)] font-black uppercase leading-[.95] text-white text-balance">
          Favorite game archive.
        </h2>
      </div>

      <div className="game-shelf panel-strong overflow-visible p-4 md:p-6">
        <header className="game-shelf-toolbar">
          <p>Covers, worlds, and playtime signals pulled from the cabinet while the shelf syncs.</p>
          <div className="game-shelf-stats">
            <span><Gamepad2 size={13} aria-hidden="true" /> {String(games.length).padStart(2, "0")} cartridges</span>
            <span className={hasLiveSteamHours ? "is-live" : ""}><RadioTower size={13} aria-hidden="true" /> {steamStatusLabel}</span>
            <span>{syncReadout}</span>
          </div>
        </header>

        <div className="game-shelf-stage">
          <span className="game-shelf-corner game-shelf-corner-tl" aria-hidden="true" />
          <span className="game-shelf-corner game-shelf-corner-tr" aria-hidden="true" />
          <span className="game-shelf-corner game-shelf-corner-bl" aria-hidden="true" />
          <span className="game-shelf-corner game-shelf-corner-br" aria-hidden="true" />

          <div className="game-shelf-grid">
            {games.map((game) => {
              const isFlipped = flippedCards.has(game.title);
              const isClosing = closingCards.has(game.title);

              return (
                <article
                  className={`game-card game-card-${game.accent} ${isFlipped ? "is-flipped" : ""} ${isClosing ? "is-review-closing" : ""}`}
                  key={game.title}
                  onBlur={resetCardPointer}
                  onFocus={activateCard}
                  onPointerEnter={activateCard}
                  onPointerLeave={resetCardPointer}
                  onPointerMove={setCardPointer}
                >
                  <div className="game-card-scene">
                    <div className="game-card-flip">
                      <div className="game-card-flip-inner">
                        <button
                          className="game-card-cover-wrap game-card-face game-card-face-front"
                          type="button"
                          aria-label={`Show review for ${game.title}`}
                          aria-pressed={isFlipped}
                          onClick={() => toggleCardFlip(game.title)}
                        >
                          <img className="game-card-cover" src={game.image} alt={`Cover art for ${game.title}`} loading="lazy" />
                        </button>
                      </div>
                    </div>
                    <div className="game-card-review" onPointerMove={setCardPointer}>
                      <span className="game-card-review-kicker">review slot</span>
                      <strong>{game.title}</strong>
                      <div className="game-card-review-copy" tabIndex="0">
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
                    <img className="game-card-character" src={game.character} alt="" loading="eager" decoding="async" fetchPriority="high" aria-hidden="true" />
                    <div className="game-card-logo-wrap" aria-hidden="true">
                      <img className="game-card-logo" src={game.logo} alt="" loading="lazy" />
                    </div>
                    <span className="game-card-bay">{game.bay}</span>
                  </div>

                  <div className="game-card-meta">
                    <span className="game-card-kicker">{game.kicker}</span>
                    <strong>{game.title}</strong>
                    <em>{game.meta}</em>
                    <small>{game.genre}</small>
                    <small className={steamPlaytime.games?.[game.appId] ? "game-card-hours is-live" : "game-card-hours"}>
                      {getGameHours(game)}
                    </small>
                    <span className="game-card-serial">{game.serial}</span>
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
