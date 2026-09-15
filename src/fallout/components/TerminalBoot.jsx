import { useCallback, useEffect, useRef, useState } from "react";
import { FalloutLoader } from "./FalloutLoader";
import { VAULT_UNLOCK_MS, VAULT_OPEN_MS, VAULT_ENTER_MS, VAULT_APPROACH_MS } from "../data/vaultSequence";

const BOOT_KEY = "daivr-fallout-booted";

function waitForImage(image, signal) {
  return new Promise((resolve) => {
    const finish = (loaded) => {
      clearTimeout(timeout);
      image.removeEventListener("load", decode);
      image.removeEventListener("error", failed);
      signal.removeEventListener("abort", failed);
      resolve(loaded);
    };
    const failed = () => finish(false);
    const decode = () => image.decode().then(() => finish(true), failed);
    const timeout = setTimeout(failed, 6500);
    image.addEventListener("load", decode, { once: true });
    image.addEventListener("error", failed, { once: true });
    signal.addEventListener("abort", failed, { once: true });
    if (image.complete) {
      if (image.naturalWidth) decode();
      else failed();
    }
  });
}

export function useTerminalBoot({ loading, intel, connectionFailed, contentRef, entryOrigin }) {
  const [booting, setBooting] = useState(true);
  const [phase, setPhase] = useState("loading");
  const [artwork, setArtwork] = useState(null);
  const [display, setDisplay] = useState(null);
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [approachComplete, setApproachComplete] = useState(!entryOrigin);
  const finishApproach = useCallback(() => setApproachComplete(true), []);
  const [preferences] = useState(() => {
    try { return { returning: !!sessionStorage.getItem(BOOT_KEY), reduced: matchMedia("(prefers-reduced-motion: reduce)").matches }; }
    catch { return { returning: true, reduced: true }; }
  });
  const finish = useCallback(() => {
    try { sessionStorage.setItem(BOOT_KEY, "1"); } catch { /* Storage is optional. */ }
    setBooting(false);
  }, []);
  const specimen = intel.axolotl.data;
  const specimenImage = specimen?.name === "Shadow Axolotl" ? "/fallout/shadow-axolotl.webp" : specimen?.imageUrl;

  useEffect(() => {
    const delay = preferences.reduced ? 0 : entryOrigin ? VAULT_APPROACH_MS : preferences.returning ? 0 : 1000;
    const timer = window.setTimeout(() => setMinimumElapsed(true), delay);
    return () => window.clearTimeout(timer);
  }, [preferences, entryOrigin]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => { if (active) setDisplay("fallback"); }, 4000);
    document.fonts.ready.then(() => {
      if (active) { clearTimeout(timer); setDisplay("ready"); }
    });
    return () => { active = false; clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (loading || !booting) return;
    const controller = new AbortController();
    const images = [
      ...Array.from(contentRef.current?.querySelectorAll("img") || []),
      ...Array.from(contentRef.current?.closest(".fallout-page")?.querySelectorAll(".fo-world-backdrop img") || []),
    ];
    Promise.all(images.map((image) => waitForImage(image, controller.signal))).then((results) => {
      if (!controller.signal.aborted) setArtwork(results.every(Boolean) ? "ready" : "fallback");
    });
    return () => controller.abort();
  }, [loading, specimenImage, booting, contentRef]);

  const ready = !loading && artwork !== null && display !== null && minimumElapsed && (approachComplete || preferences.reduced);
  useEffect(() => {
    if (!ready || !booting) return;
    setPhase("complete");
    // Retract the locks, release the seal, then roll the full-size door clear.
    const hold = preferences.reduced ? 200 : VAULT_UNLOCK_MS;
    const exit = preferences.reduced ? 0 : VAULT_OPEN_MS;
    const entry = preferences.reduced ? 0 : VAULT_ENTER_MS;
    const revealTimer = window.setTimeout(() => setPhase("leaving"), hold);
    const entryTimer = window.setTimeout(() => setPhase("entering"), hold + exit);
    const finishTimer = window.setTimeout(finish, hold + exit + entry);
    return () => { window.clearTimeout(revealTimer); window.clearTimeout(entryTimer); window.clearTimeout(finishTimer); };
  }, [ready, booting, preferences, finish]);

  const unavailable = connectionFailed || Object.values(intel).every((feed) => feed.status === "unavailable");
  const reports = loading ? "loading" : unavailable ? "offline" : Object.values(intel).some((feed) => feed.status !== "current") ? "partial" : "ready";
  const stages = [
    { label: "Interface", status: "ready" },
    { label: "Reports", status: reports },
    { label: "Artwork", status: artwork || "loading" },
    { label: "Display", status: display || "loading" },
  ];
  return { booting, finish, phase, stages, finishApproach, offline: !loading && unavailable };
}

export function TerminalBoot({ onFinish, ...props }) {
  const skipRef = useRef(null);
  useEffect(() => { skipRef.current?.closest('[role="dialog"]')?.focus({ preventScroll: true }); }, []);
  return <FalloutLoader {...props} onSkip={onFinish} skipRef={skipRef} />;
}
