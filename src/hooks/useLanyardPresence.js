import { useEffect, useState } from "react";

const LANYARD_API = "https://api.lanyard.rest/v1/users";
const LANYARD_WS = "wss://api.lanyard.rest/socket";
const DEFAULT_POLL_MS = 15000;
const RECONNECT_MIN_MS = 1000;
const RECONNECT_MAX_MS = 30000;

export const discordStatusMeta = {
  online: {
    label: "online",
    colorClass: "bg-phosphor",
    textClass: "text-phosphor"
  },
  idle: {
    label: "idle",
    colorClass: "bg-cabinet",
    textClass: "text-cabinet"
  },
  dnd: {
    label: "do not disturb",
    colorClass: "bg-danger-arcade",
    textClass: "text-danger-arcade"
  },
  offline: {
    label: "offline",
    colorClass: "bg-phosphor-soft/35",
    textClass: "text-phosphor-soft/55"
  },
  syncing: {
    label: "syncing",
    colorClass: "bg-cyan-arcade",
    textClass: "text-cyan-arcade"
  }
};

export function useLanyardPresence(userId, pollMs = DEFAULT_POLL_MS) {
  const [state, setState] = useState({
    data: null,
    error: null,
    loading: true,
    updatedAt: null
  });

  useEffect(() => {
    if (!userId) {
      setState({
        data: null,
        error: new Error("Missing Discord user ID"),
        loading: false,
        updatedAt: null
      });
      return undefined;
    }

    let active = true;
    let heartbeat = 0;
    let controller = null;
    let reconnectDelay = RECONNECT_MIN_MS;
    let reconnectTimer = 0;
    let socket = null;

    function applyPresence(data) {
      if (!active || !data) return;

      setState({
        data,
        error: null,
        loading: false,
        updatedAt: new Date()
      });
    }

    function clearHeartbeat() {
      if (!heartbeat) return;
      window.clearInterval(heartbeat);
      heartbeat = 0;
    }

    async function loadPresence() {
      controller?.abort();
      controller = new AbortController();

      setState((current) => ({
        ...current,
        error: null,
        loading: !current.data
      }));

      try {
        const response = await fetch(`${LANYARD_API}/${userId}`, {
          cache: "no-store",
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Lanyard returned ${response.status}`);
        }

        const payload = await response.json();

        if (!payload.success) {
          throw new Error("Lanyard did not return a successful payload");
        }

        applyPresence(payload.data);
      } catch (error) {
        if (active && error.name !== "AbortError") {
          setState((current) => ({
            ...current,
            error,
            loading: false
          }));
        }
      }
    }

    function scheduleReconnect() {
      if (!active || reconnectTimer) return;

      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = 0;
        connectSocket();
      }, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_MS);
    }

    function connectSocket() {
      if (!active || typeof WebSocket === "undefined") return;

      clearHeartbeat();
      socket?.close();
      socket = new WebSocket(LANYARD_WS);

      socket.addEventListener("message", (event) => {
        let payload = null;

        try {
          payload = JSON.parse(event.data);
        } catch {
          return;
        }

        if (payload.op === 1) {
          const heartbeatInterval = payload.d?.heartbeat_interval;

          socket?.send(JSON.stringify({
            op: 2,
            d: {
              subscribe_to_id: userId
            }
          }));

          clearHeartbeat();
          if (heartbeatInterval) {
            heartbeat = window.setInterval(() => {
              if (socket?.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ op: 3 }));
              }
            }, heartbeatInterval);
          }
          return;
        }

        if (payload.op === 0 && (payload.t === "INIT_STATE" || payload.t === "PRESENCE_UPDATE")) {
          applyPresence(payload.d);
        }
      });

      socket.addEventListener("open", () => {
        reconnectDelay = RECONNECT_MIN_MS;
      });

      socket.addEventListener("error", () => {
        setState((current) => ({
          ...current,
          error: current.data ? null : new Error("Lanyard socket error"),
          loading: false
        }));
      });

      socket.addEventListener("close", () => {
        clearHeartbeat();
        scheduleReconnect();
      });
    }

    loadPresence();
    connectSocket();
    const interval = window.setInterval(loadPresence, pollMs);

    return () => {
      active = false;
      clearHeartbeat();
      controller?.abort();
      socket?.close();
      window.clearTimeout(reconnectTimer);
      window.clearInterval(interval);
    };
  }, [pollMs, userId]);

  return state;
}

export function getDiscordAvatarUrl(user, size = 256) {
  if (!user?.id || !user?.avatar) return null;

  const extension = user.avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=${size}`;
}

export function getAvatarDecorationUrl(user) {
  const asset = user?.avatar_decoration_data?.asset;
  return asset ? `https://cdn.discordapp.com/avatar-decoration-presets/${asset}.png` : null;
}

export function getDiscordDisplayName(user) {
  return user?.global_name || user?.display_name || user?.username || "Dai";
}

export function getEmojiUrl(emoji) {
  if (!emoji?.id) return null;
  return `https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? "gif" : "png"}?size=32`;
}
