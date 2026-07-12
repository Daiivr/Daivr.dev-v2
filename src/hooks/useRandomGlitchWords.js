import { useEffect } from "react";

const WORD_PATTERN = /[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9'’._/-]{2,}/g;
const MAX_VISIBLE_CANDIDATES = 640;

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

function hasClippingOverflow(style) {
  return [style.overflow, style.overflowX, style.overflowY].some((value) =>
    ["auto", "clip", "hidden", "scroll"].includes(value)
  );
}

function rectsIntersect(a, b) {
  const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return width > 4 && height > 4;
}

function isRectVisibleThroughClippingParents(rect, parent) {
  if (!isVisibleRect(rect)) return false;

  for (let element = parent; element && element !== document.body; element = element.parentElement) {
    const style = window.getComputedStyle(element);
    if (hasClippingOverflow(style) && !rectsIntersect(rect, element.getBoundingClientRect())) {
      return false;
    }
  }

  return true;
}

function isEligibleTextParent(parent) {
  if (!parent) return false;

  const hiddenReview = parent.closest(".game-card-review");
  if (hiddenReview && !hiddenReview.closest(".game-card.is-flipped:not(.is-review-closing)")) {
    return false;
  }

  for (let element = parent; element && element !== document.body; element = element.parentElement) {
    const style = window.getComputedStyle(element);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      Number(style.opacity) === 0 ||
      style.pointerEvents === "none"
    ) {
      return false;
    }
  }

  return true;
}

function collectWordCandidates(root) {
  const candidates = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest(EXCLUDED_SELECTOR)) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
      if (!isEligibleTextParent(parent)) return NodeFilter.FILTER_REJECT;

      return NodeFilter.FILTER_ACCEPT;
    }
  });

  let node = walker.nextNode();
  while (node && candidates.length < MAX_VISIBLE_CANDIDATES) {
    const text = node.nodeValue;
    const parent = node.parentElement;

    if (!parent || !isVisibleRect(parent.getBoundingClientRect())) {
      node = walker.nextNode();
      continue;
    }

    WORD_PATTERN.lastIndex = 0;

    for (const match of text.matchAll(WORD_PATTERN)) {
      const word = match[0];
      if (word.length < 3 || word.length > 28) continue;

      const range = document.createRange();
      range.setStart(node, match.index);
      range.setEnd(node, match.index + word.length);
      const rect = range.getBoundingClientRect();
      range.detach();

      if (!isRectVisibleThroughClippingParents(rect, parent)) continue;

      candidates.push({
        end: match.index + word.length,
        node,
        rect,
        start: match.index,
        word
      });

      if (candidates.length >= MAX_VISIBLE_CANDIDATES) break;
    }

    node = walker.nextNode();
  }

  return candidates;
}

function spawnGlitchOverlay(candidate) {
  let rect = candidate.rect;
  const parent = candidate.node.parentElement;

  if (!rect) {
    const range = document.createRange();
    range.setStart(candidate.node, candidate.start);
    range.setEnd(candidate.node, candidate.end);
    rect = range.getBoundingClientRect();
    range.detach();
  }

  if (!parent || !isRectVisibleThroughClippingParents(rect, parent)) return null;

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
      const count = Math.min(candidates.length, Math.random() > 0.82 ? 2 : 1);

      for (let index = 0; index < count; index += 1) {
        const candidate = candidates[Math.floor(Math.random() * candidates.length)];
        if (!candidate) continue;

        const overlay = spawnGlitchOverlay(candidate);
        if (!overlay) continue;

        active.add(overlay);
        window.setTimeout(() => clearOverlay(overlay), 340 + Math.random() * 420);
      }

      timer = window.setTimeout(tick, 520 + Math.random() * 1250);
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
