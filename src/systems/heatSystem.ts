import * as THREE from 'three';
import { CONFIG } from '../core/config';
import { EventBus, BreakEvent } from '../core/events';
import { HeatTracker, Transform } from '../ecs/components';
import { World } from '../ecs/world';
import { Hud } from '../ui/hud';

const offset = new THREE.Vector3();

export class HeatSystem {
  private peakHeat = 0;

  constructor(private readonly world: World, private readonly hud: Hud, private readonly bus: EventBus) {
    bus.on('break', (event) => this.onBreak(event));
  }

  update(delta: number): void {
    this.world.store.heat.forEach((tracker: HeatTracker, entity) => {
      const transform = this.world.get(entity, 'transform');
      if (!transform) return;
      const inHide = this.isInsideHide(transform);

      const wasAlert = tracker.value >= CONFIG.heat.thresholds[2].value;
      const decayModifier = inHide
        ? CONFIG.heat.hideDecayMultiplier
        : wasAlert
          ? CONFIG.heat.alertDecayMultiplier
          : 1;

      tracker.value = Math.max(0, tracker.value - CONFIG.heat.decayPerSecond * decayModifier * delta);

      const stillAlert = tracker.value >= CONFIG.heat.thresholds[2].value;
      tracker.alertModifier = stillAlert ? CONFIG.heat.alertDecayMultiplier : 1;

      if (tracker.value > this.peakHeat) this.peakHeat = tracker.value;
      const label = this.getLabel(tracker.value);
      this.hud.setHeat(tracker.value / CONFIG.heat.maxHeat, label);
      this.bus.emit({ type: 'heatChanged', entity, value: tracker.value });
    });
  }

  private onBreak(event: BreakEvent): void {
    const tracker = this.world.get(event.actor, 'heat');
    if (!tracker) return;
    tracker.value = Math.min(CONFIG.heat.maxHeat, tracker.value + event.heat);
    tracker.alertModifier = tracker.value >= CONFIG.heat.thresholds[2].value ? CONFIG.heat.alertDecayMultiplier : 1;
  }

  private isInsideHide(transform: Transform): boolean {
    let inside = false;
    this.world.store.trigger.forEach((trigger, entity) => {
      if (!trigger.hideSpot) return;
      const triggerTransform = this.world.get(entity, 'transform');
      if (!triggerTransform) return;
      offset.copy(transform.position).sub(triggerTransform.position);
      if (offset.length() <= trigger.radius) inside = true;
    });
    return inside;
  }

  private getLabel(value: number): string {
    const threshold = CONFIG.heat.thresholds
      .slice()
      .reverse()
      .find((t) => value >= t.value);
    return threshold?.name ?? 'Calm';
  }

  summary() {
    return { peakHeat: this.peakHeat };
  }
}
