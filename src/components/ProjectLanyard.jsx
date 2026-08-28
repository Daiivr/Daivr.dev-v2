/* eslint-disable react/no-unknown-property */
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, extend, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF, useTexture } from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import * as THREE from "three";
import cardModel from "../assets/lanyard/card.glb";

extend({ MeshLineGeometry, MeshLineMaterial });

const FRONT_UV_RECT = { x: 0, y: 0, width: 0.5, height: 0.755 };
const BACK_UV_RECT = { x: 0.5, y: 0, width: 0.5, height: 0.757 };
const ROPE_SEGMENT_LENGTH = 1.35;
const ARTWORK_WIDTH = 768;
const ARTWORK_HEIGHT = 1080;
const TEXTURE_SCALE = 2;

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function drawContainedImage(context, image, x, y, width, height) {
  if (!image?.width || !image?.height) return;
  const scale = Math.min(width / image.width, height / image.height);
  const renderWidth = image.width * scale;
  const renderHeight = image.height * scale;
  context.drawImage(
    image,
    x + (width - renderWidth) / 2,
    y + (height - renderHeight) / 2,
    renderWidth,
    renderHeight
  );
}

function createArtworkSurface(accent) {
  const canvas = document.createElement("canvas");
  canvas.width = ARTWORK_WIDTH * TEXTURE_SCALE;
  canvas.height = ARTWORK_HEIGHT * TEXTURE_SCALE;
  const context = canvas.getContext("2d");

  context.scale(TEXTURE_SCALE, TEXTURE_SCALE);

  context.fillStyle = "#020604";
  context.fillRect(0, 0, ARTWORK_WIDTH, ARTWORK_HEIGHT);

  const glow = context.createRadialGradient(560, 270, 24, 560, 270, 540);
  glow.addColorStop(0, `${accent}38`);
  glow.addColorStop(1, "#02060400");
  context.fillStyle = glow;
  context.fillRect(0, 0, ARTWORK_WIDTH, ARTWORK_HEIGHT);

  context.strokeStyle = "rgba(63, 255, 151, 0.1)";
  context.lineWidth = 2;
  for (let x = 0; x <= ARTWORK_WIDTH; x += 48) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, ARTWORK_HEIGHT);
    context.stroke();
  }
  for (let y = 0; y <= ARTWORK_HEIGHT; y += 48) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(ARTWORK_WIDTH, y);
    context.stroke();
  }

  context.fillStyle = accent;
  context.fillRect(0, 0, ARTWORK_WIDTH, 22);
  context.fillRect(0, ARTWORK_HEIGHT - 18, ARTWORK_WIDTH, 18);
  context.fillStyle = "#45d8ff";
  context.fillRect(0, 22, 180, 8);

  context.strokeStyle = "rgba(69, 216, 255, 0.66)";
  context.lineWidth = 4;
  context.strokeRect(34, 48, ARTWORK_WIDTH - 68, ARTWORK_HEIGHT - 92);

  return { canvas, context };
}

function createBadgeArtwork(project, logoImage) {
  const accent = project.visual === "tradedex" ? "#ff3d9d" : "#3fff97";
  const { canvas, context } = createArtworkSurface(accent);

  context.fillStyle = "#b4ffcf";
  context.font = "900 34px 'JetBrains Mono', monospace";
  context.fillText(`PROJECT // ${project.kicker}`, 66, 112);
  context.fillStyle = "rgba(180, 255, 207, 0.58)";
  context.font = "800 27px 'JetBrains Mono', monospace";
  context.fillText("DAI.EXE ACCESS BADGE", 66, 158);

  drawContainedImage(context, logoImage, 98, 220, 572, 390);

  context.fillStyle = "#f4fff8";
  context.font = "900 66px Orbitron, sans-serif";
  context.fillText(project.title.toUpperCase(), 66, 756, 630);

  context.fillStyle = accent;
  context.font = "900 28px 'JetBrains Mono', monospace";
  context.fillText(project.channel.toUpperCase(), 66, 815, 630);

  context.fillStyle = "rgba(180, 255, 207, 0.82)";
  context.font = "800 27px 'JetBrains Mono', monospace";
  context.fillText(project.tags.slice(0, 3).join("  //  ").toUpperCase(), 66, 885, 630);

  context.fillStyle = "#45d8ff";
  context.fillRect(66, 930, 16, 16);
  context.fillStyle = "#b4ffcf";
  context.font = "900 27px 'JetBrains Mono', monospace";
  context.fillText("PROJECT SIGNAL ONLINE", 100, 951);

  return canvas;
}

