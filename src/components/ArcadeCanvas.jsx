import { useEffect, useRef } from "react";

const glyphs = ["01", "{}", "fn", "=>", "dx", "AI", "VR", "++", "$", "</>"];
const colors = ["#3fff97", "#45d8ff", "#ff3d9d", "#ffd166"];
const XP_STORAGE_KEY = "daivr.arcadeCanvasXp.v1";
const XP_ENDPOINT = "/api/arcade-xp";
const NODE_COUNT = 6;
const BOOT_PHASE_COUNT = 6;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function rgba(hex, alpha) {
  const value = hex.replace("#", "");
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function curvePoint(source, t) {
  const inv = 1 - t;
  return {
    x: inv * inv * source.sx + 2 * inv * t * source.cx + t * t * source.tx,
    y: inv * inv * source.sy + 2 * inv * t * source.cy + t * t * source.ty
  };
}

function strokeRoundRect(ctx, x, y, width, height, radius) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.stroke();
    return;
  }

  ctx.strokeRect(x, y, width, height);
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
}

function xpForLevel(level) {
  return Math.round(95 + level * 42 + level ** 1.45 * 18);
}

function formatCoreNumber(value) {
  if (value >= 1_000_000) {
    const amount = value / 1_000_000;
    return `${amount >= 100 ? amount.toFixed(0) : amount.toFixed(1)}m`;
  }

  if (value >= 1_000) {
    const amount = value / 1_000;
    return `${amount >= 100 ? amount.toFixed(0) : amount.toFixed(1)}k`;
  }

  return String(Math.round(value));
}

function normalizeXpState(value = {}) {
  return {
    level: Math.max(1, Math.floor(Number(value.level) || 1)),
    xp: Math.max(0, Math.floor(Number(value.xp) || 0)),
    total: Math.max(0, Math.floor(Number(value.total) || 0))
  };
}

function loadLocalXpState() {
  try {
    const saved = window.localStorage.getItem(XP_STORAGE_KEY);
    if (!saved) return { level: 1, xp: 0, total: 0 };
    return normalizeXpState(JSON.parse(saved));
  } catch {
    return { level: 1, xp: 0, total: 0 };
  }
}

function saveLocalXpState(state) {
  try {
    window.localStorage.setItem(XP_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Local storage can be unavailable in private or restricted browsing modes.
  }
}

async function fetchServerXpState(signal) {
  const response = await fetch(XP_ENDPOINT, {
    cache: "no-store",
    credentials: "include",
    signal
  });
  if (!response.ok) throw new Error(`Arcade XP returned ${response.status}`);
  return normalizeXpState(await response.json());
}

async function saveServerXpState(state, signal) {
  const response = await fetch(XP_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    signal,
    body: JSON.stringify(normalizeXpState(state))
  });
  if (!response.ok) throw new Error(`Arcade XP save returned ${response.status}`);
  return normalizeXpState(await response.json());
}

