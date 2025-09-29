import * as THREE from 'three';
import { CONFIG } from '../core/config';
import {
  DogAI,
  Entity,
  HeatTracker,
  HumanAI,
  InputComponent,
  PhysicsBody,
  PigeonFlock,
  PlayerController,
  ScoreTracker,
  Transform,
} from '../ecs/components';
import { World } from '../ecs/world';

const CAT_COLOR = 0xffcc88;

function createCatMesh(): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.6, 12, 16), new THREE.MeshStandardMaterial({ color: CAT_COLOR }));
  body.castShadow = true;
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshStandardMaterial({ color: CAT_COLOR }));
  head.position.set(0, 0.55, 0.2);
  head.castShadow = true;
  group.add(head);
  const earGeo = new THREE.ConeGeometry(0.12, 0.2, 8);
  const earMat = new THREE.MeshStandardMaterial({ color: 0xffaa77 });
  const leftEar = new THREE.Mesh(earGeo, earMat);
  leftEar.position.set(-0.16, 0.78, 0.08);
  leftEar.rotation.z = Math.PI / 8;
  group.add(leftEar);
  const rightEar = leftEar.clone();
  rightEar.position.x = 0.16;
  rightEar.rotation.z = -Math.PI / 8;
  group.add(rightEar);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.6, 10), new THREE.MeshStandardMaterial({ color: 0xffbb88 }));
  tail.position.set(0, 0.2, -0.35);
  tail.rotation.x = Math.PI / 2.5;
  group.add(tail);
  return group;
}

export function spawnCat(world: World, scene: THREE.Scene): { entity: Entity; mesh: THREE.Group } {
  const cat = createCatMesh();
  scene.add(cat);
  const entity = world.createEntity();
  world.add<Transform>(entity, 'transform', { position: new THREE.Vector3(0, 0.5, 6), rotationY: 0 });
  world.add<PhysicsBody>(entity, 'physics', {
    velocity: new THREE.Vector3(),
    onGround: false,
    coyoteTimer: 0,
    jumpBuffer: 0,
  });
  world.add<InputComponent>(entity, 'input', {
    move: new THREE.Vector2(),
    sprint: false,
    jumpPressed: false,
    interactPressed: false,
    scratchPressed: false,
  });
  world.add<PlayerController>(entity, 'player', {
    acceleration: 18,
    maxSpeed: 5.2,
    sprintMultiplier: 1.35,
    jumpForce: 5.5,
    gravity: 12,
    mantleHeight: 0.8,
  });
  world.add<ScoreTracker>(entity, 'score', { score: 0, combo: 0, comboTimer: 0, best: 0 });
  world.add<HeatTracker>(entity, 'heat', { value: 0, hideBoost: 0, alertModifier: 1 });
  return { entity, mesh: cat };
}

export function spawnHuman(world: World, scene: THREE.Scene, position: THREE.Vector3): Entity {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1.2, 8, 16), new THREE.MeshStandardMaterial({ color: 0x6c7a8c }));
  mesh.position.copy(position);
  mesh.castShadow = true;
  scene.add(mesh);
  const entity = world.createEntity();
  world.add<Transform>(entity, 'transform', { position: position.clone(), rotationY: Math.PI });
  world.add<HumanAI>(entity, 'humanAI', {
    state: 'patrol',
    targetHeat: CONFIG.categories.ai.human.warnHeat,
    patrolPoints: [position.clone(), new THREE.Vector3(position.x + 4, position.y, position.z - 2)],
    currentPoint: 0,
    timer: 0,
  });
  return entity;
}

export function spawnDog(world: World, scene: THREE.Scene, position: THREE.Vector3): Entity {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.6, 8, 12), new THREE.MeshStandardMaterial({ color: 0xa57b4f }));
  mesh.position.copy(position);
  mesh.castShadow = true;
  scene.add(mesh);
  const entity = world.createEntity();
  world.add<Transform>(entity, 'transform', { position: position.clone(), rotationY: 0 });
  world.add<DogAI>(entity, 'dogAI', {
    leashOrigin: position.clone(),
    leashRadius: CONFIG.categories.ai.dog.leashRadius,
    cooldown: CONFIG.categories.ai.dog.cooldown,
    state: 'idle',
  });
  return entity;
}

export function spawnPigeons(world: World, position: THREE.Vector3): Entity {
  const entity = world.createEntity();
  world.add<Transform>(entity, 'transform', { position: position.clone(), rotationY: 0 });
  world.add<PigeonFlock>(entity, 'pigeons', {
    home: position.clone(),
    scatterTimer: 0,
    regroupTimer: 0,
    population: 18,
  });
  return entity;
}
