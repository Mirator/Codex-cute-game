import * as THREE from 'three';
import { EventBus } from '../core/events';
import { Entity, PhysicsBody, Transform } from '../ecs/components';
import { World } from '../ecs/world';

const displacement = new THREE.Vector3();

export function simulatePhysics(world: World, bus: EventBus, delta: number): void {
  world.store.physics.forEach((physics: PhysicsBody, entity: Entity) => {
    const transform = world.get(entity, 'transform');
    if (!transform) return;

    displacement.copy(physics.velocity).multiplyScalar(delta);
    transform.position.add(displacement);

    const groundHeight = sampleGround(transform.position.x, transform.position.z);
    if (transform.position.y <= groundHeight) {
      transform.position.y = groundHeight;
      if (physics.velocity.y < 0) physics.velocity.y = 0;
      if (!physics.onGround) {
        bus.emit({ type: 'interaction', actor: entity, target: entity, id: 'land', category: 'small' });
      }
      physics.onGround = true;
    } else {
      physics.onGround = false;
    }

    const damping = physics.onGround ? 0.82 : 0.98;
    physics.velocity.x *= damping;
    physics.velocity.z *= damping;
  });
}

function sampleGround(x: number, z: number): number {
  const ripple = Math.sin(x * 0.2) * Math.cos(z * 0.2) * 0.1;
  return 0.25 + ripple;
}
