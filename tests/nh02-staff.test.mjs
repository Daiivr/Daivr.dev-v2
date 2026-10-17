import assert from "node:assert/strict";
import { readHostAsset, hostAssetsAvailable } from "./host-asset-fixture.mjs";
import test from "node:test";
import * as THREE from "three";
import { VRMHumanoid } from "@pixiv/three-vrm";
import { attachNh02Staff } from "../src/lib/nh02Staff.js";

test("the staff follows the left palm through rotated and scaled avatar transforms", () => {
  const parent = new THREE.Group();
  parent.scale.setScalar(1.12);
  parent.position.set(1, 0.2, -2);
  const scene = new THREE.Group();
  scene.rotation.y = Math.PI;
  parent.add(scene);
  const hand = new THREE.Bone();
  hand.position.set(-0.4, 1, 0);
  scene.add(hand);
  const knuckle = new THREE.Bone();
  knuckle.position.set(-0.08, 0, 0);
  hand.add(knuckle);
  const rightHand = new THREE.Bone();
  rightHand.rotation.set(0.1, 0.2, 0.3);
  const unchanged = rightHand.quaternion.clone();
  const normalized = new Map();
  const vrm = { scene, humanoid: {
    getRawBoneNode: (name) => name === "leftHand" ? hand : name === "leftMiddleProximal" ? knuckle : null,
    getNormalizedBoneNode: (name) => {
      if (name.startsWith("right")) return rightHand;
      if (!normalized.has(name)) normalized.set(name, new THREE.Bone());
      return normalized.get(name);
    }
  } };
  const staff = attachNh02Staff(vrm, new THREE.Group());
  const holder = scene.getObjectByName("NH02_left_hand_staff");
  for (const angle of [0, 0.4, -0.8]) {
    hand.rotation.set(angle, angle / 2, angle / 3);
    staff.poseGrip();
    staff.update();
    const palm = hand.getWorldPosition(new THREE.Vector3()).lerp(knuckle.getWorldPosition(new THREE.Vector3()), 0.8);
    assert.ok(holder.getWorldPosition(new THREE.Vector3()).distanceTo(palm) < 1e-6);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(holder.getWorldQuaternion(new THREE.Quaternion()));
    assert.ok(up.y > 0.99, "staff stays upright as the arm moves");
  }
  assert.deepEqual(rightHand.quaternion.toArray(), unchanged.toArray());
  assert.ok(normalized.get("leftMiddleIntermediate").rotation.z > 1);
});

test("NH-02 and her staff together stay below 19 MiB", { skip: !hostAssetsAvailable }, () => {
  const total = ["nh02", "nh02-staff"].reduce((bytes, name) =>
    bytes + readHostAsset(name).length, 0);
  assert.ok(total < 19 * 1048576, `${(total / 1048576).toFixed(2)} MiB`);
});

