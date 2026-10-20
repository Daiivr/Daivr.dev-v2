import { BuddyMarketStand, useMarketOpen } from "./BuddyMarket";
import { useCallback, useEffect, useMemo, useState } from "react";
import { discord, profile } from "../data/site";
import { useLanyardPresence } from "../hooks/useLanyardPresence";
import { ScreenBuddy } from "./ScreenBuddy";
import { BuddyVisitors } from "./BuddyVisitors";
import { FooterSky } from "./FooterSky";
import { FooterSoundscape } from "./FooterSoundscape";
import { FooterWorld } from "./FooterWorld";
import { FooterMailbox, useMailbox } from "./FooterMailbox";
import { fishermanGaps, gardenPlots } from "../../shared/buddy-market.mjs";
import { farmDay, fruitReady, smokedReadyAt, treeStage } from "../../shared/buddy-farm.mjs";
import { catchById } from "../../shared/buddy-catches.mjs";
import { dayNumber } from "../lib/pixelWorld/life/util";
import { ROD_IDS } from "../hooks/useBuddyLoadout";

const VISIT_COUNTED_KEY = "daivr.visitCounted.v1";
// El dia en que Pip clavo la nota del tablon, y la ultima carta que trajo la
// cartera al buzon.
const BOARD_KEY = "daivr.board.v1";
const COURIER_KEY = "daivr.courier.v1";
const readLocal = (key) => { try { return window.localStorage.getItem(key) || ""; } catch { return ""; } };
const writeLocal = (key, value) => { try { window.localStorage.setItem(key, value); } catch { /* sin almacenamiento: vale para esta visita */ } };
// "3 byte minnows", "2 strawberries", "2 peaches" (lo que ya acaba en s, igual).
function plural(label, n) {
  if (n === 1 || /s$/.test(label) || /honey|fish$/.test(label)) return label;
  if (/[^aeiou]y$/.test(label)) return label.slice(0, -1) + "ies";
  return /(sh|ch|x)$/.test(label) ? label + "es" : label + "s";
}

// El contorno de lo que se puede pulsar en el prado (puesto, huerto,
// pescador): con el raton encima o con el foco del teclado, pero no con el
// foco que devuelve el modal al cerrarse; al pulsar se apaga.
function hoverHandlers(set) {
  return {
    onPointerEnter: () => set(true),
    onPointerLeave: () => set(false),
    onFocus: (event) => set(event.currentTarget.matches(":focus-visible")),
    onBlur: () => set(false)
  };
}

