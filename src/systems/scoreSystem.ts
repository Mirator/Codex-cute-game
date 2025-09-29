import { CONFIG } from '../core/config';
import { EventBus, BreakEvent, ChainProgressEvent } from '../core/events';
import { ScoreTracker } from '../ecs/components';
import { World } from '../ecs/world';
import { Hud } from '../ui/hud';

export class ScoreSystem {
  private maxCombo = 0;
  private chainComplete = false;

  constructor(private readonly world: World, private readonly hud: Hud, bus: EventBus) {
    bus.on('break', (event) => this.onBreak(event));
    bus.on('chainProgress', (event) => this.onChain(event));
  }

  update(delta: number): void {
    this.world.store.score.forEach((tracker: ScoreTracker) => {
      if (tracker.combo > 0) {
        tracker.comboTimer = Math.max(0, tracker.comboTimer - delta * CONFIG.scoring.comboDecay);
        if (tracker.comboTimer <= 0) {
          tracker.combo = 0;
        }
      }
      const { multiplier, progress } = this.getMultiplier(tracker.combo, tracker.comboTimer);
      this.hud.setScore(tracker.score);
      this.hud.setCombo(tracker.combo, progress, multiplier);
    });
  }

  private onBreak(event: BreakEvent): void {
    const tracker = this.world.get(event.actor, 'score');
    if (!tracker) return;
    tracker.combo += 1;
    tracker.comboTimer = CONFIG.scoring.baseComboWindow;
    const { multiplier } = this.getMultiplier(tracker.combo, tracker.comboTimer);
    tracker.score += Math.round(event.score * multiplier);
    if (tracker.combo > this.maxCombo) this.maxCombo = tracker.combo;
    if (event.chainKey) {
      this.world.store.chain.forEach((chain) => {
        if (chain.key === 'alleyCascade') {
          chain.timer = 0.5;
          chain.stage = Math.max(chain.stage, 1);
        }
      });
    }
  }

  private onChain(event: ChainProgressEvent): void {
    if (event.key === 'alleyCascade' && event.stage >= 3) {
      this.chainComplete = true;
    }
  }

  private getMultiplier(combo: number, timer: number): { multiplier: number; progress: number } {
    let multiplier = 1;
    CONFIG.scoring.comboMultipliers.forEach((rule) => {
      if (combo >= rule.threshold) multiplier = rule.multiplier;
    });
    const progress = Math.min(timer / CONFIG.scoring.baseComboWindow, 1);
    return { multiplier, progress };
  }

  summary() {
    return { maxCombo: this.maxCombo, chainComplete: this.chainComplete };
  }
}
