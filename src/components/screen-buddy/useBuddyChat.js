import { useEffect, useState } from "react";
import { ACTION_LINES, actionComment, actionTopic, HOST_REPLY_LINES, hostAnswerTo, hostQuestion, pickVisitLine, replyTopic } from "../../../shared/buddy-visits.mjs";
import { EVENT_LINES, sessionMilestone, updateLines } from "../../lib/buddyContext";
import { sendBuddyWave } from "../../lib/buddyWaves";
import { LINES, rememberTopic } from "./buddyLines";

/*
  Charla de Buddy:
  - Con los buddies de visita (BuddyVisitors): les saluda y despide, contesta
    lo que le dicen, comenta lo que hacen, les pregunta cosas y a veces se va
    detras de uno que sale a pasear.
  - Con lo que pasa alrededor: logros, tema, cancion de Spotify, alguien
    escribiendo en el libro de visitas, cambio de cartucho, volver a la
    pestaña o al footer, perder la conexion, version nueva publicada, y cuanto
    llevas aqui.
  - Con otros jugadores: si alguien saluda a este buddy desde su footer, lo
    cuenta, y un clic en Buddy poco despues devuelve el saludo.
*/

// Como mucho una respuesta o comentario a las visitas cada tanto, y a veces
// se va detras de una que sale a pasear.
const VISITOR_CHAT_COOLDOWN_MS = 7000;
const VISITOR_QUESTION_CHANCE = 0.35;
const TAG_ALONG_CHANCE = 0.2;
const TAG_ALONG_GAP = 92;
const TAB_AWAY_MS = 60_000;
const FOOTER_AWAY_MS = 90_000;
// Tiempo para devolver un saludo con un clic.
const WAVE_BACK_MS = 9000;

export function useBuddyChat(core) {
  const [api] = useState(() => createChat(core));

  useEffect(() => {
    api.sessionStartRef.current = Date.now();
    window.addEventListener("daivr-achievement", api.celebrate);
    window.addEventListener("daivr-theme", api.reactToTheme);
    window.addEventListener("daivr-now-playing", api.reactToNowPlaying);
    window.addEventListener("daivr-comment-typing", api.reactToCommentTyping);
    window.addEventListener("daivr-cart-swap", api.reactToCartSwap);
    window.addEventListener("daivr-buddy-visitor", api.onVisitorSignal);
    window.addEventListener("daivr-buddy-action", api.onBuddyAction);
    window.addEventListener("daivr-update-available", api.onUpdateAvailable);
    window.addEventListener("offline", api.onOffline);
    window.addEventListener("online", api.onOnline);
    document.addEventListener("visibilitychange", api.onTabVisibility);
    window.addEventListener("daivr-visits-wave", api.onWaveReceived);
    window.addEventListener("daivr-footer-sound-state", api.onSoundToggle);
    return () => {
      window.removeEventListener("daivr-footer-sound-state", api.onSoundToggle);
      window.removeEventListener("daivr-visits-wave", api.onWaveReceived);
      window.removeEventListener("daivr-achievement", api.celebrate);
      window.removeEventListener("daivr-theme", api.reactToTheme);
      window.removeEventListener("daivr-now-playing", api.reactToNowPlaying);
      window.removeEventListener("daivr-comment-typing", api.reactToCommentTyping);
      window.removeEventListener("daivr-cart-swap", api.reactToCartSwap);
      window.removeEventListener("daivr-buddy-visitor", api.onVisitorSignal);
      window.removeEventListener("daivr-buddy-action", api.onBuddyAction);
      window.removeEventListener("daivr-update-available", api.onUpdateAvailable);
      window.removeEventListener("offline", api.onOffline);
      window.removeEventListener("online", api.onOnline);
      document.removeEventListener("visibilitychange", api.onTabVisibility);
    };
  }, [api]);

  return { api };
}

