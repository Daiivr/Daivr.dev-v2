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
const WAVE_LOOP_START = 5.33;
const WAVE_LOOP_END = 6.53;
const SOURCE_FPS = 60;
const WAVE_BLEND_DURATION = 0.28;

function AvatarRig({ active, onError, onPhaseChange, onReady, onReveal, reducedMotion }) {
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
  const onReadyRef = useRef(onReady);
  const onRevealRef = useRef(onReveal);

  onErrorRef.current = onError;
  onPhaseChangeRef.current = onPhaseChange;
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
        const [avatarGltf, animationGltf] = await Promise.all([
          avatarLoader.loadAsync(AVATAR_URL),
          animationLoader.loadAsync(GREETING_URL)
        ]);
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

      if (!revealSentRef.current && action.time >= REVEAL_TIME) {
        revealSentRef.current = true;
        phaseRef.current = "greeting";
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

export function AvatarGreeting({ active, displayName }) {
  const [status, setStatus] = useState("loading");
  const [motionPhase, setMotionPhase] = useState("concealed");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(query.matches);
    updatePreference();
    query.addEventListener?.("change", updatePreference);
    return () => query.removeEventListener?.("change", updatePreference);
  }, []);

  const statusCopy = status === "loading"
    ? "syncing avatar + greeting"
    : status === "error"
      ? "avatar signal unavailable"
      : motionPhase === "waving"
        ? "wave signal looping"
        : motionPhase === "resting"
          ? "greeting pose linked"
        : motionPhase === "greeting"
          ? "surprise greeting online"
          : "surprise sequence armed";

  return (
    <div className={`entry-avatar-scene is-${status} is-${motionPhase} ${revealed ? "is-revealed" : ""}`} aria-label={`3D avatar greeting ${displayName}`} role="img">
      <Canvas
        camera={{ fov: 25, near: 0.1, far: 20, position: [0, 1.32, 3.15] }}
        dpr={[1, 1.5]}
        frameloop={reducedMotion ? "demand" : "always"}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        onCreated={({ camera, gl }) => {
          camera.lookAt(0, 1.25, 0);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.setClearColor(0x000000, 0);
        }}
      >
        <ambientLight intensity={1.65} />
        <directionalLight color="#f4fff8" intensity={2.4} position={[1.5, 3.6, 3]} />
        <directionalLight color="#45d8ff" intensity={2.7} position={[-3, 2.2, 1]} />
        <pointLight color="#ff3d9d" intensity={7} position={[2, 1.25, 0.3]} distance={4.5} />
        <AvatarRig
          active={active}
          onError={() => setStatus("error")}
          onPhaseChange={setMotionPhase}
          onReady={() => setStatus("ready")}
          onReveal={() => setRevealed(true)}
          reducedMotion={reducedMotion}
        />
      </Canvas>
      <div className="entry-avatar-scan" aria-hidden="true" />
      <div className="entry-avatar-status" aria-hidden="true">
        <i />
        <span>{statusCopy}</span>
      </div>
      {status !== "ready" ? (
        <div className="entry-avatar-fallback" aria-hidden="true">
          <div className="entry-avatar-link">
            <span className="entry-avatar-link-bars"><i /><i /><i /><i /><i /></span>
            <strong>{status === "error" ? "HOST OFFLINE" : "AVATAR LINK"}</strong>
            <small>{status === "error" ? "manual greeting ready" : "acquiring host signal"}</small>
          </div>
        </div>
      ) : null}
    </div>
  );
}