export function ArcadeCanvas({ hasRun = false, isLaunching = false, launchPhase = 0 }) {
  const canvasRef = useRef(null);
  const runtimeRef = useRef({ hasRun, isLaunching, launchPhase });

  useEffect(() => {
    runtimeRef.current = { hasRun, isLaunching, launchPhase };
  }, [hasRun, isLaunching, launchPhase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let frame = 0;
    let animationId = 0;
    let sources = [];
    let packets = [];
    let bursts = [];
    let ambientBits = [];
    let xpState = loadLocalXpState();
    let pointer = { active: false, ttl: 0, x: 0, y: 0 };
    let isVisible = true;
    let isScrolling = false;
    let lastFrameAt = 0;
    let scrollTimer = 0;
    let saveTimer = 0;
    let pendingSaveController = null;
    const loadController = new AbortController();

    function applyXpState(state) {
      xpState = normalizeXpState(state);
      saveLocalXpState(xpState);
      sources = makeSources();
      layoutSources();
      scheduleDraw();
    }

    function queueSaveXpState(state) {
      saveLocalXpState(state);
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(async () => {
        pendingSaveController?.abort();
        pendingSaveController = new AbortController();
        try {
          const serverState = await saveServerXpState(state, pendingSaveController.signal);
          if (serverState.total > xpState.total) applyXpState(serverState);
        } catch {
          // Keep local progress when the server is temporarily unavailable.
        }
      }, 450);
    }

    function getRuntime() {
      return runtimeRef.current;
    }

    function getActiveNodeCount() {
      const runtime = getRuntime();
      return runtime.isLaunching ? Math.min(NODE_COUNT, runtime.launchPhase + 1) : runtime.hasRun ? NODE_COUNT : 0;
    }

    function getIsLaunching() {
      return getRuntime().isLaunching;
    }

    function getHasRun() {
      return getRuntime().hasRun;
    }

    function getIsPowered() {
      const runtime = getRuntime();
      return runtime.hasRun || runtime.isLaunching;
    }

    function getStatusLabel() {
      const runtime = getRuntime();
      return runtime.isLaunching ? "BOOTING" : runtime.hasRun ? "ONLINE" : "OFFLINE";
    }

    function getProgress() {
      const runtime = getRuntime();
      return runtime.isLaunching ? Math.min(1, (runtime.launchPhase + 1) / BOOT_PHASE_COUNT) : runtime.hasRun ? 1 : 0;
    }

    function getPacketLimit() {
      if (!getIsPowered()) return 0;
      return getIsLaunching() ? 18 : 11;
    }

    function addXp(amount) {
      xpState.xp += amount;
      xpState.total += amount;

      while (xpState.xp >= xpForLevel(xpState.level)) {
        xpState.xp -= xpForLevel(xpState.level);
        xpState.level += 1;
      }

      queueSaveXpState(xpState);
    }

    function core() {
      return {
        x: width * 0.5,
        y: height * 0.53
      };
    }

    function orbitRadius() {
      return Math.min(width, height) * 0.22 + 82;
    }

    function nodeOrbitRadius() {
      return orbitRadius();
    }

    function corePanel() {
      const { x: cx, y: cy } = core();
      const panelWidth = Math.min(190, width * 0.46);
      const panelHeight = 92;
      return {
        cx,
        cy,
        panelWidth,
        panelHeight,
        left: cx - panelWidth / 2,
        top: cy - panelHeight / 2
      };
    }

    function cardEdgePoint(angle) {
      const { cx, cy, panelWidth, panelHeight } = corePanel();
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const scaleX = Math.abs(cos) > 0.001 ? panelWidth / 2 / Math.abs(cos) : Infinity;
      const scaleY = Math.abs(sin) > 0.001 ? panelHeight / 2 / Math.abs(sin) : Infinity;
      const scale = Math.min(scaleX, scaleY);

      return {
        x: cx + cos * scale,
        y: cy + sin * scale
      };
    }

    function makeSources() {
      return [
        { angle: -Math.PI / 2, glyph: "{}", color: "#3fff97", lane: 0 },
        { angle: -Math.PI / 6, glyph: "++", color: "#45d8ff", lane: 1 },
        { angle: Math.PI / 6, glyph: "AI", color: "#ff3d9d", lane: 2 },
        { angle: Math.PI / 2, glyph: "$", color: "#3fff97", lane: 0 },
        { angle: (Math.PI * 5) / 6, glyph: "dx", color: "#ffd166", lane: 1 },
        { angle: (-Math.PI * 5) / 6, glyph: "fn", color: "#45d8ff", lane: 2 }
      ].map((source, index) => {
        const xpValue = Math.round(randomBetween(7, 17) + source.lane * 4 + xpState.level * 0.8);
        return {
          ...source,
          index,
          x: 0,
          y: 0,
          control: { x: 0, y: 0 },
          target: { x: 0, y: 0 },
          xpValue,
          captured: 0,
          nextAt: frame + randomBetween(18, getIsLaunching() ? 72 : 125)
        };
      });
    }

    function layoutSources() {
      const { x: cx, y: cy } = core();
      const ringPulse = reduced || !getIsPowered() ? 0 : Math.sin(frame * 0.08) * 3;
      const sourceRadius = nodeOrbitRadius() + ringPulse;

      sources.forEach((source) => {
        source.x = cx + Math.cos(source.angle) * sourceRadius;
        source.y = cy + Math.sin(source.angle) * sourceRadius;
        source.control = {
          x: cx + Math.cos(source.angle) * (sourceRadius * 0.68),
          y: cy + Math.sin(source.angle) * (sourceRadius * 0.68)
        };
        source.target = cardEdgePoint(source.angle);
      });
    }

    function makeAmbientBits() {
      return Array.from({ length: 44 }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        length: randomBetween(5, 20),
        speed: randomBetween(0.18, 0.5),
        color: colors[index % colors.length],
        alpha: randomBetween(0.08, 0.28),
        horizontal: Math.random() > 0.45
      }));
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(rect.width, 320);
      height = Math.max(rect.height, 360);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sources = makeSources();
      layoutSources();
      ambientBits = makeAmbientBits();
      packets = [];
      bursts = [];
    }

    function drawBackground() {
      ctx.fillStyle = "#020604";
      ctx.fillRect(0, 0, width, height);

      const { x: cx, y: cy } = core();
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 0.68);
      glow.addColorStop(0, getIsPowered() ? "rgba(63, 255, 151, 0.22)" : "rgba(63, 255, 151, 0.055)");
      glow.addColorStop(0.35, getIsPowered() ? "rgba(69, 216, 255, 0.075)" : "rgba(69, 216, 255, 0.025)");
      glow.addColorStop(0.72, getIsPowered() ? "rgba(255, 61, 157, 0.045)" : "rgba(255, 61, 157, 0.018)");
      glow.addColorStop(1, "rgba(2, 6, 4, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += 42) {
        ctx.strokeStyle = x % 126 === 0 ? "rgba(69, 216, 255, 0.2)" : "rgba(63, 255, 151, 0.08)";
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y <= height; y += 42) {
        ctx.strokeStyle = y % 126 === 0 ? "rgba(255, 61, 157, 0.16)" : "rgba(63, 255, 151, 0.075)";
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ambientBits.forEach((bit) => {
        ctx.strokeStyle = rgba(bit.color, bit.alpha);
        ctx.beginPath();
        ctx.moveTo(bit.x, bit.y);
        ctx.lineTo(bit.x + (bit.horizontal ? bit.length : 0), bit.y + (bit.horizontal ? 0 : bit.length));
        ctx.stroke();

        if (!reduced) {
          bit.y += bit.speed;
          bit.x += bit.horizontal ? bit.speed * 0.18 : 0;
        }

        if (bit.y > height + 20 || bit.x > width + 20) {
          bit.x = Math.random() * width;
          bit.y = -20;
        }
      });
    }

    function drawSweep() {
      if (!getIsPowered()) return;

      const { x: cx, y: cy } = core();
      const radius = orbitRadius() + 16;
      const angle = frame * 0.028;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      const beam = ctx.createLinearGradient(0, 0, radius, 0);
      beam.addColorStop(0, "rgba(63, 255, 151, 0.18)");
      beam.addColorStop(1, "rgba(63, 255, 151, 0)");
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, -0.18, 0.18);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function drawRings() {
      const { x: cx, y: cy } = core();
      const pulse = reduced || !getIsPowered() ? 0 : Math.sin(frame * 0.08) * 3;
      const base = Math.min(width, height) * 0.22;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.lineWidth = 1;
      [base, base + 42, base + 82].forEach((radius, index) => {
        ctx.strokeStyle = getIsPowered()
          ? index === 1 ? "rgba(69, 216, 255, 0.28)" : "rgba(63, 255, 151, 0.18)"
          : "rgba(180, 255, 207, 0.08)";
        ctx.beginPath();
        ctx.arc(0, 0, radius + pulse, 0, Math.PI * 2);
        ctx.stroke();
      });

      ctx.rotate(getIsPowered() ? frame * 0.011 : 0);
      ctx.lineWidth = 2;
      ctx.strokeStyle = getIsPowered() ? "rgba(63, 255, 151, 0.62)" : "rgba(180, 255, 207, 0.12)";
      ctx.beginPath();
      ctx.arc(0, 0, base + 66, -0.18, 0.92);
      ctx.stroke();

      ctx.rotate(getIsPowered() ? -frame * 0.018 : 0);
      ctx.strokeStyle = getIsPowered() ? "rgba(255, 61, 157, 0.5)" : "rgba(255, 61, 157, 0.1)";
      ctx.beginPath();
      ctx.arc(0, 0, base + 20, Math.PI * 0.72, Math.PI * 1.08);
      ctx.stroke();
      ctx.restore();
    }

    function drawOrbitTicks() {
      const { x: cx, y: cy } = core();
      const radius = orbitRadius();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(getIsPowered() ? frame * 0.01 : 0);
      for (let i = 0; i < 32; i += 1) {
        const angle = (Math.PI * 2 * i) / 32;
        const hot = i % 7 === 0;
        const inner = radius + (hot ? 2 : 10);
        const outer = radius + (hot ? 18 : 14);
        ctx.strokeStyle = getIsPowered()
          ? hot ? "rgba(255, 209, 102, 0.72)" : "rgba(63, 255, 151, 0.22)"
          : hot ? "rgba(255, 209, 102, 0.16)" : "rgba(180, 255, 207, 0.08)";
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
        ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawSources() {
      ctx.textAlign = "center";
      const activeNodeCount = getActiveNodeCount();

      sources.forEach((source) => {
        const active = source.index < activeNodeCount;
        const hot = active && source.captured > 0;
        const alpha = active ? hot ? 0.82 : 0.36 : 0.08;

        if (active) {
          ctx.strokeStyle = rgba(source.color, alpha);
          ctx.lineWidth = hot ? 2 : 1;
          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.quadraticCurveTo(source.control.x, source.control.y, source.target.x, source.target.y);
          ctx.stroke();
        }

        ctx.fillStyle = active ? hot ? source.color : rgba(source.color, 0.82) : "rgba(180, 255, 207, 0.22)";
        ctx.shadowColor = source.color;
        ctx.shadowBlur = active && !isScrolling ? hot ? 18 : 8 : 0;

        ctx.strokeStyle = active ? rgba(source.color, hot ? 0.95 : 0.58) : "rgba(180, 255, 207, 0.16)";
        ctx.lineWidth = active ? hot ? 2 : 1.35 : 1;
        ctx.fillStyle = active ? rgba(source.color, 0.1) : "rgba(2, 6, 4, 0.58)";
        ctx.fillRect(source.x - 13, source.y - 17, 26, 24);
        strokeRoundRect(ctx, source.x - 13, source.y - 17, 26, 24, 3);

        ctx.font = "900 13px JetBrains Mono, monospace";
        ctx.fillStyle = active ? source.color : "rgba(180, 255, 207, 0.28)";
        ctx.fillText(source.glyph, source.x, source.y);
        ctx.font = "900 9px JetBrains Mono, monospace";
        ctx.fillStyle = active ? rgba(source.color, 0.95) : "rgba(180, 255, 207, 0.2)";
        ctx.fillText(active ? `+${source.xpValue}` : "off", source.x, source.y + 20);
        ctx.shadowBlur = 0;
        if (!reduced && source.captured > 0) source.captured -= 1;
      });
    }

    function spawnPacket(source = null) {
      const activeNodeCount = getActiveNodeCount();
      if (!getIsPowered()) return;
      if (packets.length >= getPacketLimit()) return;
      const liveSources = sources.filter((item) => item.index < activeNodeCount);
      if (!liveSources.length) return;
      const picked = source || liveSources[Math.floor(Math.random() * liveSources.length)];
      if (picked.index >= activeNodeCount) return;
      const target = picked.target;
      const control = pointer.active && pointer.ttl > 0
        ? { x: pointer.x, y: pointer.y }
        : picked.control;

      picked.captured = 26;
      packets.push({
        glyph: picked.glyph || glyphs[Math.floor(Math.random() * glyphs.length)],
        color: picked.color || colors[Math.floor(Math.random() * colors.length)],
        sx: picked.x,
        sy: picked.y,
        cx: control.x,
        cy: control.y,
        tx: target.x,
        ty: target.y,
        xpValue: picked.xpValue || 10,
        progress: 0,
        speed: randomBetween(0.0075, getIsLaunching() ? 0.018 : 0.0135),
        size: randomBetween(0.88, 1.15),
        trail: []
      });
    }

    function drawPackets() {
      const activeNodeCount = getActiveNodeCount();
      const packetLimit = getPacketLimit();

      if (!getIsPowered()) {
        packets = [];
        return;
      }

      if (!reduced) {
        if (pointer.active && pointer.ttl > 0) {
          const nearest = sources
            .filter((source) => source.index < activeNodeCount)
            .map((source) => ({ source, distance: Math.hypot(source.x - pointer.x, source.y - pointer.y) }))
            .sort((a, b) => a.distance - b.distance)[0]?.source;
          if (nearest && frame >= nearest.nextAt) {
            spawnPacket(nearest);
            nearest.nextAt = frame + randomBetween(42, getIsLaunching() ? 92 : 150);
          }
        }

        sources.filter((source) => source.index < activeNodeCount).forEach((source) => {
          if (frame >= source.nextAt && packets.length < packetLimit) {
            spawnPacket(source);
            source.nextAt = frame + randomBetween(58, getIsLaunching() ? 130 : 220);
          }
        });
      }

      ctx.textAlign = "center";
      ctx.font = "900 13px JetBrains Mono, monospace";
      ctx.globalCompositeOperation = "lighter";

      packets = packets.filter((packet) => {
        if (!reduced) packet.progress += packet.speed;
        const t = easeInOut(Math.min(packet.progress, 1));
        const point = curvePoint(packet, t);
        packet.trail.push(point);
        if (packet.trail.length > 12) packet.trail.shift();

        packet.trail.forEach((trailPoint, index) => {
          const alpha = ((index + 1) / packet.trail.length) * 0.5;
          ctx.fillStyle = rgba(packet.color, alpha);
          ctx.fillRect(trailPoint.x - 2, trailPoint.y - 2, 4, 4);
        });

        ctx.strokeStyle = rgba(packet.color, 0.42);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(packet.sx, packet.sy);
        ctx.quadraticCurveTo(packet.cx, packet.cy, point.x, point.y);
        ctx.stroke();

        ctx.fillStyle = packet.color;
        ctx.shadowColor = packet.color;
        ctx.shadowBlur = isScrolling ? 0 : 16;
        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.scale(packet.size, packet.size);
        ctx.fillText(packet.glyph, 0, -5);
        ctx.fillRect(-3, 6, 6, 6);
        ctx.restore();
        ctx.shadowBlur = 0;

        if (packet.progress >= 1) {
          addXp(packet.xpValue);
          bursts.push({ x: packet.tx, y: packet.ty, color: packet.color, glyph: `+${packet.xpValue}xp`, life: 1 });
          return false;
        }

        return true;
      });

      ctx.globalCompositeOperation = "source-over";
    }

    function drawBursts() {
      ctx.textAlign = "center";
      ctx.font = "900 11px JetBrains Mono, monospace";
      bursts = bursts.filter((burst) => {
        const radius = 8 + (1 - burst.life) * 30;
        ctx.globalAlpha = burst.life;
        ctx.strokeStyle = burst.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(burst.x, burst.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = burst.color;
        ctx.fillText(burst.glyph, burst.x, burst.y - radius - 5);
        ctx.globalAlpha = 1;
        if (!reduced) burst.life -= 0.04;
        return burst.life > 0;
      });
    }

    function drawPointerReticle() {
      if (!pointer.active || pointer.ttl <= 0) return;

      ctx.save();
      ctx.translate(pointer.x, pointer.y);
      ctx.strokeStyle = "rgba(255, 209, 102, 0.72)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-24, 0);
      ctx.lineTo(-10, 0);
      ctx.moveTo(10, 0);
      ctx.lineTo(24, 0);
      ctx.moveTo(0, -24);
      ctx.lineTo(0, -10);
      ctx.moveTo(0, 10);
      ctx.lineTo(0, 24);
      ctx.stroke();
      ctx.restore();

      if (!reduced) pointer.ttl -= 1;
      if (pointer.ttl <= 0) pointer.active = false;
    }

    function drawCore() {
      const { cx, cy, panelWidth, panelHeight, left, top } = corePanel();
      const xpNeeded = xpForLevel(xpState.level);
      const xpProgress = Math.min(1, xpState.xp / xpNeeded);
      const isPowered = getIsPowered();
      const isLaunching = getIsLaunching();
      const hasRun = getHasRun();
      const progress = getProgress();

      function drawFittedText(text, x, y, maxWidth, align, color) {
        let size = 9;
        ctx.textAlign = align;
        ctx.fillStyle = color;
        ctx.font = `900 ${size}px JetBrains Mono, monospace`;

        while (size > 6 && ctx.measureText(text).width > maxWidth) {
          size -= 1;
          ctx.font = `900 ${size}px JetBrains Mono, monospace`;
        }

        ctx.fillText(text, x, y);
      }

      ctx.fillStyle = "rgba(2, 6, 4, 0.86)";
      ctx.shadowColor = isPowered ? "rgba(63, 255, 151, 0.48)" : "rgba(180, 255, 207, 0.08)";
      ctx.shadowBlur = isPowered && !isScrolling ? 28 : 0;
      ctx.fillRect(left, top, panelWidth, panelHeight);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = isPowered ? "rgba(63, 255, 151, 0.96)" : "rgba(180, 255, 207, 0.26)";
      ctx.lineWidth = 2;
      ctx.strokeRect(left, top, panelWidth, panelHeight);
      ctx.strokeStyle = isPowered ? "rgba(69, 216, 255, 0.58)" : "rgba(69, 216, 255, 0.14)";
      ctx.strokeRect(left + 12, top + 12, panelWidth - 24, panelHeight - 24);

      const notch = 16;
      ctx.strokeStyle = isPowered ? "rgba(255, 61, 157, 0.62)" : "rgba(255, 61, 157, 0.16)";
      ctx.beginPath();
      ctx.moveTo(left, top + notch);
      ctx.lineTo(left + notch, top);
      ctx.moveTo(left + panelWidth - notch, top + panelHeight);
      ctx.lineTo(left + panelWidth, top + panelHeight - notch);
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.fillStyle = isPowered ? "#3fff97" : "rgba(180, 255, 207, 0.42)";
      ctx.shadowColor = isPowered ? "#3fff97" : "transparent";
      ctx.shadowBlur = isPowered && !isScrolling ? 12 : 0;
      ctx.font = "900 15px Orbitron, JetBrains Mono, monospace";
      ctx.fillText("DAI.EXE", cx, cy - 14);
      ctx.shadowBlur = 0;
      ctx.fillStyle = isLaunching ? "#ffd166" : hasRun ? "#3fff97" : "rgba(255, 95, 104, 0.84)";
      ctx.font = "900 12px JetBrains Mono, monospace";
      ctx.fillText(getStatusLabel(), cx, cy + 6);

      drawFittedText(`LV ${formatCoreNumber(xpState.level)}`, cx - 56, cy + 23, 42, "left", "#ffd166");
      drawFittedText(`${formatCoreNumber(xpState.xp)}/${formatCoreNumber(xpNeeded)}`, cx + 56, cy + 23, 66, "right", "rgba(180, 255, 207, 0.78)");

      ctx.strokeStyle = "rgba(63, 255, 151, 0.24)";
      ctx.strokeRect(cx - 56, cy + 28, 112, 8);
      ctx.fillStyle = isPowered ? "#ffd166" : "rgba(255, 209, 102, 0.18)";
      ctx.fillRect(cx - 54, cy + 30, 108 * (isPowered ? xpProgress : 0), 4);
      ctx.fillStyle = isPowered ? "rgba(69, 216, 255, 0.72)" : "rgba(69, 216, 255, 0.16)";
      ctx.fillRect(cx - 54, cy + 35, 108 * progress, 1);
    }

    function scheduleDraw() {
      if (!animationId && !reduced && isVisible) {
        animationId = requestAnimationFrame(draw);
      }
    }

    function draw(timestamp = 0) {
      animationId = 0;
      if (!isVisible || document.visibilityState !== "visible") return;

      const frameDelay = isScrolling ? 33 : 16;
      if (!reduced && timestamp - lastFrameAt < frameDelay) {
        scheduleDraw();
        return;
      }
      lastFrameAt = timestamp;

      ctx.clearRect(0, 0, width, height);
      drawBackground();
      drawSweep();
      drawRings();
      drawOrbitTicks();
      layoutSources();
      drawSources();
      drawPackets();
      drawCore();
      drawBursts();
      drawPointerReticle();
      ctx.fillStyle = "rgba(255, 255, 255, 0.025)";
      ctx.fillRect(0, (frame * 2) % Math.max(height, 1), width, 3);

      frame += reduced ? 0 : 1;
      scheduleDraw();
    }

    function handlePointerMove(event) {
      const rect = canvas.getBoundingClientRect();
      pointer = {
        active: true,
        ttl: 95,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }

    function handlePointerLeave() {
      pointer.ttl = Math.min(pointer.ttl, 20);
    }

    function handleScroll() {
      isScrolling = true;
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        isScrolling = false;
        scheduleDraw();
      }, 140);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden" && animationId) {
        cancelAnimationFrame(animationId);
        animationId = 0;
        return;
      }

      if (document.visibilityState === "visible") scheduleDraw();
    }

    resize();

    fetchServerXpState(loadController.signal)
      .then((serverState) => {
        if (serverState.total >= xpState.total) {
          applyXpState(serverState);
          return;
        }

        queueSaveXpState(xpState);
      })
      .catch(() => {
        // Local XP is still used while offline or during a failed deploy.
      });

    let observer = null;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        ([entry]) => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            scheduleDraw();
          } else if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = 0;
          }
        },
        { rootMargin: "180px 0px", threshold: 0.02 }
      );
      observer.observe(canvas);
    } else {
      scheduleDraw();
    }

    if (reduced) draw();
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      observer?.disconnect();
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      loadController.abort();
      pendingSaveController?.abort();
      window.clearTimeout(scrollTimer);
      window.clearTimeout(saveTimer);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="h-full min-h-[360px] w-full bg-ink-950/80" aria-hidden="true" />;
}
