import * as THREE from 'three';
import { PlayerController, Transform } from '../ecs/components';
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

export function syncCatMesh(transform: Transform, mesh: THREE.Object3D): void {
  mesh.position.copy(transform.position);
  mesh.position.y += 0.2;
  mesh.rotation.y = transform.rotationY;
}
