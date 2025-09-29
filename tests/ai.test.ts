import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { EventBus } from '../src/core/events';
import { World } from '../src/ecs/world';
import { AiSystem } from '../src/systems/aiSystem';

describe('AiSystem', () => {
  it('reacts to break and spill events', () => {
    const world = new World();
    const bus = new EventBus();
    const ai = new AiSystem(world, bus);

    const human = world.createEntity();
    world.add(human, 'humanAI', {
      state: 'patrol',
      targetHeat: 0,
      patrolPoints: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0)],
      currentPoint: 0,
      timer: 0,
    });
    world.add(human, 'transform', { position: new THREE.Vector3(0, 0, 0), rotationY: 0 });

    const pigeons = world.createEntity();
    world.add(pigeons, 'pigeons', { home: new THREE.Vector3(), scatterTimer: 0, regroupTimer: 0, population: 10 });

    const prop = world.createEntity();
    world.add(prop, 'transform', { position: new THREE.Vector3(2, 0, 0), rotationY: 0 });

    const player = world.createEntity();
    world.add(player, 'heat', { value: 0, hideBoost: 0, alertModifier: 1 });
    world.add(player, 'transform', { position: new THREE.Vector3(0, 0, 0), rotationY: 0 });
    world.add(player, 'player', {
      acceleration: 0,
      maxSpeed: 0,
      sprintMultiplier: 0,
      jumpForce: 0,
      gravity: 0,
      mantleHeight: 0,
    });

    bus.emit({ type: 'break', actor: player, target: prop, category: 'small', score: 0, heat: 0 });
    bus.flush();
    ai.update(0.5);
    const humanAI = world.get(human, 'humanAI');
    expect(humanAI?.state).toBe('investigate');

    bus.emit({ type: 'spill', source: prop, category: 'food' });
    bus.flush();
    ai.update(0.5);
    const flock = world.get(pigeons, 'pigeons');
    expect(flock?.regroupTimer).toBeGreaterThan(0);
  });
});
