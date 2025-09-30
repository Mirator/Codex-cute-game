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

const CAT_COLOR = 0xffc795;
const CAT_ACCENT = 0xffb286;
const CAT_BELLY = 0xffe7d1;
const CAT_DARK = 0x3a261c;
const CAT_STRIPE = 0xd8875a;

interface LegRigData {
  root: THREE.Group;
  lower: THREE.Group;
  baseRoot: number;
  baseLower: number;
}

interface CatRigData {
  headPivot: THREE.Group;
  headBaseY: number;
  headBaseRotX: number;
  tail: THREE.Group[];
  tailBaseRotations: number[];
  frontLeftLeg: LegRigData;
  frontRightLeg: LegRigData;
  backLeftLeg: LegRigData;
  backRightLeg: LegRigData;
  whiskers: [THREE.Mesh, THREE.Mesh];
  whiskerBaseRot: number;
  ears: [THREE.Group, THREE.Group];
  earBaseRot: number;
  time: number;
}

function createLeg(material: THREE.Material, pawMaterial: THREE.Material, options: {
  upperLength: number;
  lowerLength: number;
  upperRadiusTop: number;
  upperRadiusBottom: number;
  lowerRadiusTop: number;
  lowerRadiusBottom: number;
}): LegRigData {
  const root = new THREE.Group();
  const upper = new THREE.Mesh(
    new THREE.CylinderGeometry(options.upperRadiusTop, options.upperRadiusBottom, options.upperLength, 14, 1, false),
    material,
  );
  upper.position.y = -options.upperLength / 2;
  upper.castShadow = true;
  root.add(upper);

  const lower = new THREE.Group();
  lower.position.y = -options.upperLength;
  root.add(lower);

  const lowerMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(options.lowerRadiusTop, options.lowerRadiusBottom, options.lowerLength, 12, 1, false),
    material,
  );
  lowerMesh.position.y = -options.lowerLength / 2;
  lowerMesh.castShadow = true;
  lower.add(lowerMesh);

  const ankle = new THREE.Group();
  ankle.position.y = -options.lowerLength * 0.98;
  lower.add(ankle);

  const paw = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), pawMaterial);
  paw.scale.set(1.4, 0.6, 1.8);
  paw.position.y = -0.06;
  paw.castShadow = true;
  ankle.add(paw);

  root.castShadow = true;
  lower.castShadow = true;

  return {
    root,
    lower,
    baseRoot: 0,
    baseLower: 0,
  };
}

