import { BuddyMarketStand } from "./BuddyMarket";
import { useEffect, useState } from "react";
import { discord, profile } from "../data/site";
import { useLanyardPresence } from "../hooks/useLanyardPresence";
import { ScreenBuddy } from "./ScreenBuddy";
import { FooterScenery } from "./FooterScenery";
import { FooterWildlife } from "./FooterWildlife";

const VISIT_COUNTED_KEY = "daivr.visitCounted.v1";

export function SiteFooter({ buddy, onBuddyPet, onPowerOutage, onOpenMarket }) {
  const [visitCount, setVisitCount] = useState(null);
  const [visitError, setVisitError] = useState(false);
  const [discordUser, setDiscordUser] = useState(null);
  const year = new Date().getFullYear();
  const promptHost = discordUser?.username || profile.handle;

  const presence = useLanyardPresence(discord.userId);
  const spotify = presence.data?.listening_to_spotify && presence.data.spotify ? presence.data.spotify : null;

  useEffect(() => {
    // Una pestana cuenta una vez: las recargas solo leen el contador. El
    // servidor tambien ignora repeticiones del mismo visitante durante 30 min.
    function visitAlreadyCounted() {
      try {
        if (window.sessionStorage.getItem(VISIT_COUNTED_KEY)) return true;
        window.sessionStorage.setItem(VISIT_COUNTED_KEY, "1");
      } catch {
        // Sin sessionStorage se cuenta; el servidor sigue deduplicando.
      }
      return false;
    }

    async function hitVisit() {
      try {
        const response = visitAlreadyCounted()
          ? await fetch("/api/visits", { cache: "no-store" })
          : await fetch("/api/visits/hit", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
          });
        if (!response.ok) throw new Error("visit failed");
        const payload = await response.json();
        if (typeof payload.count === "number") setVisitCount(payload.count);
      } catch (error) {
        console.error("Error registering visit", error);
        setVisitError(true);
      }
    }

    async function loadDiscordUser() {
      try {
        const response = await fetch("/api/comments", { credentials: "include" });
        if (!response.ok) return;
        const payload = await response.json();
        setDiscordUser(payload.auth?.user || null);
      } catch (error) {
        console.error("Error loading Discord footer user", error);
      }
    }

    hitVisit();
    loadDiscordUser();
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("daivr-now-playing", {
      detail: {
        active: Boolean(spotify),
        song: spotify?.song || "",
        artist: spotify?.artist || ""
      }
    }));

    if (spotify) {
      window.dispatchEvent(new CustomEvent("daivr-buddy-quest-progress", {
        detail: { type: "spotify" }
      }));
    }
  }, [spotify]);

  return (
    <div className={`app-footer-zone ${spotify ? "is-spotify-live" : ""}`}>
      <FooterScenery />
      <FooterWildlife />
      <BuddyMarketStand onClick={onOpenMarket} />
      <ScreenBuddy
        onPet={onBuddyPet}
        onPowerOutage={onPowerOutage}
        user={discordUser}
        visitCount={visitError ? null : visitCount}
        friendshipLevel={buddy.friendship.level}
        inventory={buddy.adventure.inventoryIds}
        hiddenGear={buddy.effectiveHiddenGear}
        unlockedGear={buddy.unlockedGearIds}
        nowPlaying={spotify ? { song: spotify.song, artist: spotify.artist } : null}
      />
      <footer className="app-footer">
        {spotify ? (
          <div className="footer-ticker" aria-label={`Now playing on Spotify: ${spotify.song} by ${spotify.artist}`}>
            <div className="footer-ticker-content">
              <span className="footer-ticker-label" aria-hidden="true">
                <i className="footer-ticker-note">♪</i>
                now_playing
              </span>
              <div className="footer-ticker-viewport" aria-hidden="true">
                <div className="footer-ticker-scroll">
                  {[0, 1].map((copy) => (
                    <span className="footer-ticker-item" key={copy}>
                      <b>{spotify.song}</b>
                      <span className="footer-ticker-sep">—</span>
                      {spotify.artist}
                      <span className="footer-ticker-sep">//</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="footer-shell">
          <div className="footer-grid">
            <p className="footer-build">
              <span className="footer-tok-comment">//</span>{" "}
              cabinet powered by{" "}
              <span className="footer-tok-str">'late-night code'</span>{" "}
              <span className="footer-tok-op">&&</span>{" "}
              <span className="footer-tok-fn">arcade</span>
              <span className="footer-tok-punct">.</span>
              <span className="footer-tok-fn">sync</span>
              <span className="footer-tok-punct">(</span>
              <span className="footer-tok-str">'green-room signal'</span>
              <span className="footer-tok-punct">)</span>{" "}
              <span className="footer-tok-comment">· {year}</span>
            </p>

            <div className="footer-status-stack">
              <div className="footer-pill footer-pill-status">
                <span className="footer-pill-led footer-pill-led-cyan" aria-hidden="true">
                  <span className="footer-pill-led-core" />
                  <span className="footer-pill-led-ping" />
                </span>
                <span className="footer-pill-label">system_status</span>
                <span className="footer-pill-value">nominal</span>
              </div>
              <div className="footer-pill footer-pill-players">
                <span className="footer-pill-led footer-pill-led-green" aria-hidden="true">
                  <span className="footer-pill-led-core" />
                  <span className="footer-pill-led-ping" />
                </span>
                {/* Es el contador historico de visitas; la gente conectada ahora
                    sale en la barra superior ("N in the arcade"). */}
                <span className="footer-pill-label">total_visits</span>
                <span className="footer-pill-value tabular-nums">
                  {visitError ? "—" : visitCount === null ? "..." : visitCount.toLocaleString("en-US")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-prompt-band">
          <div className="footer-prompt" aria-hidden="true">
            <span className="footer-prompt-user">guest</span>
            <span className="footer-prompt-at">@</span>
            <span className="footer-prompt-host">{promptHost}</span>
            <span className="footer-prompt-colon">:</span>
            <span className="footer-prompt-path">~$</span>
            <span className="footer-prompt-cmd">session.end()</span>
            <span className="footer-prompt-caret" />
          </div>
        </div>
      </footer>
    </div>
  );
}
