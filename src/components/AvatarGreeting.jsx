/* eslint-disable react/no-unknown-property */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { createVRMAnimationClip, VRMAnimationLoaderPlugin } from "@pixiv/three-vrm-animation";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const AVATAR_URL = "/models/dai-greeter-optimized.vrm";
const GREETING_URL = "/motions/greeting.vrma";
const REVEAL_TIME = 1.82;
// Reparto del medidor AVATAR LINK. Antes marcaba 100% al terminar la descarga,
// pero despues quedaban tres fases invisibles — compilar shaders, montar la
// escena y el arranque oculto de la animacion — asi que el contador llegaba al
// final y el anfitrion tardaba segundos en aparecer. Ahora cada tramo tiene su
// peso y el 100% cae exactamente cuando el avatar se ve.
const PROGRESS_DOWNLOAD = 86;
const PROGRESS_COMPILED = 96;
const PROGRESS_READY = 97;
const WAVE_LOOP_START = 5.33;
const WAVE_LOOP_END = 6.53;
const SOURCE_FPS = 60;
const WAVE_BLEND_DURATION = 0.28;

// Encuadre de la camara. El fov es vertical y fijo, asi que la altura de cuerpo
// visible la fija la distancia (span = 2 * dist * tan(fov/2)), no el tamano del
// lienzo: alargar la caja solo escalaba el mismo recorte. Con estos valores el
// plano va de ~0.30 a ~1.90 en unidades del VRM, o sea de bajo las rodillas a
// por encima de las orejas, y las piernas mueren en la barra inferior de la
// puerta en vez de cortarse en el aire.
const CAMERA_FOV = 25;
const CAMERA_DISTANCE = 3.61;
const CAMERA_HEIGHT = 1.24;
const CAMERA_TARGET_Y = 1.1;

