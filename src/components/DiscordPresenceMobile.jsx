import { Gamepad2, Headphones, Radio, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/cn";
import { DiscordDeskKeepsakes } from "./DiscordDeskKeepsakes";
import { packetRexGeometry, packetRexJump } from "../../shared/packet-rex-motion.mjs";

const ACTIVITY_EXIT_DURATION = 220;
const IDLE_TREX_PATH = "M24 0h17v2H24zM22 2h4v3h-4zM28 2h16v3H28zM22 5h22v7H22zM22 12h11v2H22zM22 14h17v2H22zM0 16h2v3H0zM20 16h11v3H20zM0 19h2v2H0zM16 19h15v2H16zM0 21h4v2H0zM13 21h22v2H13zM0 23h6v2H0zM11 23h20v2H11zM33 23h2v2H33zM0 25h31v4H0zM2 29h29v2H2zM4 31h24v2H4zM9 33h17v3H9zM9 36h15v2H9zM11 38h6v3h-6zM20 38h4v3h-4zM11 41h4v2h-4zM22 41h2v4h-2zM11 43h2v2h-2zM11 45h5v2h-5zM22 45h5v2h-5z";
// Copyright (c) 2014 The Chromium Authors. Sprite extracted from the user-supplied BSD-licensed runner.
const IDLE_TREX_SPRITE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQgAAAAvAgMAAABiRrxWAAAADFBMVEX///9TU1P39/f///+TS9URAAAAAXRSTlMAQObYZgAAAPpJREFUeF7d0jFKRkEMhdGLMM307itNLALyVmHvJuzTDMjdn72E95PGFEZSmeoU4YMMgxhskvQec8YSVFX1NhGcS5ywtbmC8khcZeKq+ZWJ4F8Sr2+ZCErjkJFEfcjAc/6/BMlfcz6xHdhRthYzIZhIHMcTVY1scUUiAphK8CMSPUbieTBhvD9Lj0vyV4wklEGzHpciKGOJoBp7XDcFs4kWxxM7Ey3iZ8JbzASAvMS7XLOJHTTvEkEZSeQl7DMuwVyCasqK5+XzQRYLUJlMbPXjFcn3m8eKBSjWZMJwvGIOvViAzCbUj1VEDoqFOEQGE3SyInJQLOQMJL4B7enP1UbLXJQAAAAASUVORK5CYII=";

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = (event) => setPrefersReducedMotion(event.matches);

    setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
}

function useAnimatedActivities(nextActivities, prefersReducedMotion) {
  const [renderedActivities, setRenderedActivities] = useState(() =>
    nextActivities.map((activity) => ({ ...activity, motionState: "visible" }))
  );

  useEffect(() => {
    const nextByKey = new Map(nextActivities.map((activity) => [activity.activityKey, activity]));

    if (prefersReducedMotion) {
      setRenderedActivities(nextActivities.map((activity) => ({ ...activity, motionState: "visible" })));
      return undefined;
    }

    setRenderedActivities((current) => {
      const currentKeys = new Set(current.map((activity) => activity.activityKey));
      const merged = current.map((activity) => {
        const nextActivity = nextByKey.get(activity.activityKey);

        if (!nextActivity) return { ...activity, motionState: "exiting" };
        return {
          ...nextActivity,
          motionState: activity.motionState === "exiting" ? "entering" : activity.motionState
        };
      });

      nextActivities.forEach((activity, index) => {
        if (currentKeys.has(activity.activityKey)) return;
        merged.splice(Math.min(index, merged.length), 0, { ...activity, motionState: "entering" });
      });

      return merged;
    });

    let settleFrame;
    const startFrame = window.requestAnimationFrame(() => {
      settleFrame = window.requestAnimationFrame(() => {
        setRenderedActivities((current) => current.map((activity) => (
          nextByKey.has(activity.activityKey) && activity.motionState === "entering"
            ? { ...activity, motionState: "visible" }
            : activity
        )));
      });
    });

    const exitTimer = window.setTimeout(() => {
      setRenderedActivities((current) => current.filter((activity) => nextByKey.has(activity.activityKey)));
    }, ACTIVITY_EXIT_DURATION);

    return () => {
      window.cancelAnimationFrame(startFrame);
      if (settleFrame) window.cancelAnimationFrame(settleFrame);
      window.clearTimeout(exitTimer);
    };
  }, [nextActivities, prefersReducedMotion]);

  return renderedActivities;
}