function createChat(core) {
  const { moodRef, xRef, rootRef, activeEventRef, visibleRef, bootedRef, visitorsRef, visitorFloorRef, reduceMotion } = core;
  const {
    updateMood, updateFacing, facingForDirection, freezeAtCurrentPosition, schedule, say, pickLine, buddyLine, settleDown,
    spawnParticles, playFx, contextIdlePool, startWalk, canChat, chat
  } = core;
  const lastVisitorReplyRef = { current: "" };
  const visitorChatAtRef = { current: 0 };
  // Version nueva publicada: se dice en el siguiente momento tranquilo.
  const pendingUpdateRef = { current: null };
  // Cuando empezo la sesion y que hitos de tiempo ya comento.
  const sessionStartRef = { current: Date.now() };
  const milestoneRef = { current: 0 };
  const lastSongRef = { current: "" };
  // Saludo recibido que aun se puede devolver ({ from, name, until }).
  const waveRef = { current: null };
  let footerHiddenAt = 0;
  let tabHiddenAt = 0;

  // --- Visitas -------------------------------------------------------------

  // Buddies de visita (BuddyVisitors): saludar cuando entran, despedirse
  // cuando se van, y callar la charla de relleno mientras ellos hablan.
  function onVisitorSignal(event) {
    const detail = event.detail || {};
    const known = visitorsRef.current.get(detail.id);
    if (known && Number.isFinite(detail.x)) known.x = detail.x;
    if (detail.phase === "talking") {
      visitorFloorRef.current = Math.max(visitorFloorRef.current, Number(detail.until) || 0);
      answerVisitor(detail);
      return;
    }
    if (detail.phase === "arrive" && detail.id) {
      visitorsRef.current.set(detail.id, { id: detail.id, name: detail.name || "", look: detail.look || null, x: detail.x });
    } else if (["leave", "gone"].includes(detail.phase)) {
      visitorsRef.current.delete(detail.id);
    }
    if (detail.phase === "gone") return;
    if (!bootedRef.current || moodRef.current === "off") return;
    const pool = HOST_REPLY_LINES[detail.name ? detail.phase : `${detail.phase}Guest`] || HOST_REPLY_LINES[detail.phase];
    if (!pool) return;
    const line = pickVisitLine(pool, { name: detail.name }, Math.random, lastVisitorReplyRef.current);
    if (!line) return;
    lastVisitorReplyRef.current = line;
    const asleep = moodRef.current === "sleep";
    if (!asleep && !activeEventRef.current && ["idle", "talk"].includes(moodRef.current) && Number.isFinite(detail.x)) {
      updateFacing(facingForDirection(detail.x > xRef.current ? 1 : -1));
      updateMood("talk");
      settleDown(2600);
    }
    say(asleep ? `zz... ${line}` : line, 2400, { key: "visitor", topic: "visitor" });
  }

  // Una visita le dijo algo (o le contesto): a veces responde, cuando ella
  // termina y si para entonces no habla nadie mas.
  function answerVisitor(detail) {
    const { topic, to, id, name, until } = detail;
    if (!topic || (to && to !== "host")) return;
    const now = Date.now();
    if (now < visitorChatAtRef.current) return;
    const line = hostAnswerTo(topic, { name }, Math.random, lastVisitorReplyRef.current);
    if (!line) return;
    visitorChatAtRef.current = now + VISITOR_CHAT_COOLDOWN_MS;
    schedule(() => talkToVisitor(line, { topic: replyTopic(topic), to: id }), Math.max(0, (Number(until) || now) - now) + 250);
  }

  function talkToVisitor(line, { topic, to }) {
    if (!canChat()) return;
    lastVisitorReplyRef.current = line;
    // Parado, se gira hacia quien le habla; andando, contesta sin pararse.
    if (["idle", "talk"].includes(moodRef.current)) {
      const x = visitorsRef.current.get(to)?.x;
      if (Number.isFinite(x)) updateFacing(facingForDirection(x > xRef.current ? 1 : -1));
      updateMood("talk");
      settleDown(2600);
    }
    say(line, 2400, { priority: "ambient", key: "visitor-chat", topic, to });
  }

  // Una visita hizo algo: lo comenta, o se va con ella si sale a pasear.
  function onBuddyAction(event) {
    const detail = event.detail || {};
    if (detail.actor !== "visitor") return;
    const known = visitorsRef.current.get(detail.id);
    if (!known) return;
    known.x = Number.isFinite(detail.targetX) ? detail.targetX : detail.x;
    if (!canChat()) return;
    const now = Date.now();
    if (now < visitorChatAtRef.current) return;

    if (detail.action === "roam" && moodRef.current === "idle" && !reduceMotion && Math.random() < TAG_ALONG_CHANCE) {
      visitorChatAtRef.current = now + VISITOR_CHAT_COOLDOWN_MS;
      const side = xRef.current < detail.targetX ? -1 : 1;
      schedule(() => {
        if (moodRef.current !== "idle" || activeEventRef.current) return;
        if (startWalk(detail.targetX + side * TAG_ALONG_GAP, detail.id)) {
          say(pickVisitLine(ACTION_LINES.byHost.tagAlong, {}, Math.random, lastVisitorReplyRef.current), 2200, { priority: "ambient", key: "visitor-chat", topic: "end", to: detail.id });
        }
      }, 900);
      return;
    }

    const line = actionComment("byHost", detail.action, { name: detail.name }, Math.random, lastVisitorReplyRef.current);
    if (!line) return;
    visitorChatAtRef.current = now + VISITOR_CHAT_COOLDOWN_MS;
    schedule(() => talkToVisitor(line, { topic: actionTopic(detail.action), to: detail.id }), Math.max(700, visitorFloorRef.current - now + 250));
  }

  // --- Saludos de otros jugadores ---------------------------------------------

  function onWaveReceived(event) {
    const { from, name } = event.detail || {};
    if (!from || !bootedRef.current || moodRef.current === "off") return;
    waveRef.current = { from, name, until: Date.now() + WAVE_BACK_MS };
    const line = pickLine(name
      ? [`${name} waved at you from their footer!`, `a wave from ${name}! click me to wave back.`, `${name} says hi from another tab!`]
      : ["someone waved at you from another footer!", "a guest waved at you! click me to wave back.", "incoming wave from another tab!"]);
    const asleep = moodRef.current === "sleep";
    if (!asleep && !activeEventRef.current && ["idle", "talk", "walk"].includes(moodRef.current)) {
      freezeAtCurrentPosition();
      updateMood("pet");
      spawnParticles("heart", 3);
      settleDown(2200);
    }
    say(rememberTopic(asleep ? `zz... ${line}` : line, "wave"), 3400, { key: "wave", topic: "wave" });
  }

  // Clic en Buddy con un saludo reciente: se devuelve. Devuelve si lo hizo.
  function waveBack() {
    const pending = waveRef.current;
    if (!pending || Date.now() > pending.until) return false;
    waveRef.current = null;
    sendBuddyWave(pending.from).then(({ ok }) => {
      say(ok ? `waved back at ${pending.name || "them"}!` : "hm. the wave didn't make it back.", 2200, { key: "wave", topic: ok ? "end" : "idle" });
    });
    return true;
  }

  // --- Lo que dice por su cuenta (lo llama el cerebro) ----------------------

  // Hay version nueva: lo cuenta ahora que no esta pescando ni durmiendo.
  function announceUpdate() {
    const update = pendingUpdateRef.current;
    if (!update) return false;
    pendingUpdateRef.current = null;
    updateMood("talk");
    say(rememberTopic(pickLine(updateLines(update)), "update"), 3400, { key: "update", topic: "update" });
    settleDown(3500);
    return true;
  }

  // Cuanto llevas aqui: 5, 15, 30 y 60 minutos, una vez cada uno.
  function announceMilestone() {
    const milestone = sessionMilestone(Date.now() - sessionStartRef.current, milestoneRef.current);
    if (!milestone) return false;
    milestoneRef.current = milestone.minutes;
    updateMood("talk");
    say(milestone.line, 3000, { priority: "ambient", key: "ambient", topic: "session" });
    settleDown(3100);
    return true;
  }

  // Charla de relleno; con visitas, a veces les saca tema a ellas.
  function idleTalk() {
    updateMood("talk");
    const question = visitorsRef.current.size && Math.random() < VISITOR_QUESTION_CHANCE
      ? hostQuestion([...visitorsRef.current.values()], Math.random, lastVisitorReplyRef.current)
      : null;
    if (question) {
      const guest = visitorsRef.current.get(question.to);
      if (Number.isFinite(guest?.x)) updateFacing(facingForDirection(guest.x > xRef.current ? 1 : -1));
      lastVisitorReplyRef.current = question.line;
      say(question.line, 2600, { priority: "ambient", key: "ambient", topic: question.topic, to: question.to });
    } else {
      say(pickLine(contextIdlePool()), 2600, { priority: "ambient", key: "ambient" });
    }
    settleDown(2700);
  }

  // --- Lo que pasa alrededor -------------------------------------------------

  function celebrate() {
    if (!visibleRef.current) return;
    if (activeEventRef.current) return;
    if (["pet", "off", "held", "chute", "outage", "hunt"].includes(moodRef.current)) return;
    freezeAtCurrentPosition();
    updateMood("party");
    spawnParticles("confetti", 16);
    say(buddyLine("party"), 2600);
    settleDown(3000);
  }

  function reactToTheme(event) {
    if (!visibleRef.current) return;
    if (activeEventRef.current) return;
    if (["off", "sleep", "sleepy", "held", "chute", "hunt"].includes(moodRef.current)) return;
    playFx("glitchy", 900);
    say(pickLine(event.detail?.theme === "glitch" ? LINES.glitchTheme : LINES.crtTheme), 2400);
  }

  // Cambio de cartucho (navegacion entre secciones): comentario ocasional.
  function reactToCartSwap() {
    if (!visibleRef.current) return;
    if (!["idle", "talk", "walk"].includes(moodRef.current)) return;
    if (Math.random() > 0.35) return;
    say(pickLine(LINES.cartSwap), 2200, { priority: "ambient", key: "navigation" });
  }

  function reactToNowPlaying(event) {
    if (!visibleRef.current) return;
    if (activeEventRef.current) return;
    // La pesca no se interrumpe por musica: puede vibrar sentado.
    if (["off", "held", "chute", "sleepy", "fishing", "outage", "hunt"].includes(moodRef.current)) return;
    const detail = event.detail || {};
    if (!detail.active || !detail.song || detail.song === lastSongRef.current) return;
    lastSongRef.current = detail.song;
    freezeAtCurrentPosition();
    updateMood("dance");
    say(buddyLine("music"), 2600);
    settleDown(3200);
  }

  function reactToCommentTyping(event) {
    const buddyRect = rootRef.current?.getBoundingClientRect();
    const buddyIsVisible = buddyRect && buddyRect.bottom > 0 && buddyRect.top < window.innerHeight && buddyRect.right > 0 && buddyRect.left < window.innerWidth;
    if (!buddyIsVisible || moodRef.current === "off") return;

    const canPause = !activeEventRef.current && !["held", "chute", "fishing", "outage", "hunt"].includes(moodRef.current);
    if (canPause) {
      freezeAtCurrentPosition();
      updateMood("talk");
    }
    const username = String(event.detail?.username || "").trim();
    const line = username && username.toLowerCase() !== "someone" && Math.random() < 0.45
      ? `${username} is composing a transmission... stand by.`
      : pickLine(LINES.commentTyping);
    say(line, 3600, { key: "comment-typing", topic: "commentTyping" });
    if (canPause) settleDown(3700);
  }

  function onTabVisibility() {
    if (document.visibilityState === "hidden") {
      tabHiddenAt = Date.now();
      return;
    }
    const away = tabHiddenAt ? Date.now() - tabHiddenAt : 0;
    tabHiddenAt = 0;
    if (away >= TAB_AWAY_MS && visibleRef.current) chat(EVENT_LINES.tabReturn, "tabReturn");
  }

  // Vuelve a bajar al footer despues de un rato: Buddy se da por enterado.
  function onFooterVisibility(visible) {
    if (!visible) footerHiddenAt = Date.now();
    else if (footerHiddenAt && Date.now() - footerHiddenAt >= FOOTER_AWAY_MS && Math.random() < 0.6) chat(EVENT_LINES.footer, "footer", 2600, "ambient");
    if (visible) footerHiddenAt = 0;
  }

  function onOffline() {
    chat(EVENT_LINES.offline, "offline", 3000);
  }

  function onOnline() {
    chat(EVENT_LINES.online, "online");
  }

  // Sonido ambiente del footer encendido o apagado (FooterSoundscape).
  function onSoundToggle(event) {
    if (event.detail?.enabled) chat(["ooh, ambience on. hear the crickets?", "sound on. the footer has a voice now.", "shh. listen to the fire."], "sound", 2600);
    else chat(["quiet mode. back to beeps.", "sound off. i'll hum to myself."], "sound", 2200);
  }

  // UpdateNotice encontro una version nueva: Buddy la anuncia cuando pueda.
  function onUpdateAvailable(event) {
    if (event.detail?.build) pendingUpdateRef.current = event.detail;
  }

  return {
    sessionStartRef,
    onVisitorSignal,
    onBuddyAction,
    announceUpdate,
    announceMilestone,
    idleTalk,
    celebrate,
    reactToTheme,
    reactToCartSwap,
    reactToNowPlaying,
    reactToCommentTyping,
    onTabVisibility,
    onFooterVisibility,
    onOffline,
    onOnline,
    onUpdateAvailable,
    onWaveReceived,
    waveBack,
    onSoundToggle
  };
}