function AvatarRig({ active, onError, onPhaseChange, onProgress, onReady, onReveal, reducedMotion }) {
  const { camera, gl, scene } = useThree();
  const [vrm, setVrm] = useState(null);
  const idleGroupRef = useRef(null);
  const mixerRef = useRef(null);
  const actionRef = useRef(null);
  const waveActionsRef = useRef([]);
  const waveDurationRef = useRef(0);
  const currentWaveIndexRef = useRef(0);
  const clipDurationRef = useRef(0);
  const phaseRef = useRef("concealed");
  const revealSentRef = useRef(false);
  const wasActiveRef = useRef(false);
  const onErrorRef = useRef(onError);
  const onPhaseChangeRef = useRef(onPhaseChange);
  const onProgressRef = useRef(onProgress);
  const onReadyRef = useRef(onReady);
  const onRevealRef = useRef(onReveal);

  onErrorRef.current = onError;
  onPhaseChangeRef.current = onPhaseChange;
  onProgressRef.current = onProgress;
  onReadyRef.current = onReady;
  onRevealRef.current = onReveal;

  useEffect(() => {
    let disposed = false;
    let loadedVrm = null;
    let animationScene = null;
    let mixer = null;

    const avatarLoader = new GLTFLoader();
    avatarLoader.register((parser) => new VRMLoaderPlugin(parser));

    const animationLoader = new GLTFLoader();
    animationLoader.register((parser) => new VRMAnimationLoaderPlugin(parser));

    async function loadAvatarAndGreeting() {
      try {
        // El VRM es el 94% de la descarga: su progreso alimenta el medidor
        // AVATAR LINK para que la espera deje de ser una barra inventada.
        const [avatarGltf, animationGltf] = await Promise.all([
          avatarLoader.loadAsync(AVATAR_URL, (event) => {
            if (disposed || !event.lengthComputable || !event.total) return;
            onProgressRef.current?.((event.loaded / event.total) * PROGRESS_DOWNLOAD);
          }),
          animationLoader.loadAsync(GREETING_URL)
        ]);

        if (!disposed) onProgressRef.current?.(PROGRESS_DOWNLOAD);
        const nextVrm = avatarGltf.userData.vrm;
        const vrmAnimation = animationGltf.userData.vrmAnimations?.[0];

        if (!nextVrm || !vrmAnimation) throw new Error("Avatar greeting assets are incomplete");

        VRMUtils.rotateVRM0(nextVrm);
        nextVrm.scene.traverse((object) => {
          object.frustumCulled = false;
        });

        const clip = createVRMAnimationClip(vrmAnimation, nextVrm);
        mixer = new THREE.AnimationMixer(nextVrm.scene);
        const firstWaveClip = THREE.AnimationUtils.subclip(
          clip,
          "continuous-wave-a",
          Math.round(WAVE_LOOP_START * SOURCE_FPS),
          Math.round(WAVE_LOOP_END * SOURCE_FPS),
          SOURCE_FPS
        );
        const secondWaveClip = firstWaveClip.clone();
        secondWaveClip.name = "continuous-wave-b";
        const action = mixer.clipAction(clip);
        const waveActions = [mixer.clipAction(firstWaveClip), mixer.clipAction(secondWaveClip)];
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        action.play();
        action.paused = true;
        waveActions.forEach((waveAction) => {
          waveAction.setLoop(THREE.LoopOnce, 1);
          waveAction.clampWhenFinished = true;
        });
        mixer.setTime(0);
        nextVrm.update(0);

        // Compile the avatar's shader variants while the canvas is still hidden.
        // compileAsync uses parallel shader compilation where the browser supports it.
        scene.add(nextVrm.scene);
        try {
          await gl.compileAsync(scene, camera);
        } finally {
          scene.remove(nextVrm.scene);
        }

        if (!disposed) onProgressRef.current?.(PROGRESS_COMPILED);

        if (disposed) {
          mixer.stopAllAction();
          VRMUtils.deepDispose(nextVrm.scene);
          VRMUtils.deepDispose(animationGltf.scene);
          return;
        }

        loadedVrm = nextVrm;
        animationScene = animationGltf.scene;
        mixerRef.current = mixer;
        actionRef.current = action;
        waveActionsRef.current = waveActions;
        waveDurationRef.current = firstWaveClip.duration;
        clipDurationRef.current = clip.duration;
        setVrm(nextVrm);
        onProgressRef.current?.(PROGRESS_READY);
        onReadyRef.current?.();
      } catch {
        if (!disposed) onErrorRef.current?.();
      }
    }

    loadAvatarAndGreeting();

    return () => {
      disposed = true;
      mixer?.stopAllAction();
      if (loadedVrm) {
        mixer?.uncacheRoot(loadedVrm.scene);
        VRMUtils.deepDispose(loadedVrm.scene);
      }
      if (animationScene) VRMUtils.deepDispose(animationScene);
      mixerRef.current = null;
      actionRef.current = null;
      waveActionsRef.current = [];
    };
  }, [camera, gl, scene]);

  useFrame((_, delta) => {
    const mixer = mixerRef.current;
    const action = actionRef.current;
    const waveActions = waveActionsRef.current;
    if (!vrm || !mixer || !action || waveActions.length !== 2) return;

    if (active && !wasActiveRef.current) {
      phaseRef.current = "concealed";
      revealSentRef.current = false;
      onPhaseChangeRef.current?.("concealed");
      mixer.stopAllAction();
      action.reset();
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.enabled = true;
      action.paused = false;
      action.play();

      if (reducedMotion) {
        mixer.setTime(clipDurationRef.current * 0.96);
        action.paused = true;
        phaseRef.current = "resting";
        revealSentRef.current = true;
        onProgressRef.current?.(100);
        onRevealRef.current?.();
        onPhaseChangeRef.current?.("resting");
      }
    } else if (!active && wasActiveRef.current) {
      action.paused = true;
      waveActions.forEach((waveAction) => {
        waveAction.paused = true;
      });
    }

    if (!reducedMotion && active) {
      mixer.update(delta);

      if (!revealSentRef.current) {
        // El saludo arranca oculto: ese tramo tambien es espera, asi que lo
        // cuenta el medidor en vez de dejarlo clavado en 97%.
        // Tope en 99: el 100% lo escribe solo el reveal, para que el contador
        // no cante el final unas decimas antes de que el avatar se vea.
        const preroll = Math.min(1, Math.max(0, action.time / REVEAL_TIME));
        onProgressRef.current?.(Math.min(99, PROGRESS_READY + (100 - PROGRESS_READY) * preroll));
      }

      if (!revealSentRef.current && action.time >= REVEAL_TIME) {
        revealSentRef.current = true;
        phaseRef.current = "greeting";
        onProgressRef.current?.(100);
        onRevealRef.current?.();
        onPhaseChangeRef.current?.("greeting");
      }

      if (phaseRef.current !== "waving" && action.time >= clipDurationRef.current - 0.08) {
        const waveAction = waveActions[0];
        waveAction.reset();
        waveAction.enabled = true;
        waveAction.setEffectiveTimeScale(1);
        waveAction.setEffectiveWeight(1);
        waveAction.play();
        action.crossFadeTo(waveAction, 0.42, true);
        currentWaveIndexRef.current = 0;
        phaseRef.current = "waving";
        onPhaseChangeRef.current?.("waving");
      }

      if (phaseRef.current === "waving") {
        const currentIndex = currentWaveIndexRef.current;
        const currentWave = waveActions[currentIndex];

        if (currentWave.time >= waveDurationRef.current - WAVE_BLEND_DURATION) {
          const nextIndex = currentIndex === 0 ? 1 : 0;
          const nextWave = waveActions[nextIndex];
          nextWave.stop();
          nextWave.reset();
          nextWave.enabled = true;
          nextWave.setEffectiveTimeScale(1);
          nextWave.setEffectiveWeight(1);
          nextWave.play();
          currentWave.crossFadeTo(nextWave, WAVE_BLEND_DURATION, false);
          currentWaveIndexRef.current = nextIndex;
        }
      }
    }

    if (idleGroupRef.current) {
      idleGroupRef.current.position.y = -0.05;
      idleGroupRef.current.rotation.x = 0;
      idleGroupRef.current.rotation.z = 0;
    }

    vrm.update(reducedMotion ? 0 : delta);
    wasActiveRef.current = active;
  });

  if (!vrm) return null;
  return (
    <group ref={idleGroupRef} position={[0, -0.05, 0]}>
      <primitive object={vrm.scene} dispose={null} />
    </group>
  );
}

