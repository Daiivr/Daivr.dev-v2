import * as THREE from "three";

// Bake clearance into Kiyosa's arm tracks, retaining the original palm wave.
export function giveKiyosaWaveClearance(vrm, clip, outfit = "default") {
  const upper = vrm.humanoid.getNormalizedBoneNode("rightUpperArm");
  const lower = vrm.humanoid.getNormalizedBoneNode("rightLowerArm");
  const wrist = vrm.humanoid.getNormalizedBoneNode("rightHand");
  if (!upper || !lower || !wrist) return;
  const mixer = new THREE.AnimationMixer(vrm.scene);
  const action = mixer.clipAction(clip);
  action.setLoop(THREE.LoopOnce, 1);
  action.clampWhenFinished = true;
  action.play();
  const ringRest = outfit === "summer" ? createRingRest(vrm.humanoid) : null;
  const bones = [upper, lower, wrist, ...(ringRest?.bones || [])];
  const animatedRotations = bones.map((bone) => bone.quaternion.clone());
  const values = bones.map(() => []);
  const times = [];
  const shoulder = new THREE.Vector3(), elbow = new THREE.Vector3(), hand = new THREE.Vector3();
  const target = new THREE.Vector3(), direction = new THREE.Vector3(), bend = new THREE.Vector3();
  const desiredElbow = new THREE.Vector3(), origin = new THREE.Vector3();
  const from = new THREE.Vector3(), to = new THREE.Vector3();
  const delta = new THREE.Quaternion(), world = new THREE.Quaternion(), parent = new THREE.Quaternion();
  const palmRotation = new THREE.Quaternion();
  const offset = new THREE.Vector3();
  function aim(bone, child, destination) {
    bone.getWorldPosition(origin);
    from.copy(child.getWorldPosition(from)).sub(origin).normalize();
    to.copy(destination).sub(origin).normalize();
    delta.setFromUnitVectors(from, to);
    bone.getWorldQuaternion(world).premultiply(delta);
    bone.parent.getWorldQuaternion(parent).invert();
    bone.quaternion.copy(parent.multiply(world));
    bone.updateWorldMatrix(false, true);
  }
  const frames = Math.ceil(clip.duration * 60);
  for (let frame = 0; frame <= frames; frame++) {
    const time = Math.min(frame / 60, clip.duration);
    bones.forEach((bone, index) => bone.quaternion.copy(animatedRotations[index]));
    mixer.setTime(time);
    bones.forEach((bone, index) => animatedRotations[index].copy(bone.quaternion));
    vrm.scene.updateWorldMatrix(true, true);
    upper.getWorldPosition(shoulder);
    lower.getWorldPosition(elbow);
    wrist.getWorldPosition(hand);
    wrist.getWorldQuaternion(palmRotation);
    // VRM 0 faces local -Z; +X is her right, away from her cheek.
    offset.set(0.10, 0, -0.10).applyQuaternion(vrm.scene.getWorldQuaternion(world));
    target.copy(hand).add(offset);
    const arm = shoulder.distanceTo(elbow), forearm = elbow.distanceTo(hand);
    direction.copy(target).sub(shoulder);
    const distance = THREE.MathUtils.clamp(direction.length(), Math.abs(arm - forearm) + 1e-4, arm + forearm - 1e-4);
    direction.normalize();
    target.copy(shoulder).addScaledVector(direction, distance);
    bend.copy(elbow).sub(shoulder);
    bend.addScaledVector(direction, -bend.dot(direction)).normalize();
    const along = (arm * arm - forearm * forearm + distance * distance) / (2 * distance);
    desiredElbow.copy(shoulder).addScaledVector(direction, along).addScaledVector(bend, Math.sqrt(Math.max(0, arm * arm - along * along)));
    aim(upper, lower, desiredElbow);
    aim(lower, wrist, target);
    wrist.parent.getWorldQuaternion(parent).invert();
    wrist.quaternion.copy(parent.multiply(palmRotation));
    ringRest?.pose();
    times.push(time);
    bones.forEach((bone, index) => bone.quaternion.toArray(values[index], values[index].length));
  }
  mixer.stopAllAction();
  mixer.uncacheRoot(vrm.scene);
  const names = bones.map((bone) => `${bone.name}.quaternion`);
  clip.tracks = clip.tracks.filter((track) => !names.includes(track.name));
  names.forEach((name, index) => clip.tracks.push(new THREE.QuaternionKeyframeTrack(name, times, values[index])));
}