test("NH-02's actual skeleton holds the staff in front while the right arm remains free", { skip: !hostAssetsAvailable }, () => {
  const file = readHostAsset("nh02");
  const data = JSON.parse(file.subarray(20, 20 + file.readUInt32LE(12)));
  const nodes = data.nodes.map((node) => {
    const bone = new THREE.Object3D();
    bone.position.fromArray(node.translation || [0, 0, 0]);
    bone.quaternion.fromArray(node.rotation || [0, 0, 0, 1]);
    bone.scale.fromArray(node.scale || [1, 1, 1]);
    return bone;
  });
  data.nodes.forEach((node, index) => node.children?.forEach((child) => nodes[index].add(nodes[child])));
  const scene = new THREE.Group();
  data.scenes[data.scene || 0].nodes.forEach((index) => scene.add(nodes[index]));
  // Match the loader's VRM 0 to VRM 1 thumb names.
  const thumbNames = {
    leftThumbProximal: "leftThumbMetacarpal", leftThumbIntermediate: "leftThumbProximal",
    rightThumbProximal: "rightThumbMetacarpal", rightThumbIntermediate: "rightThumbProximal"
  };
  const humanoid = new VRMHumanoid(Object.fromEntries(data.extensions.VRM.humanoid.humanBones.map((bone) => [thumbNames[bone.bone] || bone.bone, { node: nodes[bone.node] }])));
  scene.add(humanoid.normalizedHumanBonesRoot);
  scene.rotation.y = Math.PI;
  const staff = attachNh02Staff({ scene, humanoid }, new THREE.Group());
  const chest = humanoid.getNormalizedBoneNode("chest");
  const wrist = humanoid.getNormalizedBoneNode("leftHand");
  const rightArm = humanoid.getNormalizedBoneNode("rightUpperArm");
  for (const angle of [-0.3, 0, 0.3]) {
    chest.rotation.set(0, angle, angle / 2);
    rightArm.rotation.set(angle, 0.4, 0.7);
    const wave = rightArm.quaternion.clone();
    // Simulate the animation trying to swing the free arm behind her.
    humanoid.getNormalizedBoneNode("leftUpperArm").rotation.set(0, -0.8, 0.9);
    staff.poseGrip();
    humanoid.update();
    staff.update();
    const localHand = chest.worldToLocal(wrist.getWorldPosition(new THREE.Vector3()));
    assert.ok(localHand.z < -0.2, "hand stays ahead of the torso");
    assert.ok(Math.abs(localHand.x + 0.16) < 0.01);
    assert.ok(Math.abs(localHand.y + 0.1) < 0.01);
    assert.deepEqual(rightArm.quaternion.toArray(), wave.toArray());
    const joints = ["Proximal", "Intermediate", "Distal"].map((joint) =>
      humanoid.getRawBoneNode(`leftMiddle${joint}`).getWorldPosition(new THREE.Vector3()));
    const axis = joints[1].clone().sub(joints[0]).cross(joints[2].clone().sub(joints[0])).normalize();
    const holder = scene.getObjectByName("NH02_left_hand_staff");
    const staffAxis = new THREE.Vector3(0, 1, 0).applyQuaternion(holder.getWorldQuaternion(new THREE.Quaternion()));
    const wristAxis = new THREE.Vector3(0, 0, 1).applyQuaternion(wrist.getWorldQuaternion(new THREE.Quaternion()));
    assert.ok(wristAxis.dot(staffAxis) < -0.95, "the left wrist keeps its natural grip orientation instead of rolling outward");
    const forearmDirection = wrist.getWorldPosition(new THREE.Vector3()).sub(
      humanoid.getNormalizedBoneNode("leftLowerArm").getWorldPosition(new THREE.Vector3())
    ).normalize();
    const palmDirection = new THREE.Vector3(-1, 0, 0).applyQuaternion(wrist.getWorldQuaternion(new THREE.Quaternion()));
    assert.ok(palmDirection.dot(forearmDirection) > 0.9, "the palm continues along the forearm without bending backward");
    assert.ok(Math.abs(axis.dot(staffAxis)) > 0.95, "the finger curls around the staff axis");
    const center = holder.getWorldPosition(new THREE.Vector3());
    for (const finger of ["Index", "Middle", "Ring", "Little"]) {
      const points = ["Proximal", "Intermediate", "Distal"].map((joint) => {
        const offset = humanoid.getRawBoneNode(`left${finger}${joint}`).getWorldPosition(new THREE.Vector3()).sub(center);
        return offset.addScaledVector(staffAxis, -offset.dot(staffAxis));
      });
      for (const point of points) assert.ok(point.length() < 0.035, `${finger} stays close to the shaft`);
      for (let i = 1; i < points.length; i++) {
        const segment = new THREE.Line3(points[i - 1], points[i]);
        const clearance = segment.closestPointToPoint(new THREE.Vector3(), true, new THREE.Vector3()).length();
        assert.ok(clearance > 0.015, `${finger} wraps outside the shaft instead of passing through it`);
      }
    }
  }
});