function drawIdleCactus(context, obstacle, groundY, colors) {
  const { height, type, width, x } = obstacle;
  const top = groundY - height;

  context.save();
  context.fillStyle = colors.phosphor;
  context.shadowColor = colors.phosphor;
  context.shadowBlur = 7;
  context.fillRect(Math.round(x + width * 0.38), Math.round(top), 6, height);
  context.fillRect(Math.round(x + width * 0.12), Math.round(top + height * 0.34), 6, height * 0.28);
  context.fillRect(Math.round(x + width * 0.12), Math.round(top + height * 0.55), width * 0.38, 6);
  context.fillRect(Math.round(x + width * 0.58), Math.round(top + height * 0.2), 6, height * 0.24);
  context.fillRect(Math.round(x + width * 0.46), Math.round(top + height * 0.38), width * 0.38, 6);

  if (type === "cluster") {
    context.fillStyle = colors.cyan;
    context.globalAlpha = 0.72;
    context.fillRect(Math.round(x + width * 0.75), Math.round(top + height * 0.28), 5, height * 0.72);
    context.fillRect(Math.round(x + width * 0.62), Math.round(top + height * 0.5), width * 0.36, 5);
  }

  context.restore();
}

function drawIdleCloud(context, x, y, scale) {
  // Nube pixelada del runner clasico, rehecha con bloques para el cabinet.
  const block = (offsetX, offsetY, width, height) => context.fillRect(
    Math.round(x + offsetX * scale),
    Math.round(y + offsetY * scale),
    Math.max(1, Math.round(width * scale)),
    Math.max(1, Math.round(height * scale))
  );

  block(5, 0, 10, 2);
  block(2, 2, 16, 2);
  block(0, 4, 21, 3);
  block(4, 7, 13, 2);
}

function drawIdleSkylineBlock(context, item, baseY, colors) {
  context.fillRect(
    Math.round(item.x),
    Math.round(baseY - item.height),
    Math.round(item.width),
    Math.round(item.height)
  );

  if (!item.mast) return;

  const mastX = Math.round(item.x + item.width * 0.5);
  const mastTop = Math.round(baseY - item.height - item.mastHeight);
  context.fillRect(mastX, mastTop, 1, item.mastHeight);
  context.fillRect(mastX - 2, mastTop + 4, 5, 1);

  if (!item.lit) return;

  context.save();
  context.fillStyle = colors.glitch;
  context.globalAlpha = 0.5 + Math.sin(item.blinkPhase) * 0.34;
  context.fillRect(mastX - 1, mastTop - 3, 3, 2);
  context.restore();
}

function drawIdleDrone(context, drone, groundY, colors) {
  const bodyX = Math.round(drone.x);
  const bodyY = Math.round(groundY - drone.altitude - drone.bob);

  context.save();
  context.fillStyle = drone.blocking ? colors.glitch : colors.cyan;
  context.shadowColor = context.fillStyle;
  context.shadowBlur = 6;
  // Paquete con dos fotogramas de aleteo: la senal que el rastreador persigue.
  context.fillRect(bodyX + 5, bodyY, 12, 6);
  context.fillRect(bodyX + 2, bodyY + 2, 3, 2);
  context.fillRect(bodyX + 17, bodyY + 1, 3, 3);
  context.fillRect(bodyX + 6, drone.wing ? bodyY - 4 : bodyY + 6, 9, 3);
  context.restore();
}

function drawIdleBlip(context, blip, groundY, colors) {
  const centerX = Math.round(blip.x);
  const centerY = Math.round(groundY - blip.y - Math.sin(blip.phase) * 3);

  context.save();
  context.fillStyle = colors.cabinet;
  context.shadowColor = colors.cabinet;
  context.shadowBlur = 8;
  context.globalAlpha = 0.58 + Math.sin(blip.phase * 2) * 0.3;
  context.fillRect(centerX - 1, centerY - 4, 3, 9);
  context.fillRect(centerX - 4, centerY - 1, 9, 3);
  context.restore();
}

