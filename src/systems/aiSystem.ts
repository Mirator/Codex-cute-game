import * as THREE from 'three';
import { CONFIG } from '../core/config';
import { EventBus, BreakEvent, SpillEvent } from '../core/events';
import { DogAI, HumanAI, PigeonFlock, Transform } from '../ecs/components';
import { World } from '../ecs/world';

const tmpVec = new THREE.Vector3();

export class AiSystem {
  private lastNoise = new THREE.Vector3();

  constructor(private readonly world: World, private readonly bus: EventBus) {
    bus.on('break', (event) => this.onBreak(event));
    bus.on('spill', (event) => this.onSpill(event));
  }

  update(delta: number): void {
    this.world.store.humanAI.forEach((ai: HumanAI, entity) => {
      const transform = this.world.get(entity, 'transform');
      if (!transform) return;
      ai.timer = Math.max(0, ai.timer - delta);
      const playerHeat = this.getPlayerHeat();
      if (playerHeat >= CONFIG.categories.ai.human.chaseHeat) ai.state = 'chase';
      else if (playerHeat >= CONFIG.categories.ai.human.warnHeat) ai.state = 'warn';
      else if (ai.timer > 0) ai.state = 'investigate';
      else ai.state = 'patrol';

      if (ai.state === 'patrol') {
        const target = ai.patrolPoints[ai.currentPoint];
        tmpVec.copy(target).sub(transform.position);
        if (tmpVec.length() < 0.5) {
          ai.currentPoint = (ai.currentPoint + 1) % ai.patrolPoints.length;
        } else {
          tmpVec.normalize();
          transform.rotationY = Math.atan2(tmpVec.x, tmpVec.z);
        }
      } else if (ai.state === 'investigate') {
        tmpVec.copy(this.lastNoise).sub(transform.position);
        if (tmpVec.length() > 0.1) {
          tmpVec.normalize();
          transform.rotationY = Math.atan2(tmpVec.x, tmpVec.z);
        }
      }
    });

    this.world.store.dogAI.forEach((ai: DogAI, entity) => {
      const transform = this.world.get(entity, 'transform');
      if (!transform) return;
      ai.cooldown = Math.max(0, ai.cooldown - delta);
      const playerTransform = this.getPlayerTransform();
      if (!playerTransform) return;
      const distance = tmpVec.copy(playerTransform.position).sub(transform.position).length();
      if (distance < CONFIG.categories.ai.dog.leashRadius && ai.cooldown <= 0) {
        ai.state = 'pursuit';
        transform.rotationY = Math.atan2(tmpVec.x, tmpVec.z);
      } else if (ai.state === 'pursuit') {
        ai.state = 'return';
        ai.cooldown = CONFIG.categories.ai.dog.cooldown;
      }
    });

    this.world.store.pigeons.forEach((flock: PigeonFlock, entity) => {
      flock.scatterTimer = Math.max(0, flock.scatterTimer - delta);
      flock.regroupTimer = Math.max(0, flock.regroupTimer - delta);
      if (flock.scatterTimer > 0) {
        flock.population = Math.max(4, flock.population - 10 * delta);
      } else if (flock.regroupTimer <= 0) {
        flock.population = Math.min(CONFIG.categories.ai.pigeon.maxPopulation, flock.population + 6 * delta);
      }
    });
  }

  private onBreak(event: BreakEvent): void {
    const transform = this.world.get(event.target, 'transform');
    if (!transform) return;
    this.lastNoise.copy(transform.position);
    this.world.store.humanAI.forEach((ai) => {
      ai.timer = 4;
    });
    this.world.store.dogAI.forEach((ai) => {
      ai.cooldown = Math.max(ai.cooldown, 2);
    });
  }

  private onSpill(_event: SpillEvent): void {
    this.world.store.pigeons.forEach((flock) => {
      flock.regroupTimer = 3;
    });
  }

  private getPlayerHeat(): number {
    let heat = 0;
    this.world.store.heat.forEach((tracker) => {
      heat = Math.max(heat, tracker.value);
    });
    return heat;
  }

  private getPlayerTransform(): Transform | undefined {
    let transform: Transform | undefined;
    this.world.store.player.forEach((_controller, entity) => {
      const t = this.world.get(entity, 'transform');
      if (t) transform = t;
    });
    return transform;
  }
}
