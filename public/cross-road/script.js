import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { create } from "zustand";

const h = React.createElement;
const tileSize = 42;
const minTileIndex = -8;
const maxTileIndex = 8;
const stepTime = 0.2;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const palette = {
  grass: ["#86b94e", "#91c456", "#80b449", "#99c85c"],
  road: "#59636a", verge: "#c1c28b", bark: "#815738",
  leaves: ["#326b49", "#49894e", "#62a256"],
  cars: ["#ef6950", "#f2c94b", "#68b6cf", "#b58aca", "#e7eee1"],
};
let runStartedAt = 0;
const playerState = { currentRow: 0, currentTile: 0, movesQueue: [], ref: null, stepElapsed: 0 };

function notifyCabinet(type, detail = {}) {
  if (window.parent !== window) window.parent.postMessage({ type, ...detail }, window.location.origin);
}

const useGameStore = create((set, get) => ({
  status: "ready", score: 0, row: 0, run: 0,
  start: () => {
    if (get().status !== "ready") return;
    runStartedAt = Date.now();
    set({ status: "running" });
  },
  updateScore: (row) => {
    if (get().status !== "running") return;
    set({ row, score: Math.max(row, get().score) });
    notifyCabinet("daivr:daily-progress", { game: "cross-road", score: get().score, durationMs: Date.now() - runStartedAt });
  },
  endGame: () => {
    if (get().status !== "running") return;
    playerState.movesQueue = [];
    set({ status: "over" });
    notifyCabinet("daivr:cross-score", { score: get().score, durationMs: Date.now() - runStartedAt });
  },
  reset: () => {
    Object.assign(playerState, { currentRow: 0, currentTile: 0, movesQueue: [], stepElapsed: 0 });
    if (playerState.ref) {
      playerState.ref.position.set(0, 0, 0);
      playerState.ref.children[0].position.z = 0;
      playerState.ref.children[0].rotation.set(0, 0, 0);
      playerState.ref.children[0].scale.set(1, 1, 1);
    }
    useMapStore.getState().reset();
    runStartedAt = Date.now();
    set({ status: "running", score: 0, row: 0, run: get().run + 1 });
  },
}));

const useMapStore = create((set) => ({
  rows: generateRows(24, 0),
  addRows: () => set((state) => ({ rows: [...state.rows, ...generateRows(20, state.rows.length)] })),
  reset: () => set({ rows: generateRows(24, 0) }),
}));

function queueMove(direction) {
  const game = useGameStore.getState();
  if (game.status === "ready") game.start();
  if (useGameStore.getState().status !== "running" || playerState.movesQueue.length >= 2) return;
  const next = calculateFinalPosition(playerState, [...playerState.movesQueue, direction]);
  if (next.row < 0 || next.tile < minTileIndex || next.tile > maxTileIndex) return;
  const row = useMapStore.getState().rows[next.row - 1];
  const trees = next.row === 0 ? clearingTrees : row?.type === "forest" ? row.trees : [];
  if (trees.some((tree) => tree.tileIndex === next.tile)) return;
  playerState.movesQueue.push(direction);
}

function calculateFinalPosition(position, moves) {
  return moves.reduce((next, move) => ({
    row: next.row + (move === "forward" ? 1 : move === "backward" ? -1 : 0),
    tile: next.tile + (move === "right" ? 1 : move === "left" ? -1 : 0),
  }), { row: position.currentRow, tile: position.currentTile });
}

function stepCompleted() {
  const next = calculateFinalPosition(playerState, [playerState.movesQueue.shift()]);
  playerState.currentRow = next.row;
  playerState.currentTile = next.tile;
  if (next.row >= useMapStore.getState().rows.length - 16) useMapStore.getState().addRows();
  useGameStore.getState().updateScore(next.row);
}

// Original voxel models. Each batch costs one draw call, rather than one per cube.
const voxelGeometry = new THREE.BoxGeometry(1, 1, 1);
const voxelMaterial = new THREE.MeshLambertMaterial();
function voxel(x, y, z, w, d, height, color) { return { x, y, z, w, d, height, color }; }

