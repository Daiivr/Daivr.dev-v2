import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { giveKiyosaWaveClearance } from "../src/lib/kiyosaWave.js";

test("Kiyosa's wave moves outward and forward without stretching or accumulating offsets", () => {
  const scene = new THREE.Group();
  scene.rotation.y = Math.PI;
  const upper = new THREE.Bone(), lower = new THREE.Bone(), wrist = new THREE.Bone();
  upper.name = "upper"; lower.name = "lower"; wrist.name = "wrist";
  scene.add(upper); upper.add(lower); lower.add(wrist);
  upper.position.y = 1;
  lower.position.x = 0.3; wrist.position.x = 0.25;
  upper.rotation.z = -0.8; lower.rotation.z = 2;
  const bones = { rightUpperArm: upper, rightLowerArm: lower, rightHand: wrist };
  const clip = new THREE.AnimationClip("wave", 1, [upper, lower, wrist].map((bone) =>
    new THREE.QuaternionKeyframeTrack(`${bone.name}.quaternion`, [0, 1], [...bone.quaternion.toArray(), ...bone.quaternion.toArray()])
  ));
  scene.updateWorldMatrix(true, true);
  const originalHand = wrist.getWorldPosition(new THREE.Vector3());
  const originalPalm = wrist.getWorldQuaternion(new THREE.Quaternion());
  const expected = originalHand.clone().add(new THREE.Vector3(-0.1, 0, 0.1));
  giveKiyosaWaveClearance({ scene, humanoid: { getNormalizedBoneNode: (name) => bones[name] } }, clip);
  const mixer = new THREE.AnimationMixer(scene);
  mixer.clipAction(clip).play();
  for (const time of [0, 0.25, 0.5, 0.9]) {
    mixer.setTime(time);
    scene.updateWorldMatrix(true, true);
    assert.ok(wrist.getWorldPosition(new THREE.Vector3()).distanceTo(expected) < 1e-6);
    assert.ok(wrist.getWorldQuaternion(new THREE.Quaternion()).angleTo(originalPalm) < 1e-6);
    assert.equal(lower.position.length(), 0.3);
    assert.equal(wrist.position.length(), 0.25);
  }
});

test("the summer hand rest follows the ring's hips bone through motion", () => {
  const scene = new THREE.Group();
  scene.rotation.y = Math.PI;
  const hips = new THREE.Bone(); hips.name = "hips"; hips.position.y = 0.82;
  scene.add(hips);
  const bones = { hips };
  for (const side of ["left", "right"]) {
    const sign = side === "left" ? -1 : 1;
    const upper = new THREE.Bone(), lower = new THREE.Bone(), hand = new THREE.Bone();
    upper.name = `${side}UpperArm`; lower.name = `${side}LowerArm`; hand.name = `${side}Hand`;
    upper.position.set(sign * 0.12, 0.4, 0);
    lower.position.x = sign * 0.2; hand.position.x = sign * 0.22;
    upper.rotation.z = sign * -0.8; lower.rotation.z = sign * 2;
    hips.add(upper); upper.add(lower); lower.add(hand);
    Object.assign(bones, { [upper.name]: upper, [lower.name]: lower, [hand.name]: hand });
  }
  const hipEnd = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1, 0.3, -0.2));
  const clip = new THREE.AnimationClip("greeting", 1, Object.values(bones).map((bone) =>
    new THREE.QuaternionKeyframeTrack(`${bone.name}.quaternion`, [0, 1], [...bone.quaternion.toArray(), ...(bone === hips ? hipEnd : bone.quaternion).toArray()])
  ));
  const original = clip.clone();
  const vrm = { scene, humanoid: { getNormalizedBoneNode: (name) => bones[name] } };
  giveKiyosaWaveClearance(vrm, clip, "summer");
  const mixer = new THREE.AnimationMixer(scene);
  mixer.clipAction(clip).play();
  for (const time of [0, 0.25, 0.5, 0.9]) {
    mixer.setTime(time);
    scene.updateWorldMatrix(true, true);
    const target = hips.localToWorld(new THREE.Vector3(-0.20, 0.11, -0.18));
    assert.ok(bones.leftHand.getWorldPosition(new THREE.Vector3()).distanceTo(target) < 1e-6);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(bones.leftHand.getWorldQuaternion(new THREE.Quaternion()));
    assert.ok(up.distanceTo(new THREE.Vector3(0, 1, 0).applyQuaternion(hips.getWorldQuaternion(new THREE.Quaternion()))) < 1e-6);
    assert.equal(bones.leftLowerArm.position.length(), 0.2);
    assert.equal(bones.leftHand.position.length(), 0.22);
  }
  mixer.stopAllAction();
  const defaultClip = original.clone();
  giveKiyosaWaveClearance(vrm, defaultClip, "default");
  for (const track of original.tracks.filter((track) => track.name.startsWith("left"))) {
    assert.deepEqual(defaultClip.tracks.find((entry) => entry.name === track.name).values, track.values);
  }
});