export function AvatarGreeting({ active, displayName, onLoadProgress, onStage, lampOn = true }) {
  const [status, setStatus] = useState("loading");
  const [motionPhase, setMotionPhase] = useState("concealed");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const onLoadProgressRef = useRef(onLoadProgress);
  const onStageRef = useRef(onStage);
  const reportedPercentRef = useRef(-1);

  onLoadProgressRef.current = onLoadProgress;
  onStageRef.current = onStage;

  // El loader emite un evento por chunk; solo re-renderizamos cuando cambia el
  // entero que se pinta, para no repintar la escena decenas de veces por segundo.
  function reportProgress(value) {
    const percent = Math.round(value);
    if (percent === reportedPercentRef.current) return;
    reportedPercentRef.current = percent;
    onLoadProgressRef.current?.(percent);
  }

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(query.matches);
    updatePreference();
    query.addEventListener?.("change", updatePreference);
    return () => query.removeEventListener?.("change", updatePreference);
  }, []);

  // La puerta arranca su saludo cuando el anfitrion ya esta en pantalla, asi
  // que necesita la fase de la escena y no solo el porcentaje de descarga.
  const stage = status === "error"
    ? "error"
    : status !== "ready"
      ? "loading"
      : motionPhase === "waving"
        ? "waving"
        : revealed
          ? "greeting"
          : "arriving";

  useEffect(() => {
    onStageRef.current?.(stage);
  }, [stage]);

  return (
    <div className={`entry-avatar-scene is-${status} is-${motionPhase} ${revealed ? "is-revealed" : ""}`} aria-label={`3D avatar greeting ${displayName}`} role="img">
      <Canvas
        camera={{ fov: CAMERA_FOV, near: 0.1, far: 20, position: [0, CAMERA_HEIGHT, CAMERA_DISTANCE] }}
        dpr={[1, 1.5]}
        frameloop={reducedMotion ? "demand" : "always"}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        onCreated={({ camera, gl }) => {
          camera.lookAt(0, CAMERA_TARGET_Y, 0);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.setClearColor(0x000000, 0);
        }}
      >
        <ambientLight intensity={lampOn ? .65 : .55} />
        <directionalLight color="#f4fff8" intensity={lampOn ? .45 : 0} position={[1.5, 3.6, 3]} />
        <directionalLight color="#45d8ff" intensity={lampOn ? 1.35 : 1.2} position={[-3, 2.2, 1]} />
        <pointLight color="#ff3d9d" intensity={lampOn ? 3.5 : 3} position={[2, 1.25, 0.3]} distance={4.5} />
        <AvatarRig
          active={active}
          onError={() => setStatus("error")}
          onPhaseChange={setMotionPhase}
          onProgress={reportProgress}
          onReady={() => setStatus("ready")}
          onReveal={() => setRevealed(true)}
          reducedMotion={reducedMotion}
        />
      </Canvas>
      <div className="entry-avatar-scan" aria-hidden="true" />
    </div>
  );
}
