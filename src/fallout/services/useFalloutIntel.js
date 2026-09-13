import { useCallback, useEffect, useRef, useState } from "react";
import { SOURCES } from "../data/sources";

const KEYS = ["codes", "minerva", "axolotl", "events"];
const emptyIntel = () => Object.fromEntries(KEYS.map((key) => [key, {
  data: null, status: "unavailable", fetchedAt: null, source: SOURCES[key]
}]));

export function useFalloutIntel() {
  const [intel, setIntel] = useState(emptyIntel);
  const [loading, setLoading] = useState(true);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const controllerRef = useRef(null);

  const refresh = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort("timeout"), 12000);
    setLoading(true);
    try {
      const response = await fetch("/api/fallout", { signal: controller.signal, headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Connection failure");
      const data = await response.json();
      if (!KEYS.every((key) => data[key] && ["current", "stale", "unavailable"].includes(data[key].status))) throw new Error("Invalid response");
      setIntel(data);
      setConnectionFailed(false);
    } catch {
      if (controller.signal.aborted && controller.signal.reason !== "timeout") return;
      setConnectionFailed(true);
      setIntel((previous) => Object.fromEntries(KEYS.map((key) => [key, {
        ...previous[key], status: previous[key].data ? "stale" : "unavailable"
      }])));
    } finally {
      window.clearTimeout(timeout);
      if (controllerRef.current === controller) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(() => { if (!document.hidden) refresh(); }, 15 * 60_000);
    return () => { window.clearInterval(timer); controllerRef.current?.abort(); };
  }, [refresh]);

  return { intel, loading, connectionFailed, refresh };
}
