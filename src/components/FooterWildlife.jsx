import { useEffect, useRef, useState } from "react";
import { PixelFrog } from "./PixelFrog";
import { PixelLeapFish } from "./PixelLeapFish";
import { fishArc, fishContact, fishRebound, reboundPoint } from "../../shared/footer-fish-motion.mjs";

const FISH_SPECIES = ["byte-minnow", "cache-carp", "pixel-perch", "syntax-salmon", "neon-tetra"];

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
    let flightFrame = 0;
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
      const layerRect = layer?.getBoundingClientRect();
      if (!layerRect || layerRect.bottom < 0 || layerRect.top > window.innerHeight || document.hidden) return;
      const id = `footer-fish-${nextIdRef.current++}`;
      const buddyNode = document.querySelector(".screen-buddy-root:not(.is-off)");
      const bodyNode = buddyNode?.querySelector(".screen-buddy-sprite");
      const readBody = (rect) => {
        if (!bodyNode || buddyNode.matches(".is-off,.is-held,.is-chute,.is-sleep,.is-sleepy,.is-outage,.is-hunt")) return null;
        const body = bodyNode.getBoundingClientRect();
        // Ignore transparent SVG margins, antenna, loose gear and speech bubble.
        return { left: body.left - rect.left + body.width * .19, right: body.right - rect.left - body.width * .19,
          top: body.top - rect.top + body.height * .24, bottom: body.bottom - rect.top - body.height * .13 };
      };
      const body = readBody(layerRect);
      let direction = Math.random() < 0.5 ? -1 : 1;
      if (forceCollision && body) direction = (body.left + body.right) / 2 > layerRect.width / 2 ? 1 : -1;
      const drift = direction * randomBetween(115, 185);
      const margin = 25;
      const startMin = direction > 0 ? margin : margin + Math.abs(drift);
      const startMax = direction > 0 ? layerRect.width - margin - Math.abs(drift) : layerRect.width - margin;
      const startX = forceCollision && body
        ? Math.max(margin, Math.min(layerRect.width - margin, (body.left + body.right) / 2 - drift * .55))
        : randomBetween(Math.min(startMin, startMax), Math.max(startMin, startMax));
      const item = {
        id, startX, drift, waterY: layerRect.height + 10,
        height: randomBetween(61, 85),
        species: FISH_SPECIES[Math.floor(Math.random() * FISH_SPECIES.length)],
        duration: randomBetween(1.35, 1.75),
        facing: direction
      };
      activeFishRef.current = id;
      window.dispatchEvent(new CustomEvent("daivr-footer-wildlife-event", {
        detail: { active: true, name: "flying-fish" }
      }));
      setFish([item]);
      window.dispatchEvent(new CustomEvent("daivr-footer-fish-seen", {
        detail: { x: startX / layerRect.width * 100, direction }
      }));
      let startedAt, previous = fishArc(item, 0), previousBody = body, bounce = null, hitTime = 0;
      let fishNode, flight;
      const animate = (now) => {
        if (activeFishRef.current !== id) return;
        const rect = layer.getBoundingClientRect();
        if (document.hidden || Math.abs(rect.width - layerRect.width) > 1 || rect.bottom < 0 || rect.top > window.innerHeight
          || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { removeFish(id); return; }
        fishNode ||= layer.querySelector(`[data-fish-id="${id}"]`);
        flight ||= fishNode?.querySelector(".footer-fish-flight");
        if (!flight) { flightFrame = window.requestAnimationFrame(animate); return; }
        startedAt ??= now;
        const time = (now - startedAt) / 1000;
        let point = bounce ? reboundPoint(bounce, Math.min(time - hitTime, bounce.duration)) : fishArc(item, time);
        const liveBody = readBody(rect);
        const contact = !bounce && time > .08 ? fishContact(previous, point, previousBody, liveBody) : null;
        if (contact) {
          bounce = fishRebound(contact, point, item.waterY);
          hitTime = time;
          point = { ...point, x: contact.x, y: contact.y };
          fishNode.style.setProperty("--fish-collision-x", `${contact.x - startX}px`);
          fishNode.style.setProperty("--fish-collision-y", `${contact.y - item.waterY}px`);
          fishNode.classList.add("is-collided");
          window.dispatchEvent(new CustomEvent("daivr-footer-fish-bump", {
            detail: { x: contact.x / rect.width * 100, direction, speed: Math.hypot(point.vx, point.vy) }
          }));
        }
        // The very same coordinates drive rendering and contact detection.
        const angle = Math.atan2(point.vy, Math.abs(point.vx)) * 180 / Math.PI * direction;
        flight.style.transform = `translate(${point.x - startX}px, ${point.y - item.waterY}px) rotate(${angle}deg)`;
        flight.style.opacity = String(Math.min(1, Math.max(0, (rect.height + 12 - point.y) / 15)));
        previous = point;
        previousBody = liveBody;
        if (bounce ? time - hitTime >= bounce.duration : time >= item.duration) {
          fishNode.style.setProperty("--fish-land-x", `${point.x - startX}px`);
          fishNode.classList.add("is-landed");
          flight.style.opacity = "0";
          schedule(() => removeFish(id), 720);
          return;
        }
        flightFrame = window.requestAnimationFrame(animate);
      };
      flightFrame = window.requestAnimationFrame(animate);
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
          const room = direction > 0 ? layerRect.width - start - 42 : start - 2;
          const travel = Math.max(0, Math.min(room, randomBetween(180, 240)));
          const hop1 = direction * travel * .3;
          const hop2 = direction * travel * .66;
          const hop3 = direction * travel;
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
      window.cancelAnimationFrame(flightFrame);
      if (activeFishRef.current) {
        activeFishRef.current = "";
        window.dispatchEvent(new CustomEvent("daivr-footer-wildlife-event", { detail: { active: false, name: "flying-fish" } }));
      }
    };
  }, []);

  return (
    <div className="footer-wildlife-layer" ref={layerRef} aria-hidden="true">
      {fish.map((item) => (
        <span
          className="footer-leap-fish"
          data-fish-id={item.id}
          key={item.id}
          style={{
            "--fish-x": `${item.startX}px`,
            "--fish-facing": item.facing
          }}
        >
          <span className="footer-fish-splash is-launch"><i /><b /><b /><b /></span>
          <span className="footer-fish-flight"><PixelLeapFish species={item.species} /></span>
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
            "--frog-height-1": `${Math.min(29, 10 + Math.abs(frog.hop1) * .2)}px`,
            "--frog-height-2": `${Math.min(34, 12 + Math.abs(frog.hop2 - frog.hop1) * .2)}px`,
            "--frog-height-3": `${Math.min(27, 9 + Math.abs(frog.hop3 - frog.hop2) * .2)}px`,
            "--frog-delay": `${frog.delay}ms`
          }}
        >
          <span className="footer-frog-shadow" />
          <span className="footer-frog-lift"><PixelFrog /></span>
        </span>
      ))}
    </div>
  );
}