export function SiteFooter({ buddy, season, onBuddyPet, onPowerOutage, onOpenMarket, onOpenGarden, onOpenFisherman, onOpenFishing, onOpenBoard, onOpenSmoker, modalOpen = false }) {
  const [visitCount, setVisitCount] = useState(null);
  const [visitError, setVisitError] = useState(false);
  const [discordUser, setDiscordUser] = useState(null);
  // Fase del dia, altura del sol, cielo y viento (FooterSky), para que el mundo
  // del footer se ponga a juego. Tambien la luna llena y la lluvia de estrellas
  // de esta noche (para Buddy).
  const [sky, setSky] = useState({ phase: "night", cover: "fair", wind: 1, windDir: 6, altitude: -1, fullMoon: false, shower: "" });
  const onSkyPhase = useCallback((next) => {
    setSky((current) => (["phase", "cover", "wind", "windDir", "altitude", "fullMoon", "shower"].every((key) => current[key] === next[key]) ? current : next));
  }, []);
  // El puesto del mercado: abierto o cerrado (lo dibuja FooterWorld) y si el
  // puntero esta encima (se ilumina su contorno).
  const market = useMarketOpen();
  const [marketHover, setMarketHover] = useState(false);
  const [gardenHover, setGardenHover] = useState(false);
  // El pescador ambulante (lo mueve FooterWorld): su boton solo esta mientras
  // esta plantado junto a su carretilla.
  const [fisher, setFisher] = useState({ phase: "away", until: 0 });
  const [fisherHover, setFisherHover] = useState(false);
  // El soporte de cañas junto a la farola: abre el modal de pesca.
  const [rackHover, setRackHover] = useState(false);
  const rodKey = buddy.unlockedGearIds.filter((id) => ROD_IDS.includes(id)).join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rods = useMemo(() => (rodKey ? rodKey.split(",") : []), [rodKey]);
  useEffect(() => {
    const onFisher = (event) => setFisher({ phase: event.detail?.phase || "away", until: event.detail?.until || 0 });
    window.addEventListener("daivr-fisherman-state", onFisher);
    return () => window.removeEventListener("daivr-fisherman-state", onFisher);
  }, []);
  useEffect(() => { if (fisher.phase !== "here") setFisherHover(false); }, [fisher.phase]);
  // El tablon de encargos del puesto y el ahumadero de la hoguera.
  const [boardHover, setBoardHover] = useState(false);
  const [smokerHover, setSmokerHover] = useState(false);
  // Al abrir o cerrar un modal del buddy no queda ningun contorno encendido.
  useEffect(() => { setMarketHover(false); setGardenHover(false); setFisherHover(false); setRackHover(false); setBoardHover(false); setSmokerHover(false); }, [modalOpen]);
  // Un reloj de medio minuto: la miel y la fruta se hacen solas con el tiempo.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30_000); return () => window.clearInterval(timer); }, []);
  // Peces ya pescados: los que Buddy puede asar en la hoguera.
  const fishJournal = buddy.adventure.fishJournal;
  // El buzon junto a la hoguera: carta del dia y posdata con la version nueva.
  const mail = useMailbox();
  // La carta nueva llega en mano: la cartera la trae y entonces sube la banderita.
  const [delivered, setDelivered] = useState(() => readLocal(COURIER_KEY));
  const mailKey = mail.flag ? `${dayNumber()}|${mail.version || ""}` : "";
  const courier = mail.flag && delivered !== mailKey ? mailKey : "";
  useEffect(() => {
    const onDelivered = (event) => { const key = event.detail?.key; if (key) { writeLocal(COURIER_KEY, key); setDelivered(key); } };
    const onPin = () => { const day = farmDay(Date.now()); writeLocal(BOARD_KEY, day); setPinnedDay(day); };
    window.addEventListener("daivr-courier-delivered", onDelivered);
    window.addEventListener("daivr-board-pin", onPin);
    return () => { window.removeEventListener("daivr-courier-delivered", onDelivered); window.removeEventListener("daivr-board-pin", onPin); };
  }, []);
  const openQuest = buddy.adventure.quests?.find((quest) => !quest.complete) || null;
  // El huerto del centro del prado: lo plantado en cada parcela. Al pulsarlo
  // se abre su cobertizo (un modal propio, como el mercado).
  const wallet = buddy.adventure.market;
  const gardenKey = wallet.garden.map((seed) => `${seed.id}@${seed.plot}`).join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const garden = useMemo(() => gardenPlots(wallet), [gardenKey]);
  const planted = garden.filter(Boolean).length;
  // La calabaza gigante (si la hay en el huerto): sus parcelas y cuando se junta.
  const giantGroup = wallet.giants?.find((group) => group.ids.every((id) => wallet.garden.some((seed) => seed.id === id))) || null;
  const giantKey = giantGroup ? `${giantGroup.ids.join(",")}@${giantGroup.ripeAt}` : "";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const giant = useMemo(() => (giantGroup ? { plots: giantGroup.plots, ripeAt: giantGroup.ripeAt } : null), [giantKey]);
  // El patio: espantapajaros, la casita de abejas (¿hay miel?) y el arbol (su
  // edad y la fruta que cuelga).
  const lastPick = wallet.fruit?.length ? Date.parse(wallet.fruit[wallet.fruit.length - 1].at) : null;
  const yardKey = [wallet.scarecrow, wallet.bees ? wallet.bees.readyAt <= now : "", wallet.tree ? `${wallet.tree.fruit}:${treeStage(wallet.tree, now)}:${fruitReady(wallet.tree, lastPick, now)}` : ""].join("|");
  const yard = useMemo(() => ({
    scarecrow: Boolean(wallet.scarecrow),
    bees: wallet.bees ? { ready: wallet.bees.readyAt <= now } : null,
    tree: wallet.tree ? { fruit: wallet.tree.fruit, stage: treeStage(wallet.tree, now), ready: fruitReady(wallet.tree, lastPick, now) } : null
  }), [yardKey]); // eslint-disable-line react-hooks/exhaustive-deps
  // El tablon: sin nota hasta que Pip clava la de hoy; hecho, con su sello.
  const [pinnedDay, setPinnedDay] = useState(() => readLocal(BOARD_KEY));
  const today = farmDay(now);
  const board = wallet.order?.done ? "done" : pinnedDay === today ? "note" : "empty";
  const boardOrder = wallet.order ? `${wallet.order.n} ${plural(wallet.order.label.toLowerCase(), wallet.order.n)}` : "";
  // El ahumadero: lo que cuelga (cuanto lleva) y lo listo, hasta tres.
  const smokerKey = [...(wallet.smoked || []).filter((entry) => !entry.sold && !entry.eaten && !entry.given).map((entry) => `${entry.id}@${entry.at}:${smokedReadyAt(entry) <= now ? 1 : Math.floor(Math.min(1, (now - Date.parse(entry.at)) / (smokedReadyAt(entry) - Date.parse(entry.at))) * 10)}`)].join(",");
  // (los ahumados listos, para que Pip se coma uno en la hoguera)
  const smokedReadyKey = Object.entries(wallet.smoker?.ready || {}).map(([id, n]) => `${id}:${n}`).join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const smokedFish = useMemo(() => Object.entries(wallet.smoker?.ready || {}).flatMap(([id, n]) => Array(n).fill(id)), [smokedReadyKey]);
  const smoker = useMemo(() => (wallet.smoked || []).filter((entry) => !entry.sold && !entry.eaten && !entry.given)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at)).slice(-3)
    .map((entry) => {
      const from = Date.parse(entry.at), ready = smokedReadyAt(entry);
      return { color: catchById(entry.id)?.color || "#7a9ab8", ready: ready <= now, k: Math.max(0, Math.min(1, (now - from) / (ready - from))) };
    }), [smokerKey]); // eslint-disable-line react-hooks/exhaustive-deps
  // Cuando el pescador se fue a reponer (porque le compraste todos los señuelos):
  // el mundo le hace irse andando y volver.
  const lureKey = (wallet.lures || []).map((buy) => buy.at).join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fisherGaps = useMemo(() => fishermanGaps(wallet.lures || []), [lureKey]);
  const caughtFish = useMemo(
    // (todo lo ya pescado, para la caña; la hoguera se queda con los peces)
    () => fishJournal.filter((item) => item.discovered).map(({ id, name, kind }) => ({ id, name, kind })),
    [fishJournal]
  );
  const windClass = sky.wind < 0.8 ? "wind-calm" : sky.wind >= 1.4 ? "wind-gusty" : "wind-breeze";
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
    <div className={`app-footer-zone sky-${sky.phase} sky-cover-${sky.cover} ${windClass} ${spotify ? "is-spotify-live" : ""} ${yard.tree || yard.scarecrow ? "has-yard" : ""}`} style={{ "--wind-strength": sky.wind }}>
      <FooterSky onPhase={onSkyPhase} />
      <FooterWorld sky={sky} season={season} marketOpen={market.open} marketHover={marketHover} gardenHover={gardenHover} fisherHover={fisherHover} fisherGaps={fisherGaps} rackHover={rackHover} rods={rods}
        mailFlag={mail.flag && !courier} garden={garden} giant={giant} yard={yard} board={board} boardOrder={boardOrder} boardHover={boardHover} smoker={smoker} smokerHover={smokerHover} courier={courier} />
      <BuddyMarketStand open={market.open} onClick={() => { setMarketHover(false); onOpenMarket?.(); }} onHoverChange={setMarketHover} />
      <FooterMailbox mail={mail} name={discordUser?.username || ""} quest={openQuest} />
      {/* El huerto: boton invisible encima de lo que dibuja el mundo; al pasar
          por encima se ilumina su contorno y cuelga su cartel (como el puesto). */}
      <button type="button" className="footer-garden-button" onClick={() => { setGardenHover(false); onOpenGarden?.(); }} {...hoverHandlers(setGardenHover)}
        aria-label={`Garden: ${planted ? `${planted} of ${garden.length} plots planted` : "empty"}. Open the garden shed.`} />
      {/* El tablon de encargos (en el mostrador del puesto) y la hoguera con su
          ahumadero. */}
      <button type="button" className="footer-board-button" onClick={() => { setBoardHover(false); onOpenBoard?.(); }} {...hoverHandlers(setBoardHover)}
        aria-label={board === "done" ? "Help Wanted board: today's request is done." : "Help Wanted board: today's request from the valley."} />
      <button type="button" className="footer-smoker-button" onClick={() => { setSmokerHover(false); onOpenSmoker?.(); }} {...hoverHandlers(setSmokerHover)}
        aria-label={smoker.length ? `Campfire smoker: ${smoker.filter((entry) => entry.ready).length} smoked fish ready.` : "Campfire smoker: hang a fish over the coals."} />
      <button type="button" className="footer-rack-button" onClick={() => { setRackHover(false); onOpenFishing?.(); }} {...hoverHandlers(setRackHover)}
        aria-label="Fishing gear: rods, lures and the catch journal." />
      {fisher.phase === "here" ? (
        <button type="button" className="footer-fisherman-button" onClick={() => { setFisherHover(false); onOpenFisherman?.(); }} {...hoverHandlers(setFisherHover)}
          aria-label="The traveling fisherman is here. Buy rods and lures, or sell your catch." />
      ) : null}
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
        skyPhase={sky.phase}
        skyCover={sky.cover}
        fullMoon={sky.fullMoon}
        meteorShower={sky.shower}
        caughtFish={caughtFish}
        smokedFish={smokedFish}
      />
      {/* Despues de ScreenBuddy: FooterWorld busca al buddy de casa con el
          primer .screen-buddy-root del footer. */}
      <BuddyVisitors
        friendshipLevel={buddy.friendship.level}
        inventory={buddy.adventure.inventoryIds}
        hiddenGear={buddy.effectiveHiddenGear}
        unlockedGear={buddy.unlockedGearIds}
        hostName={discordUser?.username || ""}
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
              <FooterSoundscape phase={sky.phase} cover={sky.cover} wind={sky.wind} />
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
