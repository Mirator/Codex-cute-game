import { EventBus } from '../core/events';
import { ChainReaction } from '../ecs/components';
import { World } from '../ecs/world';

export function updateChains(world: World, bus: EventBus, delta: number): void {
  world.store.chain.forEach((chain: ChainReaction) => {
    if (chain.stage <= 0) return;
    chain.timer -= delta;
    if (chain.timer <= 0) {
      chain.stage += 1;
      chain.timer = 1.2;
      bus.emit({ type: 'chainProgress', key: chain.key, stage: chain.stage });
    }
  });
}