function createRingRest(humanoid) {
  const hips = humanoid.getNormalizedBoneNode("hips");
  const upper = humanoid.getNormalizedBoneNode("leftUpperArm");
  const lower = humanoid.getNormalizedBoneNode("leftLowerArm");
  const wrist = humanoid.getNormalizedBoneNode("leftHand");
  if (!hips || !upper || !lower || !wrist) return null;
  const fingers = ["Index", "Middle", "Ring", "Little"].flatMap((finger, fingerIndex) =>
    ["Proximal", "Intermediate", "Distal"].map((joint, index) => ({
      bone: humanoid.getNormalizedBoneNode(`left${finger}${joint}`),
      curl: [0.12, 0.3, 0.22][index] + fingerIndex * 0.025
    }))
  ).filter(({ bone }) => bone);
  const thumb = ["Metacarpal", "Proximal", "Distal"].map((joint) => humanoid.getNormalizedBoneNode(`leftThumb${joint}`)).filter(Boolean);
  const shoulder = new THREE.Vector3(), elbow = new THREE.Vector3(), hand = new THREE.Vector3();
  const target = new THREE.Vector3(), pole = new THREE.Vector3(), direction = new THREE.Vector3();
  const bend = new THREE.Vector3(), desiredElbow = new THREE.Vector3();
  const origin = new THREE.Vector3(), from = new THREE.Vector3(), to = new THREE.Vector3();
  const delta = new THREE.Quaternion(), world = new THREE.Quaternion(), parent = new THREE.Quaternion();
  // Palm down, fingers forward over the front of the ring.
  const palm = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
  function aim(bone, child, destination) {
    bone.getWorldPosition(origin);
    from.copy(child.getWorldPosition(from)).sub(origin).normalize();
    to.copy(destination).sub(origin).normalize();
    delta.setFromUnitVectors(from, to);
    bone.getWorldQuaternion(world).premultiply(delta);
    bone.parent.getWorldQuaternion(parent).invert();
    bone.quaternion.copy(parent.multiply(world));
    bone.updateWorldMatrix(false, true);
  }
  return {
    bones: [upper, lower, wrist, ...fingers.map(({ bone }) => bone), ...thumb],
    pose() {
      hips.updateWorldMatrix(true, true);
      upper.getWorldPosition(shoulder);
      lower.getWorldPosition(elbow);
      wrist.getWorldPosition(hand);
      // The ring is entirely weighted to Hips: anchor the rest to the same
      // bone so the palm follows its tilt through the whole greeting.
      hips.localToWorld(target.set(-0.20, 0.11, -0.18));
      hips.localToWorld(pole.set(-0.30, 0.03, 0.03));
      const arm = shoulder.distanceTo(elbow), forearm = elbow.distanceTo(hand);
      direction.copy(target).sub(shoulder);
      const distance = THREE.MathUtils.clamp(direction.length(), Math.abs(arm - forearm) + 1e-4, arm + forearm - 1e-4);
      direction.normalize();
      target.copy(shoulder).addScaledVector(direction, distance);
      bend.copy(pole).sub(shoulder);
      bend.addScaledVector(direction, -bend.dot(direction)).normalize();
      const along = (arm * arm - forearm * forearm + distance * distance) / (2 * distance);
      desiredElbow.copy(shoulder).addScaledVector(direction, along).addScaledVector(bend, Math.sqrt(Math.max(0, arm * arm - along * along)));
      aim(upper, lower, desiredElbow);
      aim(lower, wrist, target);
      hips.getWorldQuaternion(world).multiply(palm);
      wrist.parent.getWorldQuaternion(parent).invert();
      wrist.quaternion.copy(parent.multiply(world));
      fingers.forEach(({ bone, curl }) => bone.rotation.set(0, 0, curl));
      thumb.forEach((bone, index) => bone.rotation.set(0, index === 0 ? 0.35 : 0.1, 0.2));
    }
  };
}
