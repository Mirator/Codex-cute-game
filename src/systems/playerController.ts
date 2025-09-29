import * as THREE from 'three';
import { PhysicsBody, PlayerController, Transform } from '../ecs/components';
import { World } from '../ecs/world';
import type { CatRigData, LegRigData } from '../scene/actors';

const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const moveDir = new THREE.Vector3();

export function updatePlayer(world: World, delta: number, cameraYaw: number): void {
  world.store.player.forEach((controller, entity) => {
    const transform = world.get(entity, 'transform');
    const physics = world.get(entity, 'physics');
    const input = world.get(entity, 'input');
    if (!transform || !physics || !input) return;

    forward.set(Math.sin(cameraYaw), 0, Math.cos(cameraYaw));
    right.set(forward.z, 0, -forward.x);
    moveDir.set(0, 0, 0);
    moveDir.addScaledVector(right, input.move.x);
    moveDir.addScaledVector(forward, input.move.y);
    const moving = moveDir.lengthSq() > 0.0001;
    if (moving) moveDir.normalize();

    const targetSpeed = controller.maxSpeed * (input.sprint ? controller.sprintMultiplier : 1);
    const desired = moveDir.clone().multiplyScalar(targetSpeed);
    const horizontal = new THREE.Vector3(physics.velocity.x, 0, physics.velocity.z);
    const smoothing = 1 - Math.exp(-controller.acceleration * delta);
    horizontal.lerp(desired, smoothing);
    physics.velocity.x = horizontal.x;
    physics.velocity.z = horizontal.z;

    physics.jumpBuffer = Math.max(physics.jumpBuffer - delta, 0);
    physics.coyoteTimer = Math.max(physics.coyoteTimer - delta, 0);

    if (input.jumpPressed) {
      physics.jumpBuffer = 0.16;
      input.jumpPressed = false;
    }

    if (physics.onGround) {
      physics.coyoteTimer = 0.18;
    }

    if (physics.jumpBuffer > 0 && physics.coyoteTimer > 0) {
      physics.velocity.y = controller.jumpForce;
      physics.onGround = false;
      physics.jumpBuffer = 0;
      physics.coyoteTimer = 0;
    }

    physics.velocity.y -= controller.gravity * delta;

    if (moving) {
      transform.rotationY = Math.atan2(horizontal.x, horizontal.z);
    }
  });
}