function DiscordIdleRunner({ prefersReducedMotion }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion) return undefined;

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return undefined;

    const trexPath = new Path2D(IDLE_TREX_PATH);
    const trexSprite = new Image();

    // La escena se arma por capas de parallax para que el cielo del panel deje
    // de ser un rectangulo vacio: nubes al fondo, horizonte de cabinas a media
    // distancia y el carril del rastreador delante.
    const blips = [];
    const clouds = [];
    const obstacles = [];
    const pebbles = [];
    const skyline = [];
    const sparks = [];
    const stars = [];

    let animationFrame = 0;
    let blipTimer = 2.4;
    let laneSlots = 4;
    let dinoScale = 1.7;
    let dinoX = 28;
    let distance = 0;
    let distanceFlash = 0;
    let drone = null;
    let skyDroneTimer = 5.5;
    let gameTime = 0;
    let groundOffset = 0;
    let groundY = 0;
    let isGrounded = true;
    let isVisible = false;
    let jumpOffset = 0;
    let jumpVelocity = 0;
    let jumpGravity = 980;
    let lastTime = 0;
    let manualClock = null;
    let spawnCooldown = 160;
    let sceneSpan = 320;
    let signalFlash = 0;
    let signals = 0;
    let stageHeight = 0;
    let stageWidth = 0;
    let tintedTrexSprite = null;

    const styles = getComputedStyle(canvas);
    const colors = {
      cabinet: styles.getPropertyValue("--color-cabinet").trim() || "#ffd45d",
      cyan: styles.getPropertyValue("--color-cyan-arcade").trim() || "#45d8ff",
      glitch: styles.getPropertyValue("--color-glitch").trim() || "#ff3ba7",
      phosphor: styles.getPropertyValue("--color-phosphor").trim() || "#39ff9c"
    };

    trexSprite.onload = () => {
      const spriteCanvas = document.createElement("canvas");
      const spriteContext = spriteCanvas.getContext("2d", { willReadFrequently: true });
      if (!spriteContext) return;

      spriteCanvas.width = trexSprite.naturalWidth;
      spriteCanvas.height = trexSprite.naturalHeight;
      spriteContext.drawImage(trexSprite, 0, 0);

      const resolveColor = (value) => {
        const colorCanvas = document.createElement("canvas");
        const colorContext = colorCanvas.getContext("2d", { willReadFrequently: true });
        if (!colorContext) return [57, 255, 156];

        colorCanvas.width = 1;
        colorCanvas.height = 1;
        colorContext.fillStyle = value;
        colorContext.fillRect(0, 0, 1, 1);
        return Array.from(colorContext.getImageData(0, 0, 1, 1).data.slice(0, 3));
      };

      const spritePixels = spriteContext.getImageData(
        0,
        0,
        spriteCanvas.width,
        spriteCanvas.height
      );
      const phosphorRgb = resolveColor(colors.phosphor);
      const cyanRgb = resolveColor(colors.cyan);

      for (let index = 0; index < spritePixels.data.length; index += 4) {
        const alpha = spritePixels.data[index + 3];
        if (alpha === 0) continue;

        const red = spritePixels.data[index];
        const green = spritePixels.data[index + 1];
        const blue = spritePixels.data[index + 2];
        const luminance = (red + green + blue) / 3;

        if (luminance >= 252) {
          spritePixels.data[index] = cyanRgb[0];
          spritePixels.data[index + 1] = cyanRgb[1];
          spritePixels.data[index + 2] = cyanRgb[2];
          spritePixels.data[index + 3] = 255;
        } else if (luminance > 180) {
          spritePixels.data[index + 3] = 0;
        } else {
          spritePixels.data[index] = phosphorRgb[0];
          spritePixels.data[index + 1] = phosphorRgb[1];
          spritePixels.data[index + 2] = phosphorRgb[2];
          spritePixels.data[index + 3] = 255;
        }
      }

      spriteContext.clearRect(0, 0, spriteCanvas.width, spriteCanvas.height);
      spriteContext.putImageData(spritePixels, 0, 0);
      tintedTrexSprite = spriteCanvas;
    };
    trexSprite.src = IDLE_TREX_SPRITE;

    function randomBetween(min, max) {
      return min + Math.random() * (max - min);
    }

    function seedScenery() {
      sceneSpan = Math.max(stageWidth * 2, 360);
      clouds.length = 0;
      skyline.length = 0;
      pebbles.length = 0;
      stars.length = 0;

      const starCount = Math.max(26, Math.round(stageWidth / 5));
      for (let index = 0; index < starCount; index += 1) {
        stars.push({
          ping: index % 6 === 0,
          phase: randomBetween(0, Math.PI * 2),
          twinkle: randomBetween(0.5, 1.9),
          x: randomBetween(0, sceneSpan),
          y: randomBetween(stageHeight * 0.04, stageHeight * 0.64)
        });
      }

      const cloudCount = Math.max(5, Math.round(stageWidth / 62));
      for (let index = 0; index < cloudCount; index += 1) {
        clouds.push({
          scale: randomBetween(0.65, 1.4),
          x: randomBetween(0, sceneSpan),
          y: randomBetween(stageHeight * 0.06, stageHeight * 0.52)
        });
      }

      let cursor = randomBetween(0, 24);
      while (cursor < sceneSpan) {
        const width = randomBetween(13, 32);
        skyline.push({
          blinkPhase: randomBetween(0, Math.PI * 2),
          height: randomBetween(stageHeight * 0.06, stageHeight * 0.19),
          lit: Math.random() > 0.6,
          mast: Math.random() > 0.52,
          mastHeight: randomBetween(7, 16),
          width,
          x: cursor
        });
        cursor += width + randomBetween(5, 18);
      }

      const pebbleCount = Math.max(8, Math.round(stageWidth / 24));
      for (let index = 0; index < pebbleCount; index += 1) {
        pebbles.push({
          size: Math.random() > 0.72 ? 3 : 2,
          x: randomBetween(0, sceneSpan),
          y: randomBetween(6, 16)
        });
      }
    }

    function spawnObstacle(spawnX) {
      const cluster = Math.random() > 0.58;
      const { obstacleScale } = packetRexGeometry(stageWidth, stageHeight);
      obstacles.push({
        height: (cluster ? randomBetween(38, 45) : randomBetween(29, 37)) * obstacleScale,
        type: cluster ? "cluster" : "single",
        width: (cluster ? 29 : 19) * obstacleScale,
        x: spawnX
      });
    }

    function spawnDrone(high) {
      drone = {
        altitude: high
          ? randomBetween(47 * dinoScale + 14, 47 * dinoScale + 38)
          : randomBetween(9, 21),
        blocking: !high,
        bob: 0,
        height: 12,
        phase: 0,
        width: 22,
        wing: false,
        x: stageWidth + 6
      };
    }

    function resizeCanvas() {
      const bounds = canvas.getBoundingClientRect();
      const density = Math.min(window.devicePixelRatio || 1, 2);
      const nextWidth = Math.max(1, bounds.width);
      const nextHeight = Math.max(1, bounds.height);
      const resized = Math.abs(nextWidth - stageWidth) > 0.5 || Math.abs(nextHeight - stageHeight) > 0.5;

      stageWidth = nextWidth;
      stageHeight = nextHeight;
      canvas.width = Math.round(stageWidth * density);
      canvas.height = Math.round(stageHeight * density);
      context.setTransform(density, 0, 0, density, 0, 0);
      context.imageSmoothingEnabled = false;
      const geometry = packetRexGeometry(stageWidth, stageHeight);
      dinoScale = geometry.dinoScale;
      dinoX = Math.max(22, stageWidth * 0.13);
      groundY = geometry.groundY;
      if (resized) {
        obstacles.length = 0;
        drone = null;
        jumpOffset = 0;
        jumpVelocity = 0;
        isGrounded = true;
      }
      if (resized || !stars.length) seedScenery();

      if (!obstacles.length) {
        spawnObstacle(stageWidth * 0.82);
        spawnCooldown = Math.max(150, stageWidth * 0.6);
        laneSlots = Math.round(randomBetween(3, 6));
      }
    }

    function drawSky() {
      context.save();
      for (const star of stars) {
        // Unos pocos puntos son "pings" mas marcados: dan lectura al cielo sin
        // convertirlo en un campo de estrellas denso.
        context.fillStyle = star.ping ? colors.cabinet : colors.phosphor;
        context.globalAlpha = star.ping
          ? 0.18 + Math.abs(Math.sin(star.phase)) * 0.42
          : 0.1 + Math.abs(Math.sin(star.phase)) * 0.2;
        const size = star.ping ? 2 : 1;
        context.fillRect(Math.round(star.x), Math.round(star.y), size, size);
      }

      context.fillStyle = colors.cyan;
      context.globalAlpha = 0.2;
      for (const cloud of clouds) drawIdleCloud(context, cloud.x, cloud.y, cloud.scale);
      context.restore();
    }

    function drawSkyline() {
      const baseY = groundY - 5;

      context.save();
      context.fillStyle = colors.phosphor;
      context.globalAlpha = 0.16;
      for (const item of skyline) drawIdleSkylineBlock(context, item, baseY, colors);
      context.restore();
    }

    function drawGround() {
      context.save();
      context.strokeStyle = colors.phosphor;
      context.globalAlpha = 0.3;
      context.setLineDash([7, 7]);
      context.beginPath();
      context.moveTo(12, Math.round(groundY) + 0.5);
      context.lineTo(stageWidth - 12, Math.round(groundY) + 0.5);
      context.stroke();
      context.setLineDash([]);

      for (let x = -groundOffset; x < stageWidth; x += 22) {
        context.fillStyle = Math.round(x / 22) % 3 === 0 ? colors.glitch : colors.cyan;
        context.globalAlpha = 0.72;
        context.fillRect(Math.round(x), Math.round(groundY + 7), 4, 3);
      }

      context.fillStyle = colors.phosphor;
      context.globalAlpha = 0.26;
      for (const pebble of pebbles) {
        context.fillRect(Math.round(pebble.x), Math.round(groundY + pebble.y), pebble.size, 1);
      }
      context.restore();
    }

    function drawHud() {
      const runLabel = `AUTO_RUN // ${String(Math.floor(distance)).padStart(5, "0")}`;
      const signalLabel = `SIG x${String(signals).padStart(2, "0")}`;

      context.save();
      context.font = "700 8px monospace";
      context.fillStyle = colors.cabinet;
      context.globalAlpha = distanceFlash > 0 && Math.floor(distanceFlash * 12) % 2 === 0 ? 1 : 0.7;
      context.fillText(runLabel, 12, 17);

      context.fillStyle = signalFlash > 0 ? colors.cabinet : colors.phosphor;
      context.globalAlpha = signalFlash > 0 ? 1 : 0.62;
      context.fillText(signalLabel, stageWidth - 12 - context.measureText(signalLabel).width, 17);
      context.restore();
    }

    function drawScene() {
      context.clearRect(0, 0, stageWidth, stageHeight);

      drawSky();
      drawSkyline();
      drawGround();

      for (const blip of blips) drawIdleBlip(context, blip, groundY, colors);
      for (const item of obstacles) drawIdleCactus(context, item, groundY, colors);
      if (drone) drawIdleDrone(context, drone, groundY, colors);

      const dinoHeight = 47 * dinoScale;
      const dinoWidth = 44 * dinoScale;
      const dinoY = groundY - dinoHeight + jumpOffset;
      const spriteFrame = isGrounded ? (Math.floor(gameTime * 12) % 2 === 0 ? 2 : 3) : 0;

      context.save();
      context.shadowColor = colors.phosphor;
      context.shadowBlur = 4;

      if (tintedTrexSprite) {
        context.imageSmoothingEnabled = false;
        context.drawImage(
          tintedTrexSprite,
          spriteFrame * 44,
          0,
          44,
          47,
          Math.round(dinoX),
          Math.round(dinoY),
          Math.round(dinoWidth),
          Math.round(dinoHeight)
        );
      } else {
        context.translate(Math.round(dinoX), Math.round(dinoY));
        context.scale(dinoScale, dinoScale);
        context.fillStyle = colors.phosphor;
        context.shadowBlur = 7 / dinoScale;
        context.fill(trexPath);
      }
      context.restore();

      context.save();
      context.fillStyle = colors.cabinet;
      context.shadowColor = colors.cabinet;
      context.shadowBlur = 6;
      for (const spark of sparks) {
        context.globalAlpha = Math.max(0, spark.life / spark.maxLife);
        context.fillRect(Math.round(spark.x), Math.round(spark.y), 2, 2);
      }
      context.restore();

      drawHud();
    }

    function update(timestamp) {
      const delta = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.034) : 0;
      lastTime = timestamp;
      gameTime += delta;
      distanceFlash = Math.max(0, distanceFlash - delta);
      signalFlash = Math.max(0, signalFlash - delta);

      // La carrera acelera despacio y con tope, como el runner original.
      const speed = Math.max(82, stageWidth * 0.33) * (1 + Math.min(0.52, gameTime / 145));
      const gravity = Math.max(980, Math.min(1180, stageHeight * 3.1));
      const dinoHeight = 47 * dinoScale;
      const dinoWidth = 44 * dinoScale;
      const bodyLeft = dinoX + dinoWidth * 0.22;
      const bodyRight = dinoX + dinoWidth * 0.74;

      const previousHundreds = Math.floor(distance / 100);
      distance += speed * delta * 0.09;
      if (Math.floor(distance / 100) > previousHundreds) distanceFlash = 0.75;

      groundOffset = (groundOffset + speed * delta) % 22;

      for (const star of stars) {
        star.x -= speed * 0.05 * delta;
        star.phase += delta * star.twinkle;
        if (star.x < -2) star.x += sceneSpan;
      }

      for (const cloud of clouds) {
        cloud.x -= speed * 0.11 * delta;
        if (cloud.x < -24) cloud.x += sceneSpan;
      }

      for (const item of skyline) {
        item.x -= speed * 0.34 * delta;
        item.blinkPhase += delta * 2.1;
        if (item.x + item.width < 0) item.x += sceneSpan;
      }

      for (const pebble of pebbles) {
        pebble.x -= speed * delta;
        if (pebble.x < -4) pebble.x += sceneSpan;
      }

      for (let index = obstacles.length - 1; index >= 0; index -= 1) {
        obstacles[index].x -= speed * delta;
        if (obstacles[index].x + obstacles[index].width < -10) obstacles.splice(index, 1);
      }

      // Carril unico: cada hueco lo ocupa un cactus o un dron bajo, nunca los
      // dos. El hueco se mide desde la aparicion anterior (no desde lo que hay
      // en pista), asi que dos amenazas nunca pueden quedar pegadas.
      spawnCooldown -= speed * delta;
      if (spawnCooldown <= 0) {
        laneSlots -= 1;

        if (laneSlots <= 0 && !drone) {
          spawnDrone(false);
          laneSlots = Math.round(randomBetween(3, 6));
        } else {
          spawnObstacle(stageWidth + 6);
        }

        spawnCooldown = speed * randomBetween(1.85, 3.6);
      }

      // Los drones altos pasan por encima del rastreador, asi que no consumen
      // hueco de carril: son solo trafico de fondo.
      skyDroneTimer -= delta;
      if (!drone && skyDroneTimer <= 0) {
        spawnDrone(true);
        skyDroneTimer = randomBetween(8, 16);
      }

      if (drone) {
        drone.x -= speed * delta;
        drone.phase += delta;
        drone.bob = Math.sin(drone.phase * 3.2) * (drone.blocking ? 1.5 : 4);
        drone.wing = Math.floor(drone.phase * 7) % 2 === 0;
        if (drone.x + drone.width < -24) drone = null;
      }

      let threat = null;
      for (const item of obstacles) {
        if (item.x + item.width <= bodyLeft) continue;
        if (!threat || item.x < threat.x) threat = { clearance: item.height + 6, width: item.width, x: item.x };
      }
      if (drone?.blocking && drone.x + drone.width > bodyRight) {
        const clearance = drone.altitude + drone.height + 10;
        if (!threat || drone.x < threat.x) threat = { clearance, width: drone.width, x: drone.x };
      }

      if (isGrounded && threat) {
        const plan = packetRexJump({
          clearance: threat.clearance,
          headroom: groundY - dinoHeight - 6,
          obstacleWidth: threat.width,
          bodyWidth: bodyRight - bodyLeft,
          speed,
          gravity
        });
        const timeToThreat = (threat.x - bodyRight) / speed;

        if (plan && timeToThreat > 0 && timeToThreat <= plan.riseTime + delta) {
          isGrounded = false;
          jumpVelocity = -plan.velocity;
          jumpGravity = plan.gravity;
        }
      }

      if (!isGrounded) {
        jumpOffset += jumpVelocity * delta + 0.5 * jumpGravity * delta * delta;
        jumpVelocity += jumpGravity * delta;

        if (jumpOffset >= 0) {
          jumpOffset = 0;
          jumpVelocity = 0;
          isGrounded = true;
        }
      }

      blipTimer -= delta;
      if (blipTimer <= 0) {
        blips.push({
          phase: randomBetween(0, Math.PI * 2),
          x: stageWidth + randomBetween(12, 70),
          y: randomBetween(24, 68)
        });
        blipTimer = randomBetween(2.6, 5.4);
      }

      const dinoTop = groundY - dinoHeight + jumpOffset;
      const boxTop = dinoTop + dinoHeight * 0.12;
      const boxBottom = dinoTop + dinoHeight * 0.94;

      for (let index = blips.length - 1; index >= 0; index -= 1) {
        const blip = blips[index];
        blip.x -= speed * delta;
        blip.phase += delta * 3.4;

        const blipY = groundY - blip.y - Math.sin(blip.phase) * 3;
        const caught = blip.x + 4 >= bodyLeft
          && blip.x - 4 <= bodyRight
          && blipY + 4 >= boxTop
          && blipY - 4 <= boxBottom;

        if (caught) {
          signals += 1;
          signalFlash = 0.6;
          for (let particle = 0; particle < 7; particle += 1) {
            sparks.push({
              life: randomBetween(0.26, 0.48),
              maxLife: 0.48,
              vx: randomBetween(-46, 40),
              vy: randomBetween(-70, 10),
              x: blip.x,
              y: blipY
            });
          }
          blips.splice(index, 1);
          continue;
        }

        if (blip.x < -14) blips.splice(index, 1);
      }

      for (let index = sparks.length - 1; index >= 0; index -= 1) {
        const spark = sparks[index];
        spark.life -= delta;

        if (spark.life <= 0) {
          sparks.splice(index, 1);
          continue;
        }

        spark.x += (spark.vx - speed) * delta;
        spark.y += spark.vy * delta;
        spark.vy += 150 * delta;
      }

      drawScene();
    }

    function loop(timestamp) {
      if (!isVisible) return;
      update(timestamp);
      animationFrame = window.requestAnimationFrame(loop);
    }

    function startAnimation() {
      if (animationFrame || !isVisible) return;
      lastTime = 0;
      animationFrame = window.requestAnimationFrame(loop);
    }

    function stopAnimation() {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }

    const resizeObserver = new ResizeObserver(resizeCanvas);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) startAnimation();
      else stopAnimation();
    }, { threshold: 0.05 });

    resizeCanvas();
    drawScene();
    resizeObserver.observe(canvas);
    intersectionObserver.observe(canvas);

    if (import.meta.env.DEV) {
      // Gancho de depuracion: avanza la escena sin rAF ni observers, igual que
      // los motores estacionales, para poder inspeccionarla sin repintado.
      window.__daivrPacketRex = {
        step(ms = 16) {
          stopAnimation();
          manualClock = (manualClock ?? (lastTime || performance.now())) + ms;
          update(manualClock);
          return this.summary();
        },
        resume() {
          manualClock = null;
          isVisible = true;
          lastTime = 0;
          startAnimation();
        },
        summary() {
          return {
            airborne: !isGrounded,
            blips: blips.length,
            clouds: clouds.length,
            distance: Math.floor(distance),
            lift: Math.round(-jumpOffset),
            drone: drone ? { altitude: Math.round(drone.altitude), blocking: drone.blocking, x: Math.round(drone.x) } : null,
            obstacles: obstacles.map((item) => ({
              height: Math.round(item.height),
              width: item.width,
              x: Math.round(item.x)
            })),
            pebbles: pebbles.length,
            signals,
            skyline: skyline.length,
            stars: stars.length,
            sparks: sparks.length,
            rig: {
              bottom: Math.round(groundY),
              height: Math.round(47 * dinoScale),
              left: Math.round(dinoX + 44 * dinoScale * 0.22),
              right: Math.round(dinoX + 44 * dinoScale * 0.74)
            },
            stage: { height: Math.round(stageHeight), width: Math.round(stageWidth) }
          };
        },
        sync() {
          resizeCanvas();
          drawScene();
          return this.summary();
        }
      };
    }

    return () => {
      stopAnimation();
      trexSprite.onload = null;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      if (import.meta.env.DEV) delete window.__daivrPacketRex;
    };
  }, [prefersReducedMotion]);

  return (
    <div
      className={cn("discord-idle-game", prefersReducedMotion && "is-static")}
      role="img"
      aria-label="Pixel T-Rex running past a cabinet skyline, jumping obstacles and collecting signal markers"
    >
      {prefersReducedMotion ? (
        <svg className="discord-idle-runner" viewBox="0 0 44 47" aria-hidden="true" shapeRendering="crispEdges">
          <path fill="currentColor" d={IDLE_TREX_PATH} />
        </svg>
      ) : <canvas ref={canvasRef} aria-hidden="true" />}
    </div>
  );
}


