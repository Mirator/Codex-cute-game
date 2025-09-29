import * as THREE from 'three';
import { CONFIG } from '../core/config';
import { EventBus } from '../core/events';
import { Interactable } from '../ecs/components';
import { World } from '../ecs/world';
import { Hud } from '../ui/hud';

const distance = new THREE.Vector3();

export function handleInteractions(world: World, bus: EventBus, hud: Hud, delta: number): void {
  let prompt: string | null = null;
  world.store.interactable.forEach((interactable: Interactable, entity) => {
    interactable.cooldown = Math.max(0, interactable.cooldown - delta);
    if (interactable.cooldown <= 0 && !interactable.armed) {
      interactable.armed = true;
      interactable.broken = false;
    }
  });

  world.store.player.forEach((_controller, player) => {
    const playerTransform = world.get(player, 'transform');
    const input = world.get(player, 'input');
    if (!playerTransform || !input) return;

    world.store.interactable.forEach((interactable, target) => {
      const targetTransform = world.get(target, 'transform');
      if (!targetTransform) return;
      distance.copy(playerTransform.position).sub(targetTransform.position);
      const radius = interactable.radius + 0.1;
      if (distance.length() <= radius) {
        if (interactable.armed) {
          prompt = `Press E to ${interactable.label}`;
          if (input.interactPressed) {
            triggerInteraction(world, bus, player, target, interactable);
            input.interactPressed = false;
          }
        }
      }
    });
  });

  if (prompt) hud.showPrompt(prompt);
  else hud.hidePrompt();
}

function triggerInteraction(world: World, bus: EventBus, player: number, target: number, interactable: Interactable): void {
  const category = CONFIG.categories.props[interactable.category];
  interactable.armed = false;
  interactable.cooldown = 4;
  interactable.broken = true;

  const score = category.baseScore + category.comboBonus * 10;
  const heat = category.heatOnBreak;
  bus.emit({ type: 'interaction', actor: player, target, id: interactable.id, category: interactable.category });
  bus.emit({
    type: 'break',
    actor: player,
    target,
    category: interactable.category,
    score,
    heat,
    chainKey: interactable.chainKey,
  });

  if (interactable.category === 'food') {
    bus.emit({ type: 'spill', source: target, category: 'food' });
  }
}