export function syncCatMesh(
  transform: Transform,
  physics: PhysicsBody | undefined,
  mesh: THREE.Object3D,
  delta: number,
): void {
  mesh.position.copy(transform.position);
  mesh.position.y += 0.18;
  mesh.rotation.y = transform.rotationY;

  const rig = mesh.userData.cat as CatRigData | undefined;
  if (!rig) return;

  const speed = physics ? Math.hypot(physics.velocity.x, physics.velocity.z) : 0;
  const moveStrength = Math.min(speed / 4.6, 1);
  const idleStrength = 0.35 + (1 - moveStrength) * 0.65;
  const frequency = 2.4 + moveStrength * 3.6;
  rig.time += delta * frequency;

  const stride = rig.time;
  const bouncePhase = stride * 2;

  const bounce = Math.sin(bouncePhase) * 0.05 * (0.4 + moveStrength * 0.8);
  const sway = Math.sin(stride + Math.PI / 2) * 0.05 * moveStrength;
  const roll = Math.sin(stride) * 0.04 * moveStrength;

  rig.spine.position.y = rig.spineBaseY + bounce;
  rig.spine.rotation.x = rig.spineBaseRotX + Math.sin(stride + Math.PI / 2) * 0.12 * moveStrength + Math.sin(rig.time * 0.6) * 0.03 * idleStrength;
  rig.spine.rotation.y = rig.spineBaseRotY + sway;
  rig.spine.rotation.z = roll;

  const headBob = Math.sin(bouncePhase + Math.PI / 3) * 0.05 * (0.3 + moveStrength * 0.5);
  const headNod = Math.sin(stride) * 0.12 * (0.2 + moveStrength * 0.5) + Math.sin(rig.time * 1.8) * 0.08 * idleStrength;
  const headTurn = Math.sin(rig.time * 1.2) * 0.18 * idleStrength;
  const headTilt = Math.sin(rig.time * 2.1) * 0.05 * idleStrength;

  rig.headPivot.position.y = rig.headBasePos.y + headBob;
  rig.headPivot.position.z = rig.headBasePos.z + Math.sin(stride + Math.PI / 2) * 0.015 * moveStrength;
  rig.headPivot.rotation.x = rig.headBaseRot.x + headNod;
  rig.headPivot.rotation.y = rig.headBaseRot.y + headTurn;
  rig.headPivot.rotation.z = rig.headBaseRot.z + headTilt;

  const animateLeg = (leg: LegRigData, phase: number, strideAmp: number, kneeAmp: number, ankleAmp: number) => {
    const swing = Math.sin(phase) * strideAmp;
    const lift = Math.max(0, Math.sin(phase + Math.PI / 2));
    const plant = Math.max(0, Math.sin(phase - Math.PI / 2));
    leg.root.rotation.x = leg.baseRoot + swing;
    leg.knee.rotation.x = leg.baseKnee + lift * kneeAmp - plant * kneeAmp * 0.25;
    leg.ankle.rotation.x = leg.baseAnkle - lift * ankleAmp + plant * ankleAmp * 0.5;
  };

  const idleStride = 0.08 * idleStrength;
  const frontStride = 0.55 * moveStrength + idleStride;
  const backStride = 0.68 * moveStrength + idleStride * 1.2;
  const frontKnee = 0.7 * moveStrength + 0.05 * idleStrength;
  const backKnee = 0.88 * moveStrength + 0.06 * idleStrength;
  const frontAnkle = 0.45 * moveStrength + 0.05 * idleStrength;
  const backAnkle = 0.55 * moveStrength + 0.06 * idleStrength;

  const frontLeftPhase = stride;
  const frontRightPhase = stride + Math.PI;
  const backLeftPhase = stride + Math.PI;
  const backRightPhase = stride;

  animateLeg(rig.frontLeftLeg, frontLeftPhase, frontStride, frontKnee, frontAnkle);
  animateLeg(rig.frontRightLeg, frontRightPhase, frontStride, frontKnee, frontAnkle);
  animateLeg(rig.backLeftLeg, backLeftPhase, backStride, backKnee, backAnkle);
  animateLeg(rig.backRightLeg, backRightPhase, backStride, backKnee, backAnkle);

  const tailLift = Math.sin(stride + Math.PI / 2) * 0.08 * moveStrength;
  const tailWave = Math.sin(rig.time * 1.8) * 0.3 * idleStrength;
  const tailSway = Math.sin(rig.time * 2.2 + 0.6) * 0.2 * idleStrength;

  rig.tail[0].pivot.rotation.x = rig.tail[0].baseX + tailLift + Math.cos(rig.time * 1.4) * 0.15 * idleStrength;
  rig.tail[0].pivot.rotation.y = rig.tail[0].baseY + tailWave;
  rig.tail[1].pivot.rotation.x = rig.tail[1].baseX + tailLift * 1.4 + Math.sin(rig.time * 2.0 + 0.5) * 0.22 * idleStrength;
  rig.tail[1].pivot.rotation.y = rig.tail[1].baseY + tailSway;
  rig.tail[2].pivot.rotation.x = rig.tail[2].baseX + tailLift * 1.8 + Math.sin(rig.time * 2.6 + 1.2) * 0.28 * idleStrength;
  rig.tail[2].pivot.rotation.y = rig.tail[2].baseY + Math.sin(rig.time * 2.4 + 0.9) * 0.28 * idleStrength;

  const whiskerTwitch = Math.sin(rig.time * 2.5) * 0.22 * idleStrength;
  rig.whiskers[0].rotation.y = rig.whiskerBaseRot + whiskerTwitch;
  rig.whiskers[1].rotation.y = -rig.whiskerBaseRot - whiskerTwitch;

  const earFlick = Math.sin(rig.time * 2.8) * 0.1 * idleStrength;
  const earTilt = Math.sin(rig.time * 3.4 + 0.6) * 0.06 * idleStrength;
  rig.ears[0].rotation.x = rig.earBaseRot + earFlick + earTilt;
  rig.ears[1].rotation.x = rig.earBaseRot + earFlick - earTilt;
  rig.ears[0].rotation.y = Math.sin(rig.time * 2.1 + 0.4) * 0.05 * idleStrength;
  rig.ears[1].rotation.y = -Math.sin(rig.time * 2.1 + 0.4) * 0.05 * idleStrength;
}

