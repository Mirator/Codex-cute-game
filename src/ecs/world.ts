import {
  AnimationState,
  Carryable,
  ChainReaction,
  DogAI,
  Entity,
  HeatSource,
  HeatTracker,
  HumanAI,
  InputComponent,
  Interactable,
  PhysicsBody,
  PigeonFlock,
  PlayerController,
  ScoreTracker,
  Transform,
  TriggerVolume,
  WorldState,
} from './components';

type ComponentStore = {
  transform: Map<Entity, Transform>;
  physics: Map<Entity, PhysicsBody>;
  input: Map<Entity, InputComponent>;
  player: Map<Entity, PlayerController>;
  interactable: Map<Entity, Interactable>;
  carryable: Map<Entity, Carryable>;
  score: Map<Entity, ScoreTracker>;
  heat: Map<Entity, HeatTracker>;
  heatSource: Map<Entity, HeatSource>;
  humanAI: Map<Entity, HumanAI>;
  dogAI: Map<Entity, DogAI>;
  pigeons: Map<Entity, PigeonFlock>;
  trigger: Map<Entity, TriggerVolume>;
  chain: Map<Entity, ChainReaction>;
  animation: Map<Entity, AnimationState>;
  world: Map<Entity, WorldState>;
};

type StoreKey = keyof ComponentStore;

export class World {
  private nextEntity: Entity = 1;
  public readonly store: ComponentStore = {
    transform: new Map(),
    physics: new Map(),
    input: new Map(),
    player: new Map(),
    interactable: new Map(),
    carryable: new Map(),
    score: new Map(),
    heat: new Map(),
    heatSource: new Map(),
    humanAI: new Map(),
    dogAI: new Map(),
    pigeons: new Map(),
    trigger: new Map(),
    chain: new Map(),
    animation: new Map(),
    world: new Map(),
  };

  createEntity(): Entity {
    const entity = this.nextEntity;
    this.nextEntity += 1;
    return entity;
  }

  destroyEntity(entity: Entity): void {
    (Object.keys(this.store) as StoreKey[]).forEach((key) => {
      this.store[key].delete(entity as Entity);
    });
  }

  add<K extends StoreKey>(entity: Entity, key: K, value: ComponentStore[K] extends Map<Entity, infer V> ? V : never): void {
    const store = this.store[key] as Map<Entity, unknown>;
    store.set(entity, value);
  }

  get<K extends StoreKey>(entity: Entity, key: K): ComponentStore[K] extends Map<Entity, infer V> ? V | undefined : never {
    const store = this.store[key] as Map<Entity, unknown>;
    return store.get(entity) as never;
  }

  entitiesWith<K1 extends StoreKey, K2 extends StoreKey>(key1: K1, key2?: K2): Entity[] {
    const base = Array.from(this.store[key1].keys());
    if (!key2) {
      return base;
    }
    return base.filter((entity) => this.store[key2].has(entity));
  }

  query(keys: StoreKey[]): Entity[] {
    if (keys.length === 0) return [];
    let smallestStore: StoreKey = keys[0];
    keys.forEach((key) => {
      if (this.store[key].size < this.store[smallestStore].size) {
        smallestStore = key;
      }
    });
    const base = Array.from(this.store[smallestStore].keys());
    return base.filter((entity) => keys.every((key) => this.store[key].has(entity)));
  }
}