function createBackBadgeArtwork(siteLogoImage) {
  const { canvas, context } = createArtworkSurface("#3fff97");

  context.fillStyle = "#b4ffcf";
  context.font = "900 30px 'JetBrains Mono', monospace";
  context.textAlign = "center";
  context.fillText("DAIVR.DEV // REACT CABINET", ARTWORK_WIDTH / 2, 132);

  context.save();
  context.imageSmoothingEnabled = false;
  drawContainedImage(context, siteLogoImage, 184, 245, 400, 390);
  context.restore();

  context.fillStyle = "#f4fff8";
  context.font = "900 86px Orbitron, sans-serif";
  context.fillText("DAIVR", ARTWORK_WIDTH / 2, 770);

  context.fillStyle = "#45d8ff";
  context.font = "900 30px 'JetBrains Mono', monospace";
  context.fillText("PERSONAL ACCESS BADGE", ARTWORK_WIDTH / 2, 834);

  context.strokeStyle = "rgba(255, 61, 157, 0.72)";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(162, 884);
  context.lineTo(606, 884);
  context.stroke();

  context.fillStyle = "rgba(180, 255, 207, 0.82)";
  context.font = "800 26px 'JetBrains Mono', monospace";
  context.fillText("DAI.EXE // SIGNAL ONLINE", ARTWORK_WIDTH / 2, 946);

  context.textAlign = "start";
  return canvas;
}

function drawAtlasFace(context, image, rect, atlasWidth, atlasHeight) {
  const x = rect.x * atlasWidth;
  const y = rect.y * atlasHeight;
  const width = rect.width * atlasWidth;
  const height = rect.height * atlasHeight;
  const scale = Math.max(width / image.width, height / image.height);
  const renderWidth = image.width * scale;
  const renderHeight = image.height * scale;

  context.save();
  context.beginPath();
  context.rect(x, y, width, height);
  context.clip();
  context.drawImage(
    image,
    x + (width - renderWidth) / 2,
    y + (height - renderHeight) / 2,
    renderWidth,
    renderHeight
  );
  context.restore();
}

function createCardMap(baseMap, frontArtwork, backArtwork) {
  const baseImage = baseMap.image;
  const canvas = document.createElement("canvas");
  canvas.width = baseImage.width * TEXTURE_SCALE;
  canvas.height = baseImage.height * TEXTURE_SCALE;
  const context = canvas.getContext("2d");

  context.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
  drawAtlasFace(context, frontArtwork, FRONT_UV_RECT, canvas.width, canvas.height);
  drawAtlasFace(context, backArtwork, BACK_UV_RECT, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = baseMap.flipY;
  texture.anisotropy = 16;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function createSiteStrapTexture(logoImage) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const context = canvas.getContext("2d");

  context.fillStyle = "#020604";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#3fff97";
  context.fillRect(0, 0, canvas.width, 14);
  context.fillStyle = "#45d8ff";
  context.fillRect(0, canvas.height - 14, canvas.width, 14);
  context.strokeStyle = "rgba(255, 61, 157, 0.72)";
  context.lineWidth = 7;
  for (let x = -60; x < canvas.width + 100; x += 94) {
    context.beginPath();
    context.moveTo(x, 22);
    context.lineTo(x + 62, canvas.height - 22);
    context.stroke();
  }

  context.imageSmoothingEnabled = false;
  drawContainedImage(context, logoImage, 420, 28, 184, 184);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}

export default function ProjectLanyard({ project }) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
  const [webglAvailable] = useState(supportsWebGL);

  useEffect(() => {
    const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const updateViewport = () => setIsMobile(window.innerWidth < 768);
    const updateMotion = () => setReducedMotion(Boolean(motionQuery?.matches));

    window.addEventListener("resize", updateViewport);
    motionQuery?.addEventListener?.("change", updateMotion);
    return () => {
      window.removeEventListener("resize", updateViewport);
      motionQuery?.removeEventListener?.("change", updateMotion);
    };
  }, []);

  if (!webglAvailable || reducedMotion) {
    return (
      <div className={`project-lanyard-static is-${project.visual}`}>
        <span>PROJECT // {project.kicker}</span>
        <img src={project.image} alt="" aria-hidden="true" />
        <strong>{project.title}</strong>
        <small>{reducedMotion ? "motion-safe badge" : "static graphics fallback"}</small>
      </div>
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 30], fov: 8.8 }}
      dpr={[1, isMobile ? 1.5 : 2]}
      gl={{ alpha: true }}
      onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x020604), 0)}
    >
      <ambientLight intensity={Math.PI} />
      <Suspense fallback={null}>
        <Physics gravity={[0, -26, 0]} timeStep={isMobile ? 1 / 30 : 1 / 60}>
          <Band project={project} isMobile={isMobile} />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer intensity={2} color="#b4ffcf" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="#45d8ff" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="#ff3d9d" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        </Environment>
      </Suspense>
    </Canvas>
  );
}

