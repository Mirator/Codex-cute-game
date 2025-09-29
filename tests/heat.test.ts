import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '../src/core/events';
import { World } from '../src/ecs/world';
import { HeatSystem } from '../src/systems/heatSystem';
import { CONFIG } from '../src/core/config';
import type { Hud } from '../src/ui/hud';

function createHudStub() {
  return {
    setScore: vi.fn(),
    setCombo: vi.fn(),
    setHeat: vi.fn(),
    showPrompt: vi.fn(),
    hidePrompt: vi.fn(),
    showSummary: vi.fn(),
    onRestart: undefined,
  } as unknown as Hud;
}

describe('HeatSystem', () => {
  it('responds to break events and hide spots', () => {
    const world = new World();
    const bus = new EventBus();
    const hud = createHudStub();
    const player = world.createEntity();
    world.add(player, 'heat', { value: 0, hideBoost: 0, alertModifier: 1 });
    world.add(player, 'transform', { position: new THREE.Vector3(0, 0, 0), rotationY: 0 });

    const hide = world.createEntity();
    world.add(hide, 'trigger', { radius: 2, hideSpot: true });
    world.add(hide, 'transform', { position: new THREE.Vector3(0, 0, 0), rotationY: 0 });

    const system = new HeatSystem(world, hud, bus);
    bus.emit({ type: 'break', actor: player, target: player, category: 'small', score: 0, heat: 20 });
    bus.flush();

    const tracker = world.get(player, 'heat');
    expect(tracker?.value).toBeGreaterThan(0);

    system.update(1);
    expect(hud.setHeat).toHaveBeenCalled();

    tracker!.value = CONFIG.heat.thresholds[2].value + 5;
    system.update(0.1);
    expect(tracker!.alertModifier).toBeCloseTo(CONFIG.heat.alertDecayMultiplier);

    system.update(2);
    expect(tracker!.value).toBeLessThan(CONFIG.heat.thresholds[2].value);
    expect(tracker!.alertModifier).toBe(1);
  });
});
