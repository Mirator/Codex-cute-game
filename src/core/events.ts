import { Entity, PropCategory } from '../ecs/components';

export interface InteractionEvent {
  type: 'interaction';
  actor: Entity;
  target: Entity;
  id: string;
  category: PropCategory;
}

export interface BreakEvent {
  type: 'break';
  actor: Entity;
  target: Entity;
  category: PropCategory;
  score: number;
  heat: number;
  chainKey?: string;
}

export interface SpillEvent {
  type: 'spill';
  source: Entity;
  category: PropCategory;
}

export interface HeatChangedEvent {
  type: 'heatChanged';
  entity: Entity;
  value: number;
}

export interface ComboTickEvent {
  type: 'comboTick';
  entity: Entity;
  combo: number;
  multiplier: number;
}

export interface ChainProgressEvent {
  type: 'chainProgress';
  key: string;
  stage: number;
}

export interface HideEvent {
  type: 'hide';
  entity: Entity;
  entering: boolean;
}

export interface RunEndedEvent {
  type: 'runEnded';
  score: number;
  combo: number;
  heat: number;
}

export type GameEvent =
  | InteractionEvent
  | BreakEvent
  | SpillEvent
  | HeatChangedEvent
  | ComboTickEvent
  | ChainProgressEvent
  | HideEvent
  | RunEndedEvent;

type Listener<T extends GameEvent> = (event: T) => void;

type ListenerMap = { [K in GameEvent['type']]?: Listener<Extract<GameEvent, { type: K }>>[] };

export class EventBus {
  private queue: GameEvent[] = [];
  private listeners: ListenerMap = {};

  emit<T extends GameEvent>(event: T): void {
    this.queue.push(event);
  }

  on<T extends GameEvent['type']>(type: T, listener: Listener<Extract<GameEvent, { type: T }>>): () => void {
    const list = (this.listeners[type] ??= []);
    list.push(listener as Listener<GameEvent>);
    return () => {
      const index = list.indexOf(listener as Listener<GameEvent>);
      if (index >= 0) list.splice(index, 1);
    };
  }

  flush(): void {
    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (!event) continue;
      const listeners = this.listeners[event.type];
      if (!listeners) continue;
      listeners.slice().forEach((listener) => listener(event as never));
    }
  }

  clear(): void {
    this.queue = [];
    this.listeners = {};
  }
}
