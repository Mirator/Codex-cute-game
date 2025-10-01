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

const LOW_DETAIL = {
  cylinderRadial: 8,
  latheSegments: 9,
  coneRadial: 7,
} as const;

export interface LegRigData {
  root: THREE.Group;
  lower: THREE.Group;
  baseRoot: number;
  baseLower: number;
}

export interface CatRigData {
  headPivot: THREE.Group;
  headBaseY: number;
  headBaseRotX: number;
  tail: THREE.Group[];
  tailBaseRotations: number[];
  frontLeftLeg: LegRigData;
  frontRightLeg: LegRigData;
  backLeftLeg: LegRigData;
  backRightLeg: LegRigData;
  whiskers: [THREE.Object3D, THREE.Object3D];
  whiskerBaseRot: number;
  ears: [THREE.Group, THREE.Group];
  earBaseRot: number;
  time: number;
}

function createLeg(
  material: THREE.Material,
  pawMaterial: THREE.Material,
  options: {
    upperLength: number;
    lowerLength: number;
    upperWidth: number;
    upperDepth: number;
    lowerWidth: number;
    lowerDepth: number;
    upperForwardOffset?: number;
    lowerForwardOffset?: number;
    kneeOffset?: number;
  },
): LegRigData {
  const root = new THREE.Group();
  const upper = new THREE.Mesh(
    new THREE.BoxGeometry(options.upperWidth, options.upperLength, options.upperDepth),
    material,
  );
  upper.position.set(0, -options.upperLength / 2, options.upperForwardOffset ?? 0);
  upper.castShadow = true;
  root.add(upper);

  const lower = new THREE.Group();
  lower.position.set(0, -options.upperLength, options.kneeOffset ?? 0);
  root.add(lower);

  const lowerMesh = new THREE.Mesh(
    new THREE.BoxGeometry(options.lowerWidth, options.lowerLength, options.lowerDepth),
    material,
  );
  lowerMesh.position.set(0, -options.lowerLength / 2, options.lowerForwardOffset ?? 0);
  lowerMesh.castShadow = true;
  lower.add(lowerMesh);

  const ankle = new THREE.Group();
  ankle.position.set(0, -options.lowerLength * 0.95, options.lowerForwardOffset ?? 0);
  lower.add(ankle);

  const paw = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), pawMaterial);
  paw.scale.set(1.2, 0.58, 1.6);
  paw.position.set(0, -0.058, options.lowerForwardOffset ? -0.005 : 0);
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
  const furMaterial = new THREE.MeshStandardMaterial({
    color: CAT_COLOR,
    roughness: 0.65,
    metalness: 0.08,
    flatShading: true,
  });
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: CAT_ACCENT,
    roughness: 0.6,
    metalness: 0.05,
    flatShading: true,
  });
  const bellyMaterial = new THREE.MeshStandardMaterial({
    color: CAT_BELLY,
    roughness: 0.85,
    metalness: 0.02,
    flatShading: true,
  });
  const darkMaterial = new THREE.MeshStandardMaterial({
    color: CAT_DARK,
    roughness: 0.5,
    metalness: 0.08,
    flatShading: true,
  });
  const stripeMaterial = new THREE.MeshStandardMaterial({
    color: CAT_STRIPE,
    roughness: 0.55,
    metalness: 0.04,
    flatShading: true,
  });

  const bodyProfile = [
    new THREE.Vector2(0, -0.48),
    new THREE.Vector2(0.12, -0.46),
    new THREE.Vector2(0.24, -0.36),
    new THREE.Vector2(0.3, -0.2),
    new THREE.Vector2(0.3, -0.02),
    new THREE.Vector2(0.27, 0.14),
    new THREE.Vector2(0.2, 0.3),
    new THREE.Vector2(0.12, 0.4),
    new THREE.Vector2(0.05, 0.46),
    new THREE.Vector2(0, 0.48),
  ];

  const body = new THREE.Mesh(new THREE.LatheGeometry(bodyProfile, LOW_DETAIL.latheSegments), furMaterial);
  body.rotation.x = Math.PI / 2;
  body.position.set(0, 0.44, -0.05);
  body.scale.set(0.92, 0.88, 1.08);
  body.castShadow = true;
  group.add(body);

  const chest = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 0), furMaterial);
  chest.scale.set(0.64, 0.5, 0.9);
  chest.position.set(0, 0.5, 0.16);
  chest.castShadow = true;
  group.add(chest);

  const haunch = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 0), furMaterial);
  haunch.scale.set(0.76, 0.54, 1.04);
  haunch.position.set(0, 0.4, -0.38);
  haunch.castShadow = true;
  group.add(haunch);

  const belly = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.2, 0.56, LOW_DETAIL.cylinderRadial, 1, false),
    bellyMaterial,
  );
  belly.rotation.x = Math.PI / 2;
  belly.position.set(0, 0.3, -0.02);
  belly.castShadow = false;
  group.add(belly);

  const shoulderBlade = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.22), stripeMaterial);
  shoulderBlade.rotation.set(Math.PI / 2.5, 0, Math.PI * 0.24);
  shoulderBlade.position.set(-0.1, 0.52, 0.02);
  shoulderBlade.castShadow = false;
  const shoulderBladeMirror = shoulderBlade.clone();
  shoulderBladeMirror.position.x = -shoulderBlade.position.x;
  shoulderBladeMirror.rotation.z = -shoulderBlade.rotation.z;
  group.add(shoulderBlade, shoulderBladeMirror);

  const spineHighlight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.7), stripeMaterial);
  spineHighlight.rotation.x = Math.PI / 2;
  spineHighlight.position.set(0, 0.45, -0.12);
  spineHighlight.scale.set(0.9, 1, 1);
  group.add(spineHighlight);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.11, 0.32, LOW_DETAIL.cylinderRadial, 1, false),
    furMaterial,
  );
  neck.rotation.set(Math.PI / 2.25, 0, 0);
  neck.position.set(0, 0.64, 0.16);
  neck.castShadow = true;
  group.add(neck);

  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.045, 0.16), accentMaterial);
  collar.position.set(0, 0.56, 0.14);
  collar.castShadow = true;
  group.add(collar);

  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.82, 0.3);
  headPivot.rotation.x = -Math.PI * 0.18;
  group.add(headPivot);

  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), furMaterial);
  head.scale.set(0.96, 1, 1.08);
  head.position.set(0, 0.02, 0.1);
  head.castShadow = true;
  headPivot.add(head);

  const forehead = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 0), furMaterial);
  forehead.scale.set(1, 0.75, 0.6);
  forehead.position.set(0, 0.12, 0.02);
  headPivot.add(forehead);

  const cheekGeo = new THREE.IcosahedronGeometry(0.13, 0);
  const leftCheek = new THREE.Mesh(cheekGeo, furMaterial);
  leftCheek.position.set(-0.12, -0.02, 0.16);
  leftCheek.scale.set(0.82, 0.76, 1.2);
  const rightCheek = leftCheek.clone();
  rightCheek.position.x = 0.12;
  headPivot.add(leftCheek, rightCheek);

  const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.24), bellyMaterial);
  muzzle.position.set(0, -0.05, 0.28);
  muzzle.scale.set(1.1, 0.7, 1.2);
  headPivot.add(muzzle);

  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.06), darkMaterial);
  mouth.position.set(0, -0.11, 0.33);
  headPivot.add(mouth);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, LOW_DETAIL.coneRadial), accentMaterial);
  nose.position.set(0, -0.02, 0.37);
  nose.rotation.x = Math.PI;
  headPivot.add(nose);

  const eyeGeo = new THREE.IcosahedronGeometry(0.05, 0);
  const irisMat = new THREE.MeshStandardMaterial({
    color: 0x224255,
    emissive: 0x0b1e26,
    emissiveIntensity: 0.45,
    flatShading: true,
  });
  const pupilMat = new THREE.MeshStandardMaterial({
    color: 0x081012,
    emissive: 0x0a1113,
    emissiveIntensity: 0.3,
    flatShading: true,
  });
  const leftEye = new THREE.Mesh(eyeGeo, irisMat);
  leftEye.scale.set(1, 1.32, 0.58);
  leftEye.position.set(-0.086, 0.032, 0.25);
  const rightEye = leftEye.clone();
  rightEye.position.x = 0.086;
  headPivot.add(leftEye, rightEye);

  const pupilGeo = new THREE.IcosahedronGeometry(0.022, 0);
  const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
  leftPupil.scale.set(0.66, 1.9, 0.44);
  leftPupil.position.set(-0.086, 0.03, 0.29);
  const rightPupil = leftPupil.clone();
  rightPupil.position.x = 0.086;
  headPivot.add(leftPupil, rightPupil);

  const eyebrowGeo = new THREE.BoxGeometry(0.12, 0.02, 0.02);
  const eyebrowMat = new THREE.MeshStandardMaterial({ color: CAT_DARK, roughness: 0.6, flatShading: true });
  const leftBrow = new THREE.Mesh(eyebrowGeo, eyebrowMat);
  leftBrow.position.set(-0.088, 0.13, 0.2);
  leftBrow.rotation.z = Math.PI * 0.1;
  const rightBrow = leftBrow.clone();
  rightBrow.position.x = 0.088;
  rightBrow.rotation.z = -Math.PI * 0.1;
  headPivot.add(leftBrow, rightBrow);

  const whiskerMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4,
    flatShading: true,
  });
  whiskerMat.side = THREE.DoubleSide;
  whiskerMat.needsUpdate = true;

  function createWhiskerFan(sign: 1 | -1): THREE.Group {
    const fan = new THREE.Group();
    fan.position.set(0.17 * sign, -0.03, 0.33);
    fan.rotation.y = Math.PI * 0.05 * sign;
    for (let i = 0; i < 3; i += 1) {
      const whisker = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.01), whiskerMat);
      whisker.position.x = 0.14 * -sign;
      whisker.rotation.z = THREE.MathUtils.degToRad(-6 + i * 6) * sign;
      whisker.castShadow = false;
      fan.add(whisker);
    }
    return fan;
  }

  const leftWhisker = createWhiskerFan(-1);
  const rightWhisker = createWhiskerFan(1);
  headPivot.add(leftWhisker, rightWhisker);

  const earOuterGeo = new THREE.ConeGeometry(0.13, 0.26, LOW_DETAIL.coneRadial);
  const earInnerGeo = new THREE.ConeGeometry(0.09, 0.2, LOW_DETAIL.coneRadial);
  const earOuterMat = new THREE.MeshStandardMaterial({ color: CAT_COLOR, roughness: 0.6, flatShading: true });
  const earInnerMat = new THREE.MeshStandardMaterial({ color: CAT_ACCENT, roughness: 0.55, flatShading: true });

  function createEar(sign: 1 | -1): THREE.Group {
    const earPivot = new THREE.Group();
    earPivot.position.set(0.15 * sign, 0.24, -0.04);
    earPivot.rotation.set(Math.PI * 0.16, sign * Math.PI * 0.1, sign * Math.PI * 0.22);
    const outer = new THREE.Mesh(earOuterGeo, earOuterMat);
    outer.position.y = 0.13;
    outer.rotation.x = -Math.PI * 0.12;
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

  const pawMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.82,
    metalness: 0.01,
    flatShading: true,
  });
  const frontLeftLeg = createLeg(furMaterial, pawMaterial, {
    upperLength: 0.3,
    lowerLength: 0.26,
    upperWidth: 0.12,
    upperDepth: 0.14,
    lowerWidth: 0.1,
    lowerDepth: 0.12,
    upperForwardOffset: 0.01,
    lowerForwardOffset: 0.015,
  });
  frontLeftLeg.root.position.set(-0.16, 0.46, 0.18);
  const frontRightLeg = createLeg(furMaterial, pawMaterial, {
    upperLength: 0.3,
    lowerLength: 0.26,
    upperWidth: 0.12,
    upperDepth: 0.14,
    lowerWidth: 0.1,
    lowerDepth: 0.12,
    upperForwardOffset: 0.01,
    lowerForwardOffset: 0.015,
  });
  frontRightLeg.root.position.set(0.16, 0.46, 0.18);
  const backLeftLeg = createLeg(furMaterial, pawMaterial, {
    upperLength: 0.32,
    lowerLength: 0.28,
    upperWidth: 0.14,
    upperDepth: 0.18,
    lowerWidth: 0.12,
    lowerDepth: 0.16,
    kneeOffset: -0.01,
    lowerForwardOffset: -0.005,
  });
  backLeftLeg.root.position.set(-0.18, 0.44, -0.3);
  const backRightLeg = createLeg(furMaterial, pawMaterial, {
    upperLength: 0.32,
    lowerLength: 0.28,
    upperWidth: 0.14,
    upperDepth: 0.18,
    lowerWidth: 0.12,
    lowerDepth: 0.16,
    kneeOffset: -0.01,
    lowerForwardOffset: -0.005,
  });
  backRightLeg.root.position.set(0.18, 0.44, -0.3);

  frontLeftLeg.baseRoot = -0.28;
  frontRightLeg.baseRoot = -0.28;
  backLeftLeg.baseRoot = -0.34;
  backRightLeg.baseRoot = -0.34;
  frontLeftLeg.baseLower = 0.38;
  frontRightLeg.baseLower = 0.38;
  backLeftLeg.baseLower = 0.48;
  backRightLeg.baseLower = 0.48;

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
  tailBase.position.set(0, 0.5, -0.46);
  tailBase.rotation.set(-Math.PI * 0.12, 0, Math.PI * 0.05);
  group.add(tailBase);

  const tailSegment1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.12), furMaterial);
  tailSegment1.position.y = 0.17;
  tailSegment1.rotation.set(Math.PI * 0.08, 0, -Math.PI * 0.08);
  tailSegment1.castShadow = true;
  tailBase.add(tailSegment1);

  const tailMid = new THREE.Group();
  tailMid.position.y = 0.32;
  tailSegment1.add(tailMid);
  tailMid.rotation.set(Math.PI * 0.26, 0, Math.PI * 0.12);

  const tailSegment2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.36, 0.1), furMaterial);
  tailSegment2.position.y = 0.18;
  tailSegment2.scale.set(0.88, 1, 0.88);
  tailSegment2.castShadow = true;
  tailMid.add(tailSegment2);

  const tailTip = new THREE.Group();
  tailTip.position.y = 0.34;
  tailSegment2.add(tailTip);
  tailTip.rotation.set(Math.PI * 0.18, 0, -Math.PI * 0.1);

  const tailSegment3 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.08), accentMaterial);
  tailSegment3.position.y = 0.14;
  tailSegment3.scale.set(0.95, 1, 0.95);
  tailSegment3.castShadow = true;
  tailTip.add(tailSegment3);

  const tailStripe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.12), darkMaterial);
  tailStripe.position.set(0, 0.08, 0);
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