function Band({ project, isMobile }) {
  const bandRef = useRef(null);
  const fixedRef = useRef(null);
  const jointOneRef = useRef(null);
  const jointTwoRef = useRef(null);
  const jointThreeRef = useRef(null);
  const cardRef = useRef(null);
  const [dragged, setDragged] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [curve] = useState(
    () => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()])
  );
  const { nodes, materials } = useGLTF(cardModel);
  const logoTexture = useTexture(project.image);
  const siteLogoTexture = useTexture("/favicon.png");
  const frontArtwork = useMemo(() => createBadgeArtwork(project, logoTexture.image), [project, logoTexture.image]);
  const backArtwork = useMemo(() => createBackBadgeArtwork(siteLogoTexture.image), [siteLogoTexture.image]);
  const cardMap = useMemo(
    () => createCardMap(materials.base.map, frontArtwork, backArtwork),
    [backArtwork, frontArtwork, materials.base.map]
  );
  const strapTexture = useMemo(() => createSiteStrapTexture(siteLogoTexture.image), [siteLogoTexture.image]);
  const pointerVector = useMemo(() => new THREE.Vector3(), []);
  const directionVector = useMemo(() => new THREE.Vector3(), []);
  const angularVelocity = useMemo(() => new THREE.Vector3(), []);
  const rotation = useMemo(() => new THREE.Vector3(), []);
  const segmentProps = {
    type: "dynamic",
    canSleep: true,
    colliders: false,
    angularDamping: 4,
    linearDamping: 4
  };

  useRopeJoint(fixedRef, jointOneRef, [[0, 0, 0], [0, 0, 0], ROPE_SEGMENT_LENGTH]);
  useRopeJoint(jointOneRef, jointTwoRef, [[0, 0, 0], [0, 0, 0], ROPE_SEGMENT_LENGTH]);
  useRopeJoint(jointTwoRef, jointThreeRef, [[0, 0, 0], [0, 0, 0], ROPE_SEGMENT_LENGTH]);
  useSphericalJoint(jointThreeRef, cardRef, [[0, 0, 0], [0, 1.5, 0]]);

  useEffect(() => {
    if (!hovered) return undefined;
    document.body.style.cursor = dragged ? "grabbing" : "grab";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (dragged && cardRef.current) {
      pointerVector.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      directionVector.copy(pointerVector).sub(state.camera.position).normalize();
      pointerVector.add(directionVector.multiplyScalar(state.camera.position.length()));
      [cardRef, jointOneRef, jointTwoRef, jointThreeRef, fixedRef].forEach((ref) => ref.current?.wakeUp());
      cardRef.current.setNextKinematicTranslation({
        x: pointerVector.x - dragged.x,
        y: pointerVector.y - dragged.y,
        z: pointerVector.z - dragged.z
      });
    }

    const one = jointOneRef.current;
    const two = jointTwoRef.current;
    const three = jointThreeRef.current;
    const fixed = fixedRef.current;
    const card = cardRef.current;
    if (!one || !two || !three || !fixed || !card || !bandRef.current) return;

    [one, two].forEach((body) => {
      if (!body.lerped) body.lerped = new THREE.Vector3().copy(body.translation());
      const clampedDistance = Math.max(0.1, Math.min(1, body.lerped.distanceTo(body.translation())));
      body.lerped.lerp(body.translation(), delta * clampedDistance * 50);
    });

    curve.points[0].copy(three.translation());
    curve.points[1].copy(two.lerped);
    curve.points[2].copy(one.lerped);
    curve.points[3].copy(fixed.translation());
    bandRef.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));

    angularVelocity.copy(card.angvel());
    rotation.copy(card.rotation());
    card.setAngvel({
      x: angularVelocity.x,
      y: angularVelocity.y - rotation.y * 0.25,
      z: angularVelocity.z
    });
  });

  curve.curveType = "chordal";

  return (
    <>
      <group position={[0, 5.25, 0]}>
        <RigidBody ref={fixedRef} {...segmentProps} type="fixed" />
        <RigidBody position={[0.02, -0.52, 0]} ref={jointOneRef} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[0.05, -1.04, 0]} ref={jointTwoRef} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[0.08, -1.56, 0]} ref={jointThreeRef} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[0.1, -2.85, 0]} ref={cardRef} {...segmentProps} type={dragged ? "kinematicPosition" : "dynamic"}>
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onPointerUp={(event) => {
              event.target.releasePointerCapture(event.pointerId);
              setDragged(false);
            }}
            onPointerDown={(event) => {
              event.target.setPointerCapture(event.pointerId);
              setDragged(new THREE.Vector3().copy(event.point).sub(pointerVector.copy(cardRef.current.translation())));
            }}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={cardMap}
                map-anisotropy={16}
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.15}
                roughness={0.9}
                metalness={0.8}
              />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={bandRef}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          lineWidth={1.25}
          map={strapTexture}
          repeat={[-4, 1]}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          transparent
          useMap
        />
      </mesh>
    </>
  );
}

useGLTF.preload(cardModel);
