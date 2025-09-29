import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '../src/core/events';
import { World } from '../src/ecs/world';
import { ScoreSystem } from '../src/systems/scoreSystem';
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

describe('ScoreSystem', () => {
  it('applies combo multipliers and updates HUD', () => {
    const world = new World();
    const bus = new EventBus();
    const hud = createHudStub();
    const player = world.createEntity();
    world.add(player, 'score', { score: 0, combo: 0, comboTimer: 0, best: 0 });

    const system = new ScoreSystem(world, hud, bus);
    bus.emit({ type: 'break', actor: player, target: player, category: 'medium', score: 100, heat: 0 });
    bus.flush();
    system.update(0);

    const tracker = world.get(player, 'score');
    expect(tracker?.score).toBeCloseTo(100 * CONFIG.scoring.comboMultipliers[0].multiplier);
    expect(tracker?.combo).toBe(1);
    expect(hud.setScore).toHaveBeenCalledWith(expect.any(Number));
    expect(hud.setCombo).toHaveBeenCalledWith(1, expect.any(Number), expect.any(Number));

    system.update(CONFIG.scoring.baseComboWindow * 2);
    expect(tracker?.combo).toBe(0);
  });
});
