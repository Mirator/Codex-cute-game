import * as THREE from 'three';
import { PhysicsBody, PlayerController, Transform } from '../ecs/components';
import { World } from '../ecs/world';

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

  const rig = mesh.userData.cat as
    | {
        headPivot: THREE.Group;
        headBaseY: number;
        headBaseRotX: number;
        tail: THREE.Group[];
        tailBaseRotations: number[];
        frontLeftLeg: { root: THREE.Group; lower: THREE.Group; baseRoot: number; baseLower: number };
        frontRightLeg: { root: THREE.Group; lower: THREE.Group; baseRoot: number; baseLower: number };
        backLeftLeg: { root: THREE.Group; lower: THREE.Group; baseRoot: number; baseLower: number };
        backRightLeg: { root: THREE.Group; lower: THREE.Group; baseRoot: number; baseLower: number };
        whiskers: [THREE.Mesh, THREE.Mesh];
        whiskerBaseRot: number;
        ears: [THREE.Group, THREE.Group];
        earBaseRot: number;
        time: number;
      }
    | undefined;
  if (!rig) return;

  const speed = physics ? Math.sqrt(physics.velocity.x ** 2 + physics.velocity.z ** 2) : 0;
  const moveStrength = Math.min(speed / 4.4, 1);
  const idleStrength = Math.max(0.2, moveStrength * 0.85);
  rig.time += delta * (3.4 + moveStrength * 5.6);

  const stride = rig.time * 3.2;
  const frontSwing = Math.sin(stride) * 0.55 * moveStrength;
  const frontOpposite = Math.sin(stride + Math.PI) * 0.55 * moveStrength;
  const backSwing = Math.sin(stride + Math.PI) * 0.65 * moveStrength;
  const backOpposite = Math.sin(stride) * 0.65 * moveStrength;

  const kneeBend = (phase: number) => Math.max(0, Math.sin(phase + Math.PI / 2)) * 0.55 * moveStrength;

  rig.frontLeftLeg.root.rotation.x = rig.frontLeftLeg.baseRoot + frontSwing;
  rig.frontRightLeg.root.rotation.x = rig.frontRightLeg.baseRoot + frontOpposite;
  rig.backLeftLeg.root.rotation.x = rig.backLeftLeg.baseRoot + backSwing * 0.9;
  rig.backRightLeg.root.rotation.x = rig.backRightLeg.baseRoot + backOpposite * 0.9;

  rig.frontLeftLeg.lower.rotation.x = rig.frontLeftLeg.baseLower + kneeBend(stride + Math.PI);
  rig.frontRightLeg.lower.rotation.x = rig.frontRightLeg.baseLower + kneeBend(stride);
  rig.backLeftLeg.lower.rotation.x = rig.backLeftLeg.baseLower + kneeBend(stride + Math.PI) * 1.2;
  rig.backRightLeg.lower.rotation.x = rig.backRightLeg.baseLower + kneeBend(stride) * 1.2;

  const headBob = Math.sin(rig.time * 2.1) * 0.04 * (0.3 + idleStrength);
  const headPitch = Math.sin(rig.time * 1.6) * 0.12 * (0.4 + idleStrength * 0.8);
  rig.headPivot.position.y = rig.headBaseY + headBob;
  rig.headPivot.rotation.x = rig.headBaseRotX + headPitch;
  rig.headPivot.rotation.y = Math.sin(rig.time * 1.5) * 0.08 * idleStrength;

  rig.tail[0].rotation.x = rig.tailBaseRotations[0] + Math.cos(rig.time * 1.4) * 0.12 * idleStrength;
  rig.tail[0].rotation.y = Math.sin(rig.time * 1.3) * 0.28 * idleStrength;
  rig.tail[1].rotation.x = rig.tailBaseRotations[1] + Math.sin(rig.time * 1.8 + 0.6) * 0.18 * idleStrength;
  rig.tail[1].rotation.y = Math.sin(rig.time * 1.7 + Math.PI / 3) * 0.18 * idleStrength;
  rig.tail[2].rotation.x = rig.tailBaseRotations[2] + Math.sin(rig.time * 2.4 + 1.2) * 0.22 * idleStrength;
  rig.tail[2].rotation.y = Math.sin(rig.time * 2.2 + Math.PI / 2) * 0.24 * idleStrength;

  const whiskerOffset = Math.sin(rig.time * 2.3) * 0.22 * (0.4 + idleStrength);
  rig.whiskers[0].rotation.y = rig.whiskerBaseRot + whiskerOffset;
  rig.whiskers[1].rotation.y = -rig.whiskerBaseRot - whiskerOffset;

  const earFlick = Math.sin(rig.time * 2.7) * 0.1 * (0.3 + idleStrength);
  rig.ears[0].rotation.x = rig.earBaseRot + earFlick;
  rig.ears[1].rotation.x = rig.earBaseRot - earFlick;
}
