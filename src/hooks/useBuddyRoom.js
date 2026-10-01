import { useEffect, useRef, useState } from "react";
import { DEFAULT_ROOM, normalizeRoom } from "../../shared/buddy-room.mjs";

const keyFor = (user) => `daivr.buddyRoom.v1.${user || "guest"}`;
function readRoom(user) {
  try { return JSON.parse(localStorage.getItem(keyFor(user)) || "null"); } catch { return null; }
}
function cacheRoom(user, room, pending) {
  try { localStorage.setItem(keyFor(user), JSON.stringify({ room, pending })); return true; } catch { return false; }
}

export function useBuddyRoom() {
  const [room, setRoom] = useState(DEFAULT_ROOM);
  const [saved, setSaved] = useState(DEFAULT_ROOM);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("Opening your room…");
  const [retry, setRetry] = useState(false);
  const mounted = useRef(false);
  const savingRef = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    async function load() {
      let owner = null;
      let next;
      let message;
      try {
        const response = await fetch("/api/buddy", { credentials: "include", signal: controller.signal });
        if (!response.ok) throw new Error();
        const payload = await response.json();
        owner = payload.user;
        const local = readRoom(owner);
        next = local?.pending ? local.room : payload.hasRoom ? payload.room : local?.room;
        setRetry(Boolean(owner && local?.pending));
        message = owner ? local?.pending ? "Device save restored. Save again to sync to Discord." : "Save your room to your Discord account." : "Your room saves on this device.";
      } catch {
        if (controller.signal.aborted) return;
        next = readRoom(null)?.room;
        message = "Connection unavailable. Guest room saves on this device.";
      }
      if (controller.signal.aborted) return;
      const normalized = normalizeRoom(next);
      setUser(owner);
      setRoom(normalized);
      setSaved(normalized);
      setStatus(message);
      setLoading(false);
    }
    load();
    return () => { mounted.current = false; controller.abort(); };
  }, []);

  function update(field, value) {
    setRoom((current) => normalizeRoom({ ...current, [field]: value }));
    setStatus("Previewing changes — save when it feels like home.");
  }

  async function save() {
    if (savingRef.current || loading) return;
    savingRef.current = true;
    setSaving(true);
    const snapshot = normalizeRoom(room);
    const cached = cacheRoom(user, snapshot, Boolean(user));
    let success = cached;
    let message = cached ? "Room saved on this device." : "Device storage is unavailable. Your room could not be saved.";
    let pending = false;
    if (user) {
      try {
        const response = await fetch("/api/buddy", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save-room", owner: user, room: snapshot }) });
        if (!response.ok) throw new Error();
        const payload = await response.json();
        if (payload.user !== user) throw new Error();
        cacheRoom(user, snapshot, false);
        success = true;
        message = "Room saved to your Discord account.";
      } catch {
        pending = true;
        message = cached ? "Saved on this device. Discord sync failed — try Save room again." : "Save failed. Please try again.";
      }
    }
    if (mounted.current) {
      if (success) setSaved(snapshot);
      setStatus(message);
      setRetry(pending);
      setSaving(false);
    }
    savingRef.current = false;
  }

  return { room, loading, saving, status, retry, update, save, dirty: JSON.stringify(room) !== JSON.stringify(saved), undo() { setRoom(saved); setStatus("Returned to your saved room."); } };
}
