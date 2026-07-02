import { useEffect } from "react";

const WORD_PATTERN = /[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9'’._/-]{2,}/g;
const EXCLUDED_SELECTOR = [
  "script",
  "style",
  "noscript",
  "textarea",
  "input",
  "select",
  "option",
  "canvas",
  "svg",
  "pre",
  "code",
  "[data-no-random-glitch]",
  ".random-glitch-word"
].join(",");

function isVisibleRect(rect) {
  return (
    rect.width > 4 &&
    rect.height > 4 &&
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < window.innerHeight &&
    rect.left < window.innerWidth
  );
}

function collectWordCandidates(root) {
  const candidates = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest(EXCLUDED_SELECTOR)) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;

      const style = window.getComputedStyle(parent);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    }
  });

  let node = walker.nextNode();
  while (node && candidates.length < 260) {
    const text = node.nodeValue;
    WORD_PATTERN.lastIndex = 0;

    for (const match of text.matchAll(WORD_PATTERN)) {
      const word = match[0];
      if (word.length < 3 || word.length > 28) continue;
      candidates.push({
        end: match.index + word.length,
        node,
        start: match.index,
        word
      });
    }

    node = walker.nextNode();
  }

  return candidates;
}

function spawnGlitchOverlay(candidate) {
  const range = document.createRange();
  range.setStart(candidate.node, candidate.start);
  range.setEnd(candidate.node, candidate.end);

  const rect = range.getBoundingClientRect();
  const parent = candidate.node.parentElement;
  range.detach();

  if (!parent || !isVisibleRect(rect)) return null;

  const style = window.getComputedStyle(parent);
  const overlay = document.createElement("span");
  overlay.className = "random-glitch-word";
  if (parent.closest(".console-secret-bay")) {
    overlay.dataset.glitchScope = "console-secret-bay";
  }
  overlay.dataset.text = candidate.word;
  overlay.textContent = candidate.word;
  overlay.style.setProperty("--glitch-shift", `${Math.random() > 0.5 ? 1 : -1}`);
  overlay.style.color = style.color;
  overlay.style.fontFamily = style.fontFamily;
  overlay.style.fontSize = style.fontSize;
  overlay.style.fontStyle = style.fontStyle;
  overlay.style.fontWeight = style.fontWeight;
  overlay.style.height = `${rect.height}px`;
  overlay.style.left = `${rect.left}px`;
  overlay.style.letterSpacing = style.letterSpacing;
  overlay.style.lineHeight = style.lineHeight;
  overlay.style.textTransform = style.textTransform;
  overlay.style.top = `${rect.top}px`;
  overlay.style.width = `${rect.width}px`;

  document.body.appendChild(overlay);
  return overlay;
}

export function useRandomGlitchWords(enabled) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;

    const root = document.querySelector("[data-glitch-root]") || document.body;
    const active = new Set();
    let stopped = false;
    let timer = 0;

    function clearOverlay(overlay) {
      active.delete(overlay);
      overlay.remove();
    }

    function clearScope(event) {
      const scope = event.detail?.scope;
      if (!scope) return;

      [...active].forEach((overlay) => {
        if (overlay.dataset.glitchScope === scope) {
          clearOverlay(overlay);
        }
      });
    }

    function tick() {
      if (stopped) return;

      const candidates = collectWordCandidates(root);
      const count = Math.min(candidates.length, Math.random() > 0.72 ? 3 : Math.random() > 0.38 ? 2 : 1);

      for (let index = 0; index < count; index += 1) {
        const candidate = candidates[Math.floor(Math.random() * candidates.length)];
        if (!candidate) continue;

        const overlay = spawnGlitchOverlay(candidate);
        if (!overlay) continue;

        active.add(overlay);
        window.setTimeout(() => clearOverlay(overlay), 420 + Math.random() * 560);
      }

      timer = window.setTimeout(tick, 260 + Math.random() * 920);
    }

    timer = window.setTimeout(tick, 180);
    window.addEventListener("random-glitch-clear-scope", clearScope);

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      window.removeEventListener("random-glitch-clear-scope", clearScope);
      active.forEach((overlay) => overlay.remove());
      active.clear();
    };
  }, [enabled]);
}
