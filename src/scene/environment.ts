import * as THREE from 'three';
import { CONFIG } from '../core/config';
import { EventBus } from '../core/events';
import { ChainReaction, Entity, Interactable, Transform, TriggerVolume, WorldState } from '../ecs/components';
import { World } from '../ecs/world';
import { spawnCat, spawnDog, spawnHuman, spawnPigeons } from './actors';

export interface SceneEntities {
  player: Entity;
  worldState: Entity;
  chain: Entity;
  catMesh: THREE.Group;
}

interface PropData {
  position: THREE.Vector3;
  size: THREE.Vector3;
  color: number;
  id: string;
  label: string;
  category: keyof typeof CONFIG.categories.props;
  chainKey?: string;
}

function createPropMesh(size: THREE.Vector3, color: number): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function buildEnvironment(world: World, scene: THREE.Scene, bus: EventBus): SceneEntities {
  scene.background = new THREE.Color(0x0d1220);
  scene.fog = new THREE.Fog(0x0d1220, 12, 28);

  const ambient = new THREE.AmbientLight(0x446688, 0.8);
  const sun = new THREE.DirectionalLight(0xfff2d9, 1.1);
  sun.position.set(8, 12, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -20;
  sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 20;
  sun.shadow.camera.bottom = -20;
  scene.add(ambient);
  scene.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x1a2533, roughness: 0.85 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const { entity: player, mesh: catMesh } = spawnCat(world, scene);
  const worldState = world.createEntity();
  world.add<WorldState>(worldState, 'world', { endRun: false });

  const chain = world.createEntity();
  world.add<ChainReaction>(chain, 'chain', { key: 'alleyCascade', stage: 0, timer: 0 });

  const props: PropData[] = [
    { position: new THREE.Vector3(2, 0.6, -2), size: new THREE.Vector3(1.4, 1.2, 0.6), color: 0xb87f5f, id: 'crateStack', label: 'Push Crates', category: 'container' },
    { position: new THREE.Vector3(-3, 0.4, -1), size: new THREE.Vector3(1.0, 0.8, 0.6), color: 0x8ea6c1, id: 'paintCans', label: 'Knock Paint', category: 'mechanism', chainKey: 'laundry-line' },
    { position: new THREE.Vector3(4, 0.3, 1.6), size: new THREE.Vector3(0.6, 0.6, 0.6), color: 0xd3c27f, id: 'snackCart', label: 'Steal Snack', category: 'food' },
  ];

  props.forEach((data) => {
    const mesh = createPropMesh(data.size, data.color);
    mesh.position.copy(data.position);
    scene.add(mesh);
    const entity = world.createEntity();
    world.add<Transform>(entity, 'transform', { position: data.position.clone(), rotationY: 0 });
    world.add<Interactable>(entity, 'interactable', {
      id: data.id,
      label: data.label,
      category: data.category,
      radius: 1.6,
      cooldown: 2,
      armed: true,
      chainKey: data.chainKey,
      broken: false,
    });
  });

  spawnHuman(world, scene, new THREE.Vector3(-6, 0.8, 4));
  spawnDog(world, scene, new THREE.Vector3(5, 0.3, -3));
  spawnPigeons(world, new THREE.Vector3(-1, 0, -4));

  const hideVolume = world.createEntity();
  world.add<Transform>(hideVolume, 'transform', { position: new THREE.Vector3(2, 0, -2), rotationY: 0 });
  world.add<TriggerVolume>(hideVolume, 'trigger', { radius: 1.4, hideSpot: true });

  bus.on('runEnded', () => {
    scene.fog = new THREE.FogExp2(0x05070d, 0.08);
  });

  return { player, worldState, chain, catMesh };
}