// Preserve the original inline notebook, activity feed and idle monitor on phones.
export function DiscordPresenceMobile({ notebook, activities: displayedActivities, renderActivities, error, loading, presence, updatedAt }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const animatedActivities = useAnimatedActivities(displayedActivities, prefersReducedMotion);
  return (
      <div className="discord-presence-grid">
        <div className="discord-desk-notebook-area">
        {notebook}
        <DiscordDeskKeepsakes />
        </div>

        <div className={cn("discord-presence-activity", !animatedActivities.length && "has-idle-monitor", error && "is-signal-lost")}>
          <div className="discord-presence-activity-head">
            <div>
              <p className="pixel-label">ON THE DESK</p>
              <h3>A little downtime.</h3>
            </div>
            <span className="discord-presence-live">
              {error ? <WifiOff size={14} aria-hidden="true" /> : <Radio size={14} aria-hidden="true" />}
              {error ? "signal lost" : loading && !presence ? "syncing" : `${displayedActivities.length} active`}
            </span>
          </div>

          <div className="discord-presence-feed">
            {animatedActivities.length ? (
              renderActivities(animatedActivities)
            ) : (
              <div className="discord-presence-empty">
                <div className="discord-idle-desktop">
                  <div className="discord-idle-monitor-bar">
                    <span><Gamepad2 size={14} aria-hidden="true" /> PACKET_REX</span>
                    <span><i aria-hidden="true" /> AUTOPILOT</span>
                  </div>
                  <div className="discord-idle-visual">
                    <DiscordIdleRunner prefersReducedMotion={prefersReducedMotion} />
                  </div>

                  <div className="discord-idle-copy">
                    <span className="discord-idle-kicker">{error ? "CONNECTION INTERRUPTED" : loading && !presence ? "ESTABLISHING UPLINK" : "SIGNAL HUNT // STANDBY"}</span>
                    <h4>{error ? "Signal out of range." : loading && !presence ? "Tuning into the room." : "Between sessions."}</h4>
                    <p>{error ? "The connection dropped. The desk will update when the signal returns." : loading && !presence ? "Waiting for the latest from Discord." : "The music player and handheld will light up when something is playing."}</p>
                  </div>
                  <div className="discord-idle-readout" aria-label="Activity signal status">
                    <span><Gamepad2 size={16} aria-hidden="true" /><code>game.scan</code><b>{error ? "no signal" : "listening"}</b></span>
                    <span><Headphones size={16} aria-hidden="true" /><code>spotify.port</code><b>{error ? "no signal" : "listening"}</b></span>
                    <span><Radio size={16} aria-hidden="true" /><code>discord.state</code><b>{error ? "retrying" : loading && !presence ? "syncing" : "ready"}</b></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="discord-presence-footer">
            <span>{loading ? "syncing lanyard..." : `last sync // ${updatedAt}`}</span>
            <span className="discord-presence-connection"><i aria-hidden="true" />{error ? "api fallback mode" : loading && !presence ? "connecting" : "presence online"}</span>
          </div>
        </div>

        <div className="discord-desk-pencil" aria-hidden="true"><i /><span>ONE MORE IDEA</span></div>
      </div>
  );
}