function createCatMesh(): THREE.Group {
  const group = new THREE.Group();
  const furMaterial = new THREE.MeshStandardMaterial({ color: CAT_COLOR, roughness: 0.65, metalness: 0.08 });
  const accentMaterial = new THREE.MeshStandardMaterial({ color: CAT_ACCENT, roughness: 0.6, metalness: 0.05 });
  const bellyMaterial = new THREE.MeshStandardMaterial({ color: CAT_BELLY, roughness: 0.85, metalness: 0.02 });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: CAT_DARK, roughness: 0.5, metalness: 0.08 });
  const stripeMaterial = new THREE.MeshStandardMaterial({ color: CAT_STRIPE, roughness: 0.55, metalness: 0.04 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.76, 20, 28), furMaterial);
  body.rotation.x = Math.PI / 2;
  body.position.set(0, 0.44, -0.02);
  body.castShadow = true;
  group.add(body);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 18), furMaterial);
  chest.scale.set(0.75, 0.58, 0.9);
  chest.position.set(0, 0.46, 0.14);
  chest.castShadow = true;
  group.add(chest);

  const haunch = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 18), furMaterial);
  haunch.scale.set(0.78, 0.62, 1.04);
  haunch.position.set(0, 0.42, -0.34);
  haunch.castShadow = true;
  group.add(haunch);

  const belly = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.58, 16, 20), bellyMaterial);
  belly.rotation.x = Math.PI / 2;
  belly.position.set(0, 0.34, -0.02);
  belly.castShadow = false;
  group.add(belly);

  const stripeRidgeGeo = new THREE.CylinderGeometry(0.08, 0.11, 0.32, 10, 1, true);
  stripeRidgeGeo.rotateX(Math.PI / 2);
  const stripeRidge = new THREE.Mesh(stripeRidgeGeo, stripeMaterial);
  stripeRidge.position.set(0, 0.44, -0.12);
  stripeRidge.scale.set(1, 1, 1.1);
  group.add(stripeRidge);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 12, 24), accentMaterial);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0.57, 0.16);
  collar.castShadow = true;
  group.add(collar);

  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.78, 0.26);
  headPivot.rotation.x = -Math.PI * 0.14;
  group.add(headPivot);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 26, 20), furMaterial);
  head.position.set(0, 0, 0.12);
  head.castShadow = true;
  headPivot.add(head);

  const cheekGeo = new THREE.SphereGeometry(0.12, 18, 14);
  const leftCheek = new THREE.Mesh(cheekGeo, furMaterial);
  leftCheek.position.set(-0.12, -0.02, 0.14);
  leftCheek.scale.set(0.9, 0.8, 1.1);
  const rightCheek = leftCheek.clone();
  rightCheek.position.x = 0.12;
  headPivot.add(leftCheek, rightCheek);

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 14), bellyMaterial);
  muzzle.position.set(0, -0.05, 0.26);
  muzzle.scale.set(1.2, 0.7, 1.4);
  headPivot.add(muzzle);

  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.008, 8, 24, Math.PI), darkMaterial);
  mouth.rotation.set(Math.PI / 2, 0, 0);
  mouth.position.set(0, -0.09, 0.32);
  headPivot.add(mouth);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 14), accentMaterial);
  nose.position.set(0, -0.02, 0.35);
  nose.rotation.x = Math.PI;
  headPivot.add(nose);

  const eyeGeo = new THREE.SphereGeometry(0.05, 16, 14);
  const irisMat = new THREE.MeshStandardMaterial({ color: 0x224255, emissive: 0x0b1e26, emissiveIntensity: 0.45 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x081012, emissive: 0x0a1113, emissiveIntensity: 0.3 });
  const leftEye = new THREE.Mesh(eyeGeo, irisMat);
  leftEye.scale.set(1, 1.2, 0.65);
  leftEye.position.set(-0.09, 0.03, 0.24);
  const rightEye = leftEye.clone();
  rightEye.position.x = 0.09;
  headPivot.add(leftEye, rightEye);

  const pupilGeo = new THREE.SphereGeometry(0.022, 12, 10);
  const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
  leftPupil.scale.set(1, 1.8, 0.5);
  leftPupil.position.set(-0.09, 0.03, 0.28);
  const rightPupil = leftPupil.clone();
  rightPupil.position.x = 0.09;
  headPivot.add(leftPupil, rightPupil);

  const eyebrowGeo = new THREE.BoxGeometry(0.12, 0.02, 0.02);
  const eyebrowMat = new THREE.MeshStandardMaterial({ color: CAT_DARK, roughness: 0.6 });
  const leftBrow = new THREE.Mesh(eyebrowGeo, eyebrowMat);
  leftBrow.position.set(-0.09, 0.12, 0.2);
  leftBrow.rotation.z = Math.PI * 0.08;
  const rightBrow = leftBrow.clone();
  rightBrow.position.x = 0.09;
  rightBrow.rotation.z = -Math.PI * 0.08;
  headPivot.add(leftBrow, rightBrow);

  const whiskerGeo = new THREE.BoxGeometry(0.28, 0.008, 0.01);
  const whiskerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const leftWhisker = new THREE.Mesh(whiskerGeo, whiskerMat);
  leftWhisker.position.set(-0.17, -0.03, 0.32);
  leftWhisker.rotation.y = Math.PI * 0.04;
  const rightWhisker = leftWhisker.clone();
  rightWhisker.position.x = 0.17;
  rightWhisker.rotation.y = -Math.PI * 0.04;
  headPivot.add(leftWhisker, rightWhisker);

  const earOuterGeo = new THREE.ConeGeometry(0.13, 0.26, 14);
  const earInnerGeo = new THREE.ConeGeometry(0.09, 0.2, 14);
  const earOuterMat = new THREE.MeshStandardMaterial({ color: CAT_COLOR, roughness: 0.6 });
  const earInnerMat = new THREE.MeshStandardMaterial({ color: CAT_ACCENT, roughness: 0.55 });

  function createEar(sign: 1 | -1): THREE.Group {
    const earPivot = new THREE.Group();
    earPivot.position.set(0.14 * sign, 0.21, -0.02);
    earPivot.rotation.set(Math.PI * 0.12, sign * Math.PI * 0.08, sign * Math.PI * 0.24);
    const outer = new THREE.Mesh(earOuterGeo, earOuterMat);
    outer.position.y = 0.13;
    outer.rotation.x = -Math.PI * 0.08;
    outer.castShadow = true;
    earPivot.add(outer);
    const inner = new THREE.Mesh(earInnerGeo, earInnerMat);
    inner.position.y = 0.1;
    inner.position.z = 0.01;
    inner.scale.set(0.82, 0.78, 0.82);
    inner.rotation.x = -Math.PI * 0.05;
    earPivot.add(inner);
    return earPivot;
  }

  const leftEar = createEar(-1);
  const rightEar = createEar(1);
  headPivot.add(leftEar, rightEar);

  const pawMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, metalness: 0.01 });
  const frontLeftLeg = createLeg(furMaterial, pawMaterial, {
    upperLength: 0.32,
    lowerLength: 0.28,
    upperRadiusTop: 0.08,
    upperRadiusBottom: 0.09,
    lowerRadiusTop: 0.07,
    lowerRadiusBottom: 0.08,
  });
  frontLeftLeg.root.position.set(-0.18, 0.47, 0.18);
  const frontRightLeg = createLeg(furMaterial, pawMaterial, {
    upperLength: 0.32,
    lowerLength: 0.28,
    upperRadiusTop: 0.08,
    upperRadiusBottom: 0.09,
    lowerRadiusTop: 0.07,
    lowerRadiusBottom: 0.08,
  });
  frontRightLeg.root.position.set(0.18, 0.47, 0.18);
  const backLeftLeg = createLeg(furMaterial, pawMaterial, {
    upperLength: 0.34,
    lowerLength: 0.32,
    upperRadiusTop: 0.09,
    upperRadiusBottom: 0.11,
    lowerRadiusTop: 0.08,
    lowerRadiusBottom: 0.1,
  });
  backLeftLeg.root.position.set(-0.2, 0.45, -0.28);
  const backRightLeg = createLeg(furMaterial, pawMaterial, {
    upperLength: 0.34,
    lowerLength: 0.32,
    upperRadiusTop: 0.09,
    upperRadiusBottom: 0.11,
    lowerRadiusTop: 0.08,
    lowerRadiusBottom: 0.1,
  });
  backRightLeg.root.position.set(0.2, 0.45, -0.28);

  frontLeftLeg.baseRoot = -0.3;
  frontRightLeg.baseRoot = -0.3;
  backLeftLeg.baseRoot = -0.36;
  backRightLeg.baseRoot = -0.36;
  frontLeftLeg.baseLower = 0.35;
  frontRightLeg.baseLower = 0.35;
  backLeftLeg.baseLower = 0.45;
  backRightLeg.baseLower = 0.45;

  frontLeftLeg.root.rotation.x = frontLeftLeg.baseRoot;
  frontRightLeg.root.rotation.x = frontRightLeg.baseRoot;
  backLeftLeg.root.rotation.x = backLeftLeg.baseRoot;
  backRightLeg.root.rotation.x = backRightLeg.baseRoot;
  frontLeftLeg.lower.rotation.x = frontLeftLeg.baseLower;
  frontRightLeg.lower.rotation.x = frontRightLeg.baseLower;
  backLeftLeg.lower.rotation.x = backLeftLeg.baseLower;
  backRightLeg.lower.rotation.x = backRightLeg.baseLower;

  group.add(frontLeftLeg.root, frontRightLeg.root, backLeftLeg.root, backRightLeg.root);

  const tailBase = new THREE.Group();
  tailBase.position.set(0, 0.52, -0.46);
  tailBase.rotation.x = -Math.PI * 0.16;
  group.add(tailBase);

  const tailSegment1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.085, 0.32, 12), furMaterial);
  tailSegment1.position.y = 0.16;
  tailSegment1.castShadow = true;
  tailBase.add(tailSegment1);

  const tailMid = new THREE.Group();
  tailMid.position.y = 0.3;
  tailSegment1.add(tailMid);
  tailMid.rotation.set(Math.PI * 0.2, 0, -Math.PI * 0.05);

  const tailSegment2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.32, 12), furMaterial);
  tailSegment2.position.y = 0.15;
  tailSegment2.castShadow = true;
  tailMid.add(tailSegment2);

  const tailTip = new THREE.Group();
  tailTip.position.y = 0.29;
  tailSegment2.add(tailTip);
  tailTip.rotation.set(Math.PI * 0.14, 0, Math.PI * 0.06);

  const tailSegment3 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.3, 12), accentMaterial);
  tailSegment3.position.y = 0.14;
  tailSegment3.castShadow = true;
  tailTip.add(tailSegment3);

  const tailStripeGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.1, 10, 1, true);
  tailStripeGeo.rotateX(Math.PI / 2);
  const tailStripe = new THREE.Mesh(tailStripeGeo, darkMaterial);
  tailStripe.position.set(0, 0.14, 0);
  tailSegment3.add(tailStripe);

  const rig: CatRigData = {
    headPivot,
    headBaseY: headPivot.position.y,
    headBaseRotX: headPivot.rotation.x,
    tail: [tailBase, tailMid, tailTip],
    tailBaseRotations: [tailBase.rotation.x, tailMid.rotation.x, tailTip.rotation.x],
    frontLeftLeg,
    frontRightLeg,
    backLeftLeg,
    backRightLeg,
    whiskers: [leftWhisker, rightWhisker],
    whiskerBaseRot: leftWhisker.rotation.y,
    ears: [leftEar, rightEar],
    earBaseRot: leftEar.rotation.x,
    time: Math.random() * Math.PI * 2,
  };

  group.userData.cat = rig;

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
