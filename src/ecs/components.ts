import * as THREE from 'three';

export type Entity = number;

export type PropCategory = 'small' | 'medium' | 'container' | 'food' | 'mechanism';

export interface Transform {
  position: THREE.Vector3;
  rotationY: number;
}

export interface PhysicsBody {
  velocity: THREE.Vector3;
  onGround: boolean;
  coyoteTimer: number;
  jumpBuffer: number;
}

export interface PlayerController {
  acceleration: number;
  maxSpeed: number;
  sprintMultiplier: number;
  jumpForce: number;
  gravity: number;
  mantleHeight: number;
}

export interface InputComponent {
  move: THREE.Vector2;
  sprint: boolean;
  jumpPressed: boolean;
  interactPressed: boolean;
  scratchPressed: boolean;
}

export interface Interactable {
  id: string;
  label: string;
  category: PropCategory;
  radius: number;
  cooldown: number;
  armed: boolean;
  chainKey?: string;
  broken: boolean;
}

export interface Carryable {
  carrying: boolean;
  offset: THREE.Vector3;
}

export interface ScoreTracker {
  score: number;
  combo: number;
  comboTimer: number;
  best: number;
}

export interface HeatTracker {
  value: number;
  hideBoost: number;
  alertModifier: number;
}

export interface HeatSource {
  strength: number;
  active: boolean;
}

export type HumanState = 'patrol' | 'investigate' | 'warn' | 'chase';

export interface HumanAI {
  state: HumanState;
  targetHeat: number;
  patrolPoints: THREE.Vector3[];
  currentPoint: number;
  timer: number;
}

export interface DogAI {
  leashOrigin: THREE.Vector3;
  leashRadius: number;
  cooldown: number;
  state: 'idle' | 'pursuit' | 'return';
}

export interface PigeonFlock {
  home: THREE.Vector3;
  scatterTimer: number;
  regroupTimer: number;
  population: number;
}

export interface TriggerVolume {
  radius: number;
  hideSpot?: boolean;
}

export interface ChainReaction {
  key: string;
  stage: number;
  timer: number;
}

export interface AnimationState {
  time: number;
}

export interface WorldState {
  endRun: boolean;
}
