import { useEffect, useRef, useState } from "react";
import { AQUARIUM_SLOTS, DEFAULT_ROOM, normalizeRoom } from "../../shared/buddy-room.mjs";

const keyFor = (user) => `daivr.buddyRoom.v1.${user || "guest"}`;
const OWNER_KEY = "daivr.buddyRoom.owner";
function readRoom(user) {
  try { return JSON.parse(localStorage.getItem(keyFor(user)) || "null"); } catch { return null; }
}
function cacheRoom(user, room, pending) {
  try { localStorage.setItem(keyFor(user), JSON.stringify({ room, pending })); return true; } catch { return false; }
}
function readOwner() {
  try { return localStorage.getItem(OWNER_KEY) || null; } catch { return null; }
}
function rememberOwner(owner) {
  try { if (owner) localStorage.setItem(OWNER_KEY, owner); else localStorage.removeItem(OWNER_KEY); } catch { /* memory only */ }
}

// What the server said about this visitor's room, kept for the whole visit.
// The page already asks /api/buddy when it loads (useBuddyFriendship primes
// this), so opening the room shows the visitor's own setup straight away
// instead of the default room and then theirs.
let known = null;
export function primeBuddyRoom(payload) {
  if (!payload) return;
  known = { owner: payload.user || null, hasRoom: payload.hasRoom === true, room: payload.room };
  rememberOwner(known.owner);
}

// A save that never reached Discord wins over the server copy, as before.
function resolveRoom({ owner, hasRoom, room }) {
  const local = readRoom(owner);
  return {
    owner,
    room: normalizeRoom(local?.pending ? local.room : hasRoom ? room : local?.room),
    retry: Boolean(owner && local?.pending),
    message: owner ? local?.pending ? "Device save restored. Save again to sync to Discord." : "Save your room to your Discord account." : "Your room saves on this device."
  };
}

// The room to draw on the first frame: the visit's answer if there is one
// (final), otherwise this device's copy for the last signed-in owner while the
// request runs, otherwise nothing (the room shows an opening state).
function startingRoom() {
  if (known) return { ...resolveRoom(known), final: true };
  const owner = readOwner();
  const local = readRoom(owner);
  return local?.room ? { owner, room: normalizeRoom(local.room), final: false } : null;
}

export function useBuddyRoom() {
  const [start] = useState(startingRoom);
  const [room, setRoom] = useState(start?.room || DEFAULT_ROOM);
  const [saved, setSaved] = useState(start?.room || DEFAULT_ROOM);
  const [ready, setReady] = useState(Boolean(start));
  const [user, setUser] = useState(start?.owner ?? null);
  const [loading, setLoading] = useState(!start?.final);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(start?.final ? start.message : "Opening your room…");
  const [retry, setRetry] = useState(Boolean(start?.final && start.retry));
  const mounted = useRef(false);
  const savingRef = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    async function load() {
      let result;
      try {
        const response = await fetch("/api/buddy", { credentials: "include", signal: controller.signal });
        if (!response.ok) throw new Error();
        primeBuddyRoom(await response.json());
        result = resolveRoom(known);
      } catch {
        if (controller.signal.aborted) return;
        result = { owner: null, room: normalizeRoom(readRoom(null)?.room), retry: false, message: "Connection unavailable. Guest room saves on this device." };
      }
      if (controller.signal.aborted) return;
      setUser(result.owner);
      setRoom(result.room);
      setSaved(result.room);
      setRetry(result.retry);
      setStatus(result.message);
      setReady(true);
      setLoading(false);
    }
    if (!start?.final) load();
    return () => { mounted.current = false; controller.abort(); };
  }, []);

  function update(field, value) {
    setRoom((current) => {
      const next = { ...current, [field]: value };
      // Move an already displayed species to the selected slot.
      if (value && AQUARIUM_SLOTS.includes(field)) {
        for (const other of AQUARIUM_SLOTS) if (other !== field && next[other] === value) next[other] = "";
      }
      return normalizeRoom(next);
    });
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
        known = { owner: user, hasRoom: true, room: snapshot };
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

  return { room, ready, loading, saving, status, retry, update, save, dirty: JSON.stringify(room) !== JSON.stringify(saved), undo() { setRoom(saved); setStatus("Returned to your saved room."); } };
}