function Voxels({ boxes, castShadow = true }) {
  const ref = useRef();
  useEffect(() => {
    const mesh = ref.current;
    // Release each batch's instance buffers while retaining shared cube resources.
    return () => mesh.dispose();
  }, []);
  useLayoutEffect(() => {
    const transform = new THREE.Object3D();
    const color = new THREE.Color();
    boxes.forEach((box, index) => {
      transform.position.set(box.x, box.y, box.z);
      transform.scale.set(box.w, box.d, box.height);
      transform.updateMatrix();
      ref.current.setMatrixAt(index, transform.matrix);
      ref.current.setColorAt(index, color.set(box.color));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [boxes]);
  return h("instancedMesh", { ref, args: [voxelGeometry, voxelMaterial, boxes.length], castShadow, receiveShadow: true, dispose: null });
}

function treeBoxes(x, y, height = 55, variant = 0) {
  const leaves = palette.leaves[variant % palette.leaves.length];
  return [
    voxel(x, y, 12, 9, 10, 24, palette.bark),
    voxel(x - 1, y, 17, 4, 11, 12, "#a07349"),
    voxel(x, y, height * 0.55, 30, 28, height * 0.6, leaves),
    voxel(x - 3, y + 1, height * 0.83, 23, 22, height * 0.4, leaves),
    voxel(x - 8, y - 8, height * 0.52, 16, 16, 14, "#559957"),
  ];
}

function seeded(seed) {
  let value = seed >>> 0;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
}

function sceneryBoxes(rowIndex, trees) {
  const random = seeded(rowIndex * 733 + 9781);
  const boxes = [];
  // Woodland stays outside the playable grid so it cannot hide traffic.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const x = side * (420 + i * 44 + random() * 16);
      boxes.push(...treeBoxes(x, random() * 22 - 11, 42 + random() * 45, Math.floor(random() * 3)));
    }
    boxes.push(voxel(side * 384, 0, 8, 22, 18, 16, "#669849"));
    if (rowIndex % 3 === 0) boxes.push(voxel(side * 368, -7, 5, 12, 10, 10, "#a4b09b"));
  }
  for (const tree of trees) boxes.push(...treeBoxes(tree.tileIndex * tileSize, 0, tree.height, Math.abs(tree.tileIndex) % 3));
  for (let i = 0; i < 22; i++) {
    const x = (random() - 0.5) * 740;
    const y = (random() - 0.5) * 34;
    boxes.push(voxel(x, y, 1.9, 6 + random() * 12, 4 + random() * 8, 0.5, random() > 0.5 ? "#a2cb66" : "#76aa45"));
    if (i % 4 === 0) {
      boxes.push(voxel(x, y, 4, 2, 2, 5, "#588c43"));
      boxes.push(voxel(x, y, 7, 4, 4, 3, i % 8 === 0 ? "#fff2b0" : "#e3a2b2"));
    }
  }
  return boxes;
}

function Ground({ rowIndex, road = false }) {
  return h("mesh", { position: [0, 0, -1], receiveShadow: true },
    h("boxGeometry", { args: [2200, tileSize, 4] }),
    h("meshLambertMaterial", { color: road ? palette.road : palette.grass[((rowIndex % 4) + 4) % 4] }));
}

function Grass({ rowIndex, trees }) {
  const boxes = useMemo(() => sceneryBoxes(rowIndex, trees), [rowIndex, trees]);
  return h("group", { position: [0, rowIndex * tileSize, 0] },
    h(Ground, { rowIndex }), h(Voxels, { boxes }));
}

function Road({ rowIndex, data }) {
  const details = useMemo(() => {
    const boxes = [];
    for (let x = -900; x <= 900; x += 42) boxes.push(voxel(x, -19, 1.3, 18, 1.5, 0.3, "#d6d6b9"));
    for (const side of [-1, 1]) {
      boxes.push(voxel(side * 386, 0, 2, 12, 42, 4, palette.verge));
      boxes.push(voxel(side * 396, 0, 8, 4, 5, 16, "#e8e4cf"));
      boxes.push(voxel(side * 396, 0, 13, 4.3, 5.3, 4, "#e7ae4c"));
    }
    return boxes;
  }, []);
  return h("group", { position: [0, rowIndex * tileSize, 0] },
    h(Ground, { rowIndex, road: true }), h(Voxels, { boxes: details, castShadow: false }),
    data.vehicles.map((vehicle, index) => h(Vehicle, { key: index, rowIndex, ...vehicle, direction: data.direction, speed: data.speed, type: data.type })));
}

function vehicleBoxes(type, color) {
  const truck = type === "truck";
  const boxes = truck ? [
    voxel(-14, 0, 23, 66, 29, 36, "#f0e8ce"),
    voxel(-14, 0, 42, 68, 30, 3, "#faf2db"),
    voxel(-14, -14.7, 24, 60, 0.8, 5, color),
    voxel(33, 0, 16, 28, 27, 25, color),
    voxel(28, 0, 29, 19, 25, 13, color),
    voxel(30, -13, 31, 13, 0.8, 8, "#c2e6e8"),
    voxel(38, 0, 31, 0.8, 21, 8, "#a6d5df"),
    voxel(-48, 0, 22, 1, 24, 26, "#d0ccb9"),
  ] : [
    voxel(0, 0, 10, 59, 28, 12, color),
    voxel(-5, 0, 21, 30, 25, 13, color),
    voxel(-5, 0, 28, 32, 26, 3, color),
    voxel(-5, -12.8, 22, 23, 0.8, 9, "#c2e6e8"),
    voxel(-5, 12.8, 22, 23, 0.8, 9, "#a6d5df"),
    voxel(10.3, 0, 22, 0.8, 22, 9, "#b7dce3"),
    voxel(-20.3, 0, 22, 0.8, 22, 9, "#9fc8d4"),
    voxel(-5, -13.3, 22, 2.5, 1, 11, color),
    voxel(21, 0, 17, 15, 27, 2, color),
  ];
  const front = truck ? 47.5 : 30;
  const back = truck ? -48 : -30;
  boxes.push(voxel(front, 0, 7, 2, 28, 4, "#d7dbd5"), voxel(back, 0, 7, 2, 27, 4, "#c6cec9"));
  for (const side of [-1, 1]) {
    boxes.push(voxel(front, side * 9, 13, 1.5, 6, 4, "#fff4bf"), voxel(back, side * 9, 13, 1.5, 5, 4, "#bf443a"));
    for (const x of truck ? [-34, 8, 34] : [-18, 18]) {
      boxes.push(voxel(x, side * 14, 6, 10, 5, 12, "#303b40"));
      boxes.push(voxel(x, side * 17, 6, 5, 1, 5, "#91a4a7"));
    }
  }
  return boxes;
}

function Vehicle({ rowIndex, initialTileIndex, direction, speed, color, type }) {
  const ref = useRef();
  const boxes = useMemo(() => vehicleBoxes(type, color), [type, color]);
  useFrame((_, delta) => {
    if (!ref.current) return;
    const status = useGameStore.getState().status;
    if (status === "over" || document.hidden) return;
    const vehicle = ref.current;
    vehicle.position.x += (direction ? 1 : -1) * speed * Math.min(delta, 0.05);
    const edge = (maxTileIndex + 5) * tileSize;
    if (vehicle.position.x > edge) vehicle.position.x = -edge;
    if (vehicle.position.x < -edge) vehicle.position.x = edge;
    if (status !== "running" || !playerState.ref) return;
    // Use road footprints: decorative details must not expand collision bounds.
    const player = playerState.ref.position;
    const halfLength = type === "truck" ? 48 : 30;
    if (Math.abs(player.y - rowIndex * tileSize) < 21 && Math.abs(player.x - vehicle.position.x) < halfLength + 7) {
      useGameStore.getState().endGame();
    }
  });
  return h("group", { ref, position: [initialTileIndex * tileSize, 0, 0], rotation: [0, 0, direction ? 0 : Math.PI] }, h(Voxels, { boxes }));
}

const chickenBoxes = [
  voxel(0, -2, 14, 16, 18, 18, "#fff6de"),
  voxel(0, 4, 24, 14, 14, 15, "#fffcf0"),
  voxel(0, 12, 22, 8, 7, 5, "#f5b442"),
  voxel(0, 10, 17, 4, 4, 6, "#e76750"),
  voxel(0, 3, 33, 4, 12, 5, "#e95350"),
  voxel(0, 1, 36, 4, 4, 3, "#f77560"),
  voxel(-7.2, 7, 27, 1.2, 3, 3, "#283a40"),
  voxel(7.2, 7, 27, 1.2, 3, 3, "#283a40"),
  voxel(-9, -3, 14, 4, 11, 10, "#e5dfc9"),
  voxel(9, -3, 14, 4, 11, 10, "#eee9d5"),
  voxel(0, -12, 20, 10, 6, 8, "#e5dfc9"),
  voxel(-5, 0, 3, 3, 3, 6, "#e99a37"),
  voxel(5, 0, 3, 3, 3, 6, "#e99a37"),
  voxel(-5, 3, 2, 5, 8, 3, "#f5b442"),
  voxel(5, 3, 2, 5, 8, 3, "#f5b442"),
];

function Player() {
  const ref = useRef();
  useLayoutEffect(() => { playerState.ref = ref.current; return () => { playerState.ref = null; }; }, []);
  useFrame(({ clock }, delta) => {
    const player = ref.current;
    if (!player || document.hidden) return;
    const body = player.children[0];
    const status = useGameStore.getState().status;
    if (status === "over") {
      body.scale.z = THREE.MathUtils.damp(body.scale.z, 0.35, 14, delta);
      body.position.z = THREE.MathUtils.damp(body.position.z, 0, 14, delta);
      return;
    }
    if (!playerState.movesQueue.length) {
      body.scale.set(1, 1, reducedMotion ? 1 : 1 + Math.sin(clock.elapsedTime * 3) * 0.025);
      body.position.z = 0;
      return;
    }
    playerState.stepElapsed += Math.min(delta, 0.05);
    const progress = Math.min(1, playerState.stepElapsed / stepTime);
    const move = playerState.movesQueue[0];
    const next = calculateFinalPosition(playerState, [move]);
    player.position.x = THREE.MathUtils.lerp(playerState.currentTile * tileSize, next.tile * tileSize, progress);
    player.position.y = THREE.MathUtils.lerp(playerState.currentRow * tileSize, next.row * tileSize, progress);
    body.position.z = Math.sin(progress * Math.PI) * (reducedMotion ? 4 : 13);
    body.scale.z = 1 + Math.sin(progress * Math.PI) * 0.09;
    body.rotation.z = { forward: 0, backward: Math.PI, left: Math.PI / 2, right: -Math.PI / 2 }[move];
    if (progress >= 1) {
      playerState.stepElapsed = 0;
      body.position.z = 0;
      stepCompleted();
    }
  });
  return h("group", { ref }, h("group", null, h(Voxels, { boxes: chickenBoxes })));
}

function CameraRig() {
  const { camera, size } = useThree();
  const light = useRef();
  const target = useMemo(() => new THREE.Object3D(), []);
  const follow = useRef(new THREE.Vector3(0, 55, 0));
  const run = useGameStore((state) => state.run);
  useLayoutEffect(() => { follow.current.set(0, 55, 0); }, [run]);
  useLayoutEffect(() => {
    // Keep the chicken readable on phones, and frame the woodland on desktop.
    camera.zoom = Math.min(size.width / 820, size.height / 570) * (size.width < 600 ? 1.65 : 1);
    camera.updateProjectionMatrix();
  }, [camera, size]);
  useFrame((_, delta) => {
    const player = playerState.ref;
    if (!player) return;
    const aim = follow.current;
    const smoothing = reducedMotion ? 1 : 1 - Math.exp(-7 * Math.min(delta, 0.05));
    aim.x = THREE.MathUtils.lerp(aim.x, player.position.x * 0.8, smoothing);
    const titleLookAhead = size.width <= 650 && size.height <= 520 ? 70 : 135;
    const lookAhead = useGameStore.getState().status === "ready" ? titleLookAhead : 55;
    aim.y = THREE.MathUtils.lerp(aim.y, player.position.y + lookAhead, smoothing);
    camera.position.set(aim.x + 210, aim.y - 480, 560);
    camera.lookAt(aim.x, aim.y, 0);
    light.current.position.set(aim.x - 260, aim.y - 220, 470);
    target.position.set(aim.x, aim.y, 0);
    target.updateMatrixWorld();
  });
  return h(React.Fragment, null,
    h("primitive", { object: target }),
    h("directionalLight", {
      ref: light, target, intensity: 2.1, color: "#fff1d5", castShadow: true,
      "shadow-mapSize": [2048, 2048], "shadow-camera-left": -700, "shadow-camera-right": 700,
      "shadow-camera-top": 850, "shadow-camera-bottom": -650, "shadow-camera-near": 1,
      "shadow-camera-far": 1700, "shadow-normalBias": 0.8, "shadow-bias": -0.00015,
    }));
}

const emptyTrees = [];
const clearingTrees = [{ tileIndex: -7, height: 55 }, { tileIndex: 7, height: 66 }, { tileIndex: -5, height: 43 }];
function Map() {
  const rows = useMapStore((state) => state.rows);
  const currentRow = useGameStore((state) => state.row);
  const run = useGameStore((state) => state.run);
  const from = Math.max(-10, currentRow - 10);
  const to = currentRow + 19;
  const visible = [];
  for (let row = from; row <= to; row++) {
    if (row <= 0) visible.push(h(Grass, { key: row, rowIndex: row, trees: row % 3 === 0 ? clearingTrees : emptyTrees }));
    else {
      const data = rows[row - 1];
      if (!data) continue;
      visible.push(data.type === "forest"
        ? h(Grass, { key: `${run}-${row}`, rowIndex: row, trees: data.trees })
        : h(Road, { key: `${run}-${row}`, rowIndex: row, data }));
    }
  }
  return visible;
}

function Scene() {
  return h(Canvas, {
    orthographic: true, shadows: true, dpr: [1, 1.75],
    camera: { up: [0, 0, 1], position: [210, -425, 560], near: 1, far: 3000 },
    gl: { antialias: true, alpha: false, powerPreference: "high-performance" },
    onCreated: ({ gl }) => { gl.setClearColor("#91bb68"); gl.toneMapping = THREE.NoToneMapping; },
  }, h("ambientLight", { intensity: 1.15, color: "#d8edff" }),
  h(Player), h(Map), h(CameraRig));
}

function useControls() {
  useEffect(() => {
    const directions = { ArrowUp: "forward", w: "forward", ArrowDown: "backward", s: "backward", ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right" };
    function keyDown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const direction = directions[event.key];
      if (direction) { event.preventDefault(); queueMove(direction); }
      else if ((event.code === "Space" || event.key === "Enter") && event.target.tagName !== "BUTTON") {
        event.preventDefault();
        const game = useGameStore.getState();
        if (game.status === "over") game.reset();
        else if (game.status === "ready") game.start();
        else queueMove("forward");
      }
    }
    window.addEventListener("keydown", keyDown);
    return () => window.removeEventListener("keydown", keyDown);
  }, []);
}

function Controls() {
  const status = useGameStore((state) => state.status);
  return h("nav", { className: "controls", "aria-label": "Movement controls" },
    [["left", "←", "Move left"], ["forward", "↑", "Hop forward"], ["backward", "↓", "Move backward"], ["right", "→", "Move right"]].map(([direction, glyph, label]) =>
      h("button", { key: direction, type: "button", className: `control-${direction}`, "aria-label": label, disabled: status === "over", onClick: () => queueMove(direction) }, glyph)));
}

function Game() {
  useControls();
  const status = useGameStore((state) => state.status);
  const score = useGameStore((state) => state.score);
  const touchStart = useRef(null);
  function pointerDown(event) {
    if (event.target.tagName !== "CANVAS") return;
    touchStart.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function pointerUp(event) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || start.id !== event.pointerId) return;
    const x = event.clientX - start.x;
    const y = event.clientY - start.y;
    queueMove(Math.max(Math.abs(x), Math.abs(y)) < 18 ? "forward" : Math.abs(x) > Math.abs(y) ? (x > 0 ? "right" : "left") : y > 0 ? "backward" : "forward");
  }
  return h("main", { className: `game is-${status}`, onPointerDown: pointerDown, onPointerUp: pointerUp, onPointerCancel: () => { touchStart.current = null; } },
    h(Scene),
    h("header", { className: "hud" },
      h("div", { className: "score", "aria-label": `${score} lanes crossed` }, h("span", null, "LANES"), h("strong", { id: "score" }, String(score).padStart(2, "0"))),
      h("div", { className: "edition" }, h("span", null, "DAIVR ARCADE"), h("strong", null, "WOODLAND RUN"), h("i", null, "03"))),
    status === "ready" && h("section", { className: "title-screen", "aria-label": "Welcome to Cross Road" },
      h("p", { className: "eyebrow" }, "A LITTLE CHICKEN. A BIG ADVENTURE."),
      h("h1", null, h("span", null, "CROSS"), h("span", null, "ROAD")),
      h("p", { className: "tagline" }, "One more hop.")),
    status === "ready" && h("div", { className: "start-actions" },
      h("button", { className: "play-button", onClick: () => useGameStore.getState().start() }, "LET’S HOP", h("span", { "aria-hidden": true }, "↗")),
      h("p", { className: "start-hint" }, "PRESS SPACE OR TAP TO START")),
    status === "over" && h("section", { className: "result-container", "aria-label": "Run complete", "aria-live": "polite" },
      h("div", { className: "result" }, h("span", { className: "eyebrow" }, "END OF THE ROAD"),
        h("h1", null, "OH, CLUCK."), h("strong", { className: "final-score" }, score),
        h("p", null, `${score === 1 ? "LANE" : "LANES"} CROSSED`),
        h("button", { autoFocus: true, className: "play-button", onClick: () => useGameStore.getState().reset() }, "HOP AGAIN", h("span", { "aria-hidden": true }, "↗")),
        h("small", null, "THE OTHER SIDE IS STILL WAITING."))),
    h("footer", { className: "game-footer" },
      h("span", { className: "control-hint" }, h("b", null, "ONE HOP AT A TIME"), h("span", { className: "desktop-hint" }, "ARROWS / WASD TO MOVE"), h("span", { className: "touch-hint" }, "TAP TO HOP · SWIPE TO TURN")),
      h(Controls), h("span", { className: "route-tag" }, "TAKE THE", h("b", null, "SCENIC ROUTE"))));
}

