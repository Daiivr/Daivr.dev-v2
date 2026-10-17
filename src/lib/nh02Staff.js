import * as THREE from "three";

// The greeting waves with the right hand. Keep the staff in the left palm,
// in front of the torso, with the left arm bent and fingers around the shaft.
function createFrontHold(humanoid) {
  const chest = humanoid.getNormalizedBoneNode("upperChest") || humanoid.getNormalizedBoneNode("chest");
  const upper = humanoid.getNormalizedBoneNode("leftUpperArm");
  const lower = humanoid.getNormalizedBoneNode("leftLowerArm");
  const wrist = humanoid.getNormalizedBoneNode("leftHand");
  if (!chest || !upper || !lower || !wrist) return () => {};
  const shoulder = new THREE.Vector3(), elbow = new THREE.Vector3(), hand = new THREE.Vector3();
  const target = new THREE.Vector3(), pole = new THREE.Vector3(), direction = new THREE.Vector3();
  const bend = new THREE.Vector3(), desiredElbow = new THREE.Vector3();
  const from = new THREE.Vector3(), to = new THREE.Vector3(), origin = new THREE.Vector3();
  const delta = new THREE.Quaternion(), world = new THREE.Quaternion(), parent = new THREE.Quaternion();
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
  return () => {
    chest.updateWorldMatrix(true, true);
    upper.getWorldPosition(shoulder);
    lower.getWorldPosition(elbow);
    wrist.getWorldPosition(hand);
    const arm = shoulder.distanceTo(elbow), forearm = elbow.distanceTo(hand);
    if (arm < 1e-5 || forearm < 1e-5) return;
    // NH-02's VRM 0 faces local -Z. Place her palm ahead of the upper waist,
    // following the animated torso instead of the clip's swinging free arm.
    target.set(-0.16, -0.10, -0.30);
    chest.localToWorld(target);
    // Let the elbow drop beside the waist so the forearm approaches the
    // upright grip from behind, rather than pushing down into a bent wrist.
    pole.set(-0.35, -0.35, 0.00);
    chest.localToWorld(pole);
    direction.copy(target).sub(shoulder);
    const distance = THREE.MathUtils.clamp(direction.length(), Math.abs(arm - forearm) + 1e-4, arm + forearm - 1e-4);
    direction.normalize();
    target.copy(shoulder).addScaledVector(direction, distance);
    bend.copy(pole).sub(shoulder);
    bend.addScaledVector(direction, -bend.dot(direction)).normalize();
    const along = (arm * arm - forearm * forearm + distance * distance) / (2 * distance);
    const outward = Math.sqrt(Math.max(0, arm * arm - along * along));
    desiredElbow.copy(shoulder).addScaledVector(direction, along).addScaledVector(bend, outward);
    aim(upper, lower, desiredElbow);
    aim(lower, wrist, target);
  };
}

export function attachNh02Staff(vrm, staffScene) {
  const hand = vrm.humanoid.getRawBoneNode("leftHand");
  const knuckle = vrm.humanoid.getRawBoneNode("leftMiddleProximal");
  const middleJoint = vrm.humanoid.getRawBoneNode("leftMiddleIntermediate");
  const lastJoint = vrm.humanoid.getRawBoneNode("leftMiddleDistal");
  const wrist = vrm.humanoid.getNormalizedBoneNode("leftHand");
  const forearm = vrm.humanoid.getNormalizedBoneNode("leftLowerArm");
  const holder = new THREE.Group();
  holder.name = "NH02_left_hand_staff";
  staffScene.scale.multiplyScalar(0.8);
  staffScene.position.y = -0.78;
  holder.add(staffScene);
  vrm.scene.add(holder);
  const palm = new THREE.Vector3();
  const fingers = new THREE.Vector3();
  const parentRotation = new THREE.Quaternion();
  const upright = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -0.08);
  const shaftAxis = new THREE.Vector3(0, 1, 0).applyQuaternion(upright);
  // Left-hand flexion uses the downward shaft direction. Pointing local Z
  // upward turns the palm outward and rolls the wrist back on itself.
  const gripAxis = shaftAxis.clone().negate();
  const wristX = new THREE.Vector3(), wristY = new THREE.Vector3();
  const elbowPosition = new THREE.Vector3(), wristPosition = new THREE.Vector3();
  const wristBasis = new THREE.Matrix4();
  const wristWorld = new THREE.Quaternion(), wristParent = new THREE.Quaternion();
  // Fit the shaft inside the palm, then fit each phalanx around its radius.
  // A circle through only the middle finger put the shorter pinky inside it.
  const fingerCurls = {
    Index: [0.393, 1.221, 0.633],
    Middle: [0.563, 1.324, 0.676],
    Ring: [0.474, 1.199, 0.870],
    Little: [0.102, 0.863, 0.782]
  };
  const gripBones = Object.entries(fingerCurls).flatMap(([finger, curls]) =>
    ["Proximal", "Intermediate", "Distal"].map((joint, index) => ({
      bone: vrm.humanoid.getNormalizedBoneNode(`left${finger}${joint}`),
      bend: curls[index]
    }))
  );
  const thumbBase = vrm.humanoid.getNormalizedBoneNode("leftThumbMetacarpal");
  const thumb = vrm.humanoid.getNormalizedBoneNode("leftThumbProximal");
  const thumbTip = vrm.humanoid.getNormalizedBoneNode("leftThumbDistal");
  const holdInFront = createFrontHold(vrm.humanoid);
  return {
    poseGrip() {
      holdInFront();
      // Resolve the whole wrist orientation from the forearm and shaft.
      // Aligning only its curl axis kept the waving clip's backward wrist bend.
      if (wrist?.parent && forearm) {
        forearm.getWorldPosition(elbowPosition);
        wrist.getWorldPosition(wristPosition);
        // The left palm extends along normalized -X.
        wristX.copy(elbowPosition).sub(wristPosition);
        wristX.addScaledVector(gripAxis, -wristX.dot(gripAxis)).normalize();
        wristY.crossVectors(gripAxis, wristX).normalize();
        wristBasis.makeBasis(wristX, wristY, gripAxis);
        wristWorld.setFromRotationMatrix(wristBasis);
        wrist.parent.getWorldQuaternion(wristParent).invert();
        wrist.quaternion.copy(wristParent.multiply(wristWorld));
      }
      for (const { bone, bend } of gripBones) bone?.rotation.set(0, 0, bend);
      // Bring the thumb across the shaft from its base instead of leaving
      // the metacarpal in the animation's open-hand pose.
      thumbBase?.rotation.set(0, 0.9, 0.3);
      thumb?.rotation.set(0, 0.6, 0.8);
      thumbTip?.rotation.set(0, 0.4, 0.8);
    },
    update() {
      if (!hand) { holder.visible = false; return; }
      vrm.scene.updateWorldMatrix(true, true);
      hand.getWorldPosition(palm);
      if (knuckle && middleJoint && lastJoint) {
        hand.localToWorld(palm.set(-0.084, -0.033, -0.010));
      } else if (knuckle) palm.lerp(knuckle.getWorldPosition(fingers), 0.8);
      holder.position.copy(vrm.scene.worldToLocal(palm));
      // Compensate the VRM 0 facing correction and the avatar's parent transform.
      vrm.scene.getWorldQuaternion(parentRotation);
      holder.quaternion.copy(parentRotation.invert()).multiply(upright);
      holder.updateWorldMatrix(false, true);
    }
  };
}
