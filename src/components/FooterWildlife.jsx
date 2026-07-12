import { useEffect, useRef, useState } from "react";
import { PixelFrog } from "./PixelFrog";
import { PixelLeapFish } from "./PixelLeapFish";

const FISH_COLORS = ["#45d8ff", "#3fff97", "#ffd166", "#ff3d9d", "#a78bfa"];

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

export function FooterWildlife() {
  const [fish, setFish] = useState([]);
  const [frogs, setFrogs] = useState([]);
  const layerRef = useRef(null);
  const nextIdRef = useRef(0);
  const buddyEventActiveRef = useRef(false);
  const activeFishRef = useRef("");

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return undefined;

    const timers = new Set();
    const schedule = (callback, delay) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        callback();
      }, delay);
      timers.add(timer);
      return timer;
    };

    buddyEventActiveRef.current = Boolean(document.documentElement.dataset.buddyEvent);

    const removeFish = (id) => {
      setFish((current) => current.filter((item) => item.id !== id));
      if (activeFishRef.current !== id) return;
      activeFishRef.current = "";
      window.dispatchEvent(new CustomEvent("daivr-footer-wildlife-event", {
        detail: { active: false, name: "flying-fish" }
      }));
    };
    const removeFrog = (id) => setFrogs((current) => current.filter((item) => item.id !== id));

    const spawnFish = ({ forceCollision = false } = {}) => {
      if (buddyEventActiveRef.current || activeFishRef.current) return;
      const layer = layerRef.current;
      const id = `footer-fish-${nextIdRef.current++}`;
      const direction = Math.random() < 0.5 ? -1 : 1;
      const item = {
        id,
        x: randomBetween(direction > 0 ? 7 : 20, direction > 0 ? 80 : 93),
        drift: direction * randomBetween(58, 112),
        height: randomBetween(30, 46),
        duration: randomBetween(1950, 2500),
        color: FISH_COLORS[Math.floor(Math.random() * FISH_COLORS.length)],
        facing: direction
      };
      const layerRect = layer?.getBoundingClientRect();
      const buddyNode = document.querySelector(".screen-buddy-root:not(.is-off)");
      const buddyRect = buddyNode?.getBoundingClientRect();
      if (forceCollision && layerRect && buddyRect) {
        const buddyCenter = buddyRect.left + buddyRect.width / 2 - layerRect.left;
        item.drift = direction * 88;
        item.x = Math.max(7, Math.min(91, (buddyCenter - item.drift * 0.54) / layerRect.width * 100));
      }
      const startX = layerRect ? layerRect.width * item.x / 100 : 0;
      const buddyLeft = layerRect && buddyRect ? buddyRect.left - layerRect.left : -9999;
      const buddyRight = layerRect && buddyRect ? buddyRect.right - layerRect.left : -9999;
      const buddyNearWater = Boolean(layerRect && buddyRect && buddyRect.bottom >= layerRect.bottom - 30 && buddyRect.bottom <= layerRect.bottom + 20);
      const pathLeft = Math.min(startX, startX + item.drift);
      const pathRight = Math.max(startX, startX + item.drift);
      const intersectsBuddy = Boolean(
        layerRect && buddyRect && buddyNearWater
        && pathRight >= buddyLeft - 8
        && pathLeft <= buddyRight + 8
      );

      if (intersectsBuddy) {
        const buddyCenter = (buddyLeft + buddyRight) / 2;
        const progress = Math.max(0.14, Math.min(0.86, (buddyCenter - startX) / item.drift));
        item.collision = {
          progress,
          x: item.drift * progress,
          y: -4 * item.height * progress * (1 - progress),
          bounceX: item.drift * progress - direction * randomBetween(22, 38)
        };
      }

      activeFishRef.current = id;
      window.dispatchEvent(new CustomEvent("daivr-footer-wildlife-event", {
        detail: { active: true, name: "flying-fish" }
      }));
      setFish([item]);
      if (item.collision) {
        schedule(() => {
          if (buddyEventActiveRef.current && document.documentElement.dataset.buddyEvent !== "flying-fish") {
            removeFish(id);
            return;
          }
          setFish((current) => current.map((fishItem) => fishItem.id === id ? { ...fishItem, collided: true } : fishItem));
          window.dispatchEvent(new CustomEvent("daivr-footer-fish-bump", {
            detail: { x: item.x, direction: item.facing }
          }));
          schedule(() => removeFish(id), 1050);
        }, item.duration * item.collision.progress);
      } else {
        window.dispatchEvent(new CustomEvent("daivr-footer-fish-seen", {
          detail: { x: item.x, direction: item.facing }
        }));
      }
      schedule(() => removeFish(id), item.duration + (item.collision ? 1200 : 500));
    };

    const queueFish = () => {
      schedule(() => {
        if (!document.hidden) spawnFish();
        queueFish();
      }, randomBetween(14000, 30000));
    };

    const spawnRainFrogs = () => {
      const layer = layerRef.current;
      if (!layer) return;
      const layerRect = layer.getBoundingClientRect();
      const buddyRect = document.querySelector(".screen-buddy-root")?.getBoundingClientRect();
      const buddyCenter = buddyRect
        ? buddyRect.left + buddyRect.width / 2 - layerRect.left
        : layerRect.width / 2;

      [-1, 1].forEach((side, index) => {
        schedule(() => {
          const id = `footer-frog-${nextIdRef.current++}`;
          const direction = side;
          const start = Math.max(28, Math.min(layerRect.width - 48, buddyCenter + direction * randomBetween(35, 72)));
          const hop1 = direction * randomBetween(45, 78);
          const hop2 = hop1 + direction * randomBetween(48, 90);
          const hop3 = hop2 + direction * randomBetween(54, 104);
          const item = { id, start, hop1, hop2, hop3, delay: index * 280 };
          setFrogs((current) => [...current, item]);
          schedule(() => removeFrog(id), 6500);
        }, index * 280);
      });
    };

    const onFishSignal = (event) => spawnFish({ forceCollision: Boolean(event.detail?.forceCollision) });
    const onRainSignal = (event) => {
      if (event.detail?.active) spawnRainFrogs();
    };
    const onBuddyEventState = (event) => {
      const detail = event.detail || {};
      buddyEventActiveRef.current = Boolean(detail.active);
    };

    window.addEventListener("daivr-footer-fish", onFishSignal);
    window.addEventListener("daivr-footer-rain", onRainSignal);
    window.addEventListener("daivr-buddy-event-state", onBuddyEventState);
    schedule(spawnFish, 4200);
    queueFish();

    return () => {
      window.removeEventListener("daivr-footer-fish", onFishSignal);
      window.removeEventListener("daivr-footer-rain", onRainSignal);
      window.removeEventListener("daivr-buddy-event-state", onBuddyEventState);
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return (
    <div className="footer-wildlife-layer" ref={layerRef} aria-hidden="true">
      {fish.map((item) => (
        <span
          className={`footer-leap-fish ${item.collided ? "is-collided" : ""}`}
          key={item.id}
          style={{
            "--fish-x": `${item.x}%`,
            "--fish-drift": `${item.drift}px`,
            "--fish-mid": `${item.drift * 0.52}px`,
            "--fish-late": `${item.drift * 0.82}px`,
            "--fish-apex": `${item.height * -1}px`,
            "--fish-fall": `${item.height * -0.52}px`,
            "--fish-duration": `${item.duration}ms`,
            "--fish-facing": item.facing,
            "--fish-rise-angle": `${item.facing * -14}deg`,
            "--fish-apex-angle": `${item.facing * -2}deg`,
            "--fish-fall-angle": `${item.facing * 14}deg`,
            "--fish-entry-angle": `${item.facing * 28}deg`,
            "--fish-collision-x": `${item.collision?.x || 0}px`,
            "--fish-collision-y": `${item.collision?.y || 0}px`,
            "--fish-bounce-x": `${item.collision?.bounceX || item.drift}px`
          }}
        >
          <span className="footer-fish-splash is-launch"><i /><b /><b /><b /></span>
          <span className="footer-fish-flight"><PixelLeapFish color={item.color} /></span>
          <span className="footer-fish-impact"><i /><i /><i /><i /></span>
          <span className="footer-fish-splash is-land"><i /><b /><b /><b /></span>
        </span>
      ))}

      {frogs.map((frog) => (
        <span
          className="footer-rain-frog"
          key={frog.id}
          style={{
            "--frog-start": `${frog.start}px`,
            "--frog-hop-1": `${frog.hop1}px`,
            "--frog-hop-2": `${frog.hop2}px`,
            "--frog-hop-3": `${frog.hop3}px`,
            "--frog-air-1": `${frog.hop1 * 0.48}px`,
            "--frog-air-2": `${(frog.hop1 + frog.hop2) * 0.5}px`,
            "--frog-air-3": `${(frog.hop2 + frog.hop3) * 0.5}px`,
            "--frog-facing": frog.hop1 < 0 ? -1 : 1,
            "--frog-delay": `${frog.delay}ms`
          }}
        >
          <PixelFrog />
        </span>
      ))}
    </div>
  );
}