function randomElement(array) { return array[Math.floor(Math.random() * array.length)]; }
function generateRows(amount, offset) {
  return Array.from({ length: amount }, (_, index) => {
    const row = offset + index + 1;
    const type = row === 1 || row === 4 ? "forest" : row === 2 || row === 3 ? "car" : randomElement(["car", "truck", "forest", "forest"]);
    if (type === "forest") {
      const occupied = new Set();
      const trees = [];
      while (trees.length < 4) {
        const tileIndex = THREE.MathUtils.randInt(minTileIndex, maxTileIndex);
        if (occupied.has(tileIndex) || (row === 1 && Math.abs(tileIndex) < 2)) continue;
        occupied.add(tileIndex);
        trees.push({ tileIndex, height: randomElement([42, 55, 68]) });
      }
      return { type, trees };
    }
    const occupied = new Set();
    const vehicles = [];
    const radius = type === "truck" ? 2 : 1;
    while (vehicles.length < (type === "truck" ? 2 : 3)) {
      const initialTileIndex = THREE.MathUtils.randInt(minTileIndex, maxTileIndex);
      if (occupied.has(initialTileIndex)) continue;
      for (let tile = initialTileIndex - radius; tile <= initialTileIndex + radius; tile++) occupied.add(tile);
      vehicles.push({ initialTileIndex, color: randomElement(palette.cars) });
    }
    return { type, direction: Math.random() > 0.5, speed: randomElement([125, 156, 188]), vehicles };
  });
}

createRoot(document.getElementById("root")).render(h(Game));
