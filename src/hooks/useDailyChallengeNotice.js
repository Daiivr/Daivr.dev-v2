import { useEffect, useRef, useState } from "react";

export function useDailyChallengeNotice({ game, open, frameRef }) {
  const [notice, setNotice] = useState(null);
  const retryRef = useRef(() => {});
  useEffect(() => {
    setNotice(null);
    if (!open || !["tower-block", "cross-road", "space-cadet-pinball"].includes(game)) return;
    const controller = new AbortController();
    let challenge;
    let sample;
    let pending = false;
    let retryAfter = 0;
    let rollover;
    async function load() {
      try {
        const response = await fetch("/api/player", { credentials: "include", signal: controller.signal });
        if (!response.ok) throw new Error("Challenge unavailable");
        const value = await response.json();
        if (controller.signal.aborted) return;
        const wasIncomplete = challenge && !challenge.complete;
        challenge = value.user && value.challenge.game === game ? value.challenge : null;
        if (wasIncomplete && challenge?.complete && sample?.score >= challenge.goal) setNotice({ state: "complete", name: challenge.name, xp: challenge.xp.total });
        window.clearTimeout(rollover);
        rollover = window.setTimeout(() => { setNotice(null); load(); }, Math.max(1000, Date.parse(value.challenge.resetsAt) - Date.now() + 100));
        check();
      } catch (error) {
        if (error.name !== "AbortError") rollover = window.setTimeout(load, 15000);
      }
    }
    async function check() {
      if (pending || !challenge || challenge.complete || !sample || sample.score < challenge.goal || Date.now() < retryAfter) return;
      pending = true;
      setNotice({ state: "saving", name: challenge.name });
      try {
        const response = await fetch(`/api/${game}/challenge`, { method: "POST", credentials: "include", signal: controller.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ score: sample.score, durationMs: sample.durationMs }) });
        if (!response.ok) throw new Error("Reward save failed");
        const value = await response.json();
        if (controller.signal.aborted) return;
        if (value.daily?.complete) {
          challenge = value.daily;
          setNotice({ state: "complete", name: value.daily.name, xp: value.daily.xp });
          window.dispatchEvent(new Event("daivr-player-progress"));
        } else { setNotice(null); await load(); }
      } catch (error) {
        if (error.name !== "AbortError") {
          retryAfter = Date.now() + 15000;
          setNotice({ state: "error", name: challenge.name });
        }
      } finally { pending = false; }
    }
    function onProgress(event) {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow || event.data?.type !== "daivr:daily-progress" || event.data.game !== game) return;
      sample = event.data;
      check();
    }
    retryRef.current = () => { retryAfter = 0; if (challenge) check(); else load(); };
    const refresh = () => { if (challenge && !challenge.complete && !pending) load(); };
    window.addEventListener("message", onProgress);
    window.addEventListener("daivr-player-progress", refresh);
    load();
    return () => { controller.abort(); window.clearTimeout(rollover); window.removeEventListener("message", onProgress); window.removeEventListener("daivr-player-progress", refresh); retryRef.current = () => {}; };
  }, [game, open, frameRef]);
  return { notice, dismiss: () => { setNotice(null); frameRef.current?.contentWindow?.focus(); }, retry: () => retryRef.current() };
}
