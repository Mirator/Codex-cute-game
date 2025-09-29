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

export interface LegRigData {
  root: THREE.Group;
  knee: THREE.Group;
  ankle: THREE.Group;
  baseRoot: number;
  baseKnee: number;
  baseAnkle: number;
}

export interface CatRigData {
  spine: THREE.Group;
  spineBaseY: number;
  spineBaseRotX: number;
  spineBaseRotY: number;
  headPivot: THREE.Group;
  headBasePos: THREE.Vector3;
  headBaseRot: THREE.Euler;
  tail: { pivot: THREE.Group; baseX: number; baseY: number }[];
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

function createLeg(material: THREE.Material, pawMaterial: THREE.Material, options: {
  upperLength: number;
  lowerLength: number;
  upperRadiusTop: number;
  upperRadiusBottom: number;
  lowerRadiusTop: number;
  lowerRadiusBottom: number;
  baseRoot: number;
  baseKnee: number;
  baseAnkle: number;
  pawScale: THREE.Vector3;
}): LegRigData {
  const root = new THREE.Group();

  const upper = new THREE.Mesh(
    new THREE.CylinderGeometry(options.upperRadiusTop, options.upperRadiusBottom, options.upperLength, 16, 1, false),
    material,
  );
  upper.position.y = -options.upperLength / 2;
  upper.castShadow = true;
  root.add(upper);

  const knee = new THREE.Group();
  knee.position.y = -options.upperLength;
  root.add(knee);

  const lowerMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(options.lowerRadiusTop, options.lowerRadiusBottom, options.lowerLength, 14, 1, false),
    material,
  );
  lowerMesh.position.y = -options.lowerLength / 2;
  lowerMesh.castShadow = true;
  knee.add(lowerMesh);

  const ankle = new THREE.Group();
  ankle.position.y = -options.lowerLength;
  knee.add(ankle);

  const paw = new THREE.Mesh(new THREE.SphereGeometry(0.085, 18, 14), pawMaterial);
  paw.scale.copy(options.pawScale);
  paw.position.y = -0.04;
  paw.castShadow = true;
  ankle.add(paw);

  root.rotation.x = options.baseRoot;
  knee.rotation.x = options.baseKnee;
  ankle.rotation.x = options.baseAnkle;

  return {
    root,
    knee,
    ankle,
    baseRoot: options.baseRoot,
    baseKnee: options.baseKnee,
    baseAnkle: options.baseAnkle,
  };
}


function createCatMesh(): THREE.Group {
  const group = new THREE.Group();
  const furMaterial = new THREE.MeshStandardMaterial({ color: CAT_COLOR, roughness: 0.6, metalness: 0.08 });
  const accentMaterial = new THREE.MeshStandardMaterial({ color: CAT_ACCENT, roughness: 0.55, metalness: 0.08 });
  const bellyMaterial = new THREE.MeshStandardMaterial({ color: CAT_BELLY, roughness: 0.85, metalness: 0.02 });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: CAT_DARK, roughness: 0.5, metalness: 0.08 });
  const stripeMaterial = new THREE.MeshStandardMaterial({ color: CAT_STRIPE, roughness: 0.5, metalness: 0.05 });
  const charmMaterial = new THREE.MeshStandardMaterial({ color: 0xffd67d, roughness: 0.35, metalness: 0.75 });

  const spine = new THREE.Group();
  spine.position.set(0, 0.44, 0);
  group.add(spine);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.72, 20, 28), furMaterial);
  body.rotation.z = Math.PI / 2;
  body.position.set(0, 0.02, -0.02);
  body.castShadow = true;
  spine.add(body);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 18), furMaterial);
  chest.scale.set(0.76, 0.64, 0.9);
  chest.position.set(0, 0.04, 0.2);
  chest.castShadow = true;
  spine.add(chest);

  const haunch = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 18), furMaterial);
  haunch.scale.set(0.78, 0.62, 1.08);
  haunch.position.set(0, -0.02, -0.34);
  haunch.castShadow = true;
  spine.add(haunch);

  const belly = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.52, 16, 20), bellyMaterial);
  belly.rotation.z = Math.PI / 2;
  belly.position.set(0, -0.1, -0.02);
  belly.castShadow = false;
  spine.add(belly);

  const chestFluff = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 14), bellyMaterial);
  chestFluff.scale.set(1.6, 0.6, 1.2);
  chestFluff.position.set(0, -0.12, 0.26);
  spine.add(chestFluff);

  const stripeSpineGeo = new THREE.CylinderGeometry(0.06, 0.09, 0.34, 12, 1, true);
  stripeSpineGeo.rotateX(Math.PI / 2);
  const stripeSpine = new THREE.Mesh(stripeSpineGeo, stripeMaterial);
  stripeSpine.position.set(0, 0.12, -0.12);
  stripeSpine.scale.set(1, 1, 1.1);
  spine.add(stripeSpine);

  const stripeLower = stripeSpine.clone();
  stripeLower.position.set(0, 0.04, -0.28);
  stripeLower.scale.set(0.9, 1, 0.9);
  spine.add(stripeLower);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.026, 14, 28), accentMaterial);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0.02, 0.28);
  collar.castShadow = true;
  spine.add(collar);

  const charm = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 14), charmMaterial);
  charm.position.set(0, -0.05, 0.32);
  charm.castShadow = true;
  collar.add(charm);

  const charmLoop = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.007, 8, 16), darkMaterial);
  charmLoop.rotation.x = Math.PI / 2;
  charmLoop.position.set(0, 0.03, 0);
  charm.add(charmLoop);

  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.16, 0.38);
  spine.add(headPivot);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 26, 20), furMaterial);
  head.position.set(0, 0.02, 0.06);
  head.castShadow = true;
  headPivot.add(head);

  const forehead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 14), furMaterial);
  forehead.scale.set(1, 0.8, 0.8);
  forehead.position.set(0, 0.12, 0.02);
  headPivot.add(forehead);

  const cheekGeo = new THREE.SphereGeometry(0.12, 18, 14);
  const leftCheek = new THREE.Mesh(cheekGeo, furMaterial);
  leftCheek.position.set(-0.11, -0.02, 0.18);
  leftCheek.scale.set(0.95, 0.82, 1.25);
  const rightCheek = leftCheek.clone();
  rightCheek.position.x = 0.11;
  headPivot.add(leftCheek, rightCheek);

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 14), bellyMaterial);
  muzzle.position.set(0, -0.06, 0.24);
  muzzle.scale.set(1.42, 0.72, 1.3);
  headPivot.add(muzzle);

  const chin = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), bellyMaterial);
  chin.position.set(0, -0.12, 0.2);
  chin.scale.set(1.4, 0.6, 1.1);
  headPivot.add(chin);

  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.009, 8, 24, Math.PI), darkMaterial);
  mouth.rotation.set(Math.PI / 2, 0, 0);
  mouth.position.set(0, -0.09, 0.26);
  headPivot.add(mouth);

  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.005, 6, 20, Math.PI), darkMaterial);
  smile.rotation.set(Math.PI / 2, 0, 0);
  smile.position.set(0, -0.086, 0.27);
  headPivot.add(smile);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.034, 0.08, 16), accentMaterial);
  nose.position.set(0, -0.02, 0.3);
  nose.rotation.x = Math.PI;
  headPivot.add(nose);

  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
  const irisMat = new THREE.MeshStandardMaterial({ color: 0x2c4a61, emissive: 0x1a3144, emissiveIntensity: 0.45 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x05080a, emissive: 0x040608, emissiveIntensity: 0.4 });

  const eyeWhiteGeo = new THREE.SphereGeometry(0.05, 16, 14);
  const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
  leftEyeWhite.scale.set(0.9, 1.12, 0.62);
  leftEyeWhite.position.set(-0.09, 0.02, 0.18);
  const rightEyeWhite = leftEyeWhite.clone();
  rightEyeWhite.position.x = 0.09;
  headPivot.add(leftEyeWhite, rightEyeWhite);

  const irisGeo = new THREE.SphereGeometry(0.036, 16, 14);
  const leftIris = new THREE.Mesh(irisGeo, irisMat);
  leftIris.scale.set(0.9, 1.6, 0.4);
  leftIris.position.set(-0.09, 0.02, 0.22);
  const rightIris = leftIris.clone();
  rightIris.position.x = 0.09;
  headPivot.add(leftIris, rightIris);

  const pupilGeo = new THREE.SphereGeometry(0.018, 12, 10);
  const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
  leftPupil.scale.set(0.95, 2.6, 0.32);
  leftPupil.position.set(-0.09, 0.02, 0.24);
  const rightPupil = leftPupil.clone();
  rightPupil.position.x = 0.09;
  headPivot.add(leftPupil, rightPupil);

  const eyeShineGeo = new THREE.SphereGeometry(0.01, 12, 10);
  const eyeShineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.8 });
  const leftEyeShine = new THREE.Mesh(eyeShineGeo, eyeShineMat);
  leftEyeShine.position.set(-0.07, 0.06, 0.22);
  const rightEyeShine = leftEyeShine.clone();
  rightEyeShine.position.x = 0.07;
  headPivot.add(leftEyeShine, rightEyeShine);

  const blushMat = new THREE.MeshStandardMaterial({ color: 0xffb6c6, emissive: 0xff6f9a, emissiveIntensity: 0.08, roughness: 0.6 });
  const blushGeo = new THREE.SphereGeometry(0.05, 16, 12);
  const leftBlush = new THREE.Mesh(blushGeo, blushMat);
  leftBlush.scale.set(1.4, 0.45, 0.7);
  leftBlush.position.set(-0.1, -0.05, 0.2);
  const rightBlush = leftBlush.clone();
  rightBlush.position.x = 0.1;
  headPivot.add(leftBlush, rightBlush);

  const eyebrowGeo = new THREE.BoxGeometry(0.11, 0.024, 0.02);
  const eyebrowMat = new THREE.MeshStandardMaterial({ color: CAT_DARK, roughness: 0.55 });
  const leftBrow = new THREE.Mesh(eyebrowGeo, eyebrowMat);
  leftBrow.position.set(-0.09, 0.11, 0.17);
  leftBrow.rotation.z = Math.PI * 0.12;
  const rightBrow = leftBrow.clone();
  rightBrow.position.x = 0.09;
  rightBrow.rotation.z = -Math.PI * 0.12;
  headPivot.add(leftBrow, rightBrow);

  const whiskerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.05 });
  const whiskerGeo = new THREE.BoxGeometry(0.26, 0.01, 0.01);
  const whiskerGroupLeft = new THREE.Group();
  whiskerGroupLeft.position.set(-0.18, -0.04, 0.24);
  whiskerGroupLeft.rotation.y = Math.PI * 0.08;
  whiskerGroupLeft.rotation.z = Math.PI * 0.04;
  for (const offset of [-0.02, 0, 0.02]) {
    const whisker = new THREE.Mesh(whiskerGeo, whiskerMat);
    whisker.position.set(-0.13, offset, 0);
    whisker.castShadow = false;
    whiskerGroupLeft.add(whisker);
  }
  headPivot.add(whiskerGroupLeft);

  const whiskerGroupRight = new THREE.Group();
  whiskerGroupRight.position.set(0.18, -0.04, 0.24);
  whiskerGroupRight.rotation.y = -Math.PI * 0.08;
  whiskerGroupRight.rotation.z = -Math.PI * 0.04;
  for (const offset of [-0.02, 0, 0.02]) {
    const whisker = new THREE.Mesh(whiskerGeo, whiskerMat);
    whisker.position.set(0.13, offset, 0);
    whisker.castShadow = false;
    whiskerGroupRight.add(whisker);
  }
  headPivot.add(whiskerGroupRight);

  const earOuterGeo = new THREE.ConeGeometry(0.12, 0.24, 16);
  const earInnerGeo = new THREE.ConeGeometry(0.085, 0.18, 16);

  function createEar(sign: 1 | -1): THREE.Group {
    const earPivot = new THREE.Group();
    earPivot.position.set(0.12 * sign, 0.22, -0.02);
    earPivot.rotation.z = sign * Math.PI * 0.2;
    const outer = new THREE.Mesh(earOuterGeo, furMaterial);
    outer.position.y = 0.12;
    outer.castShadow = true;
    earPivot.add(outer);
    const inner = new THREE.Mesh(earInnerGeo, accentMaterial);
    inner.position.y = 0.11;
    inner.scale.set(0.86, 0.86, 0.86);
    earPivot.add(inner);
    const fluff = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 10), bellyMaterial);
    fluff.position.set(0, 0.05, 0.02);
    fluff.rotation.x = Math.PI;
    earPivot.add(fluff);
    return earPivot;
  }

  const leftEar = createEar(-1);
  const rightEar = createEar(1);
  leftEar.rotation.x = Math.PI * 0.08;
  rightEar.rotation.x = Math.PI * 0.08;
  headPivot.add(leftEar, rightEar);

  const pawMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, metalness: 0.02 });
  const frontLeftLeg = createLeg(furMaterial, pawMaterial, {
    upperLength: 0.28,
    lowerLength: 0.26,
    upperRadiusTop: 0.07,
    upperRadiusBottom: 0.09,
    lowerRadiusTop: 0.06,
    lowerRadiusBottom: 0.08,
    baseRoot: -0.32,
    baseKnee: 0.48,
    baseAnkle: -0.18,
    pawScale: new THREE.Vector3(1.35, 0.52, 1.8),
  });
  frontLeftLeg.root.position.set(-0.17, -0.1, 0.26);
  frontLeftLeg.root.rotation.z = 0.12;
  spine.add(frontLeftLeg.root);

  const frontRightLeg = createLeg(furMaterial, pawMaterial, {
    upperLength: 0.28,
    lowerLength: 0.26,
    upperRadiusTop: 0.07,
    upperRadiusBottom: 0.09,
    lowerRadiusTop: 0.06,
    lowerRadiusBottom: 0.08,
    baseRoot: -0.32,
    baseKnee: 0.48,
    baseAnkle: -0.18,
    pawScale: new THREE.Vector3(1.35, 0.52, 1.8),
  });
  frontRightLeg.root.position.set(0.17, -0.1, 0.26);
  frontRightLeg.root.rotation.z = -0.12;
  spine.add(frontRightLeg.root);

  const backLeftLeg = createLeg(furMaterial, pawMaterial, {
    upperLength: 0.32,
    lowerLength: 0.3,
    upperRadiusTop: 0.08,
    upperRadiusBottom: 0.11,
    lowerRadiusTop: 0.07,
    lowerRadiusBottom: 0.1,
    baseRoot: -0.38,
    baseKnee: 0.62,
    baseAnkle: -0.25,
    pawScale: new THREE.Vector3(1.55, 0.5, 2.05),
  });
  backLeftLeg.root.position.set(-0.19, -0.11, -0.22);
  backLeftLeg.root.rotation.z = 0.08;
  spine.add(backLeftLeg.root);

  const backRightLeg = createLeg(furMaterial, pawMaterial, {
    upperLength: 0.32,
    lowerLength: 0.3,
    upperRadiusTop: 0.08,
    upperRadiusBottom: 0.11,
    lowerRadiusTop: 0.07,
    lowerRadiusBottom: 0.1,
    baseRoot: -0.38,
    baseKnee: 0.62,
    baseAnkle: -0.25,
    pawScale: new THREE.Vector3(1.55, 0.5, 2.05),
  });
  backRightLeg.root.position.set(0.19, -0.11, -0.22);
  backRightLeg.root.rotation.z = -0.08;
  spine.add(backRightLeg.root);

  const tailRoot = new THREE.Group();
  tailRoot.position.set(0, -0.04, -0.44);
  tailRoot.rotation.x = Math.PI * 0.42;
  tailRoot.rotation.y = Math.PI * 0.02;
  spine.add(tailRoot);

  const tailBase = new THREE.Group();
  tailRoot.add(tailBase);

  const tailBaseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.32, 14), furMaterial);
  tailBaseMesh.position.y = 0.16;
  tailBaseMesh.castShadow = true;
  tailBase.add(tailBaseMesh);

  const tailMid = new THREE.Group();
  tailMid.position.y = 0.32;
  tailBase.add(tailMid);
  tailMid.rotation.x = Math.PI * 0.12;

  const tailMidMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.3, 14), furMaterial);
  tailMidMesh.position.y = 0.15;
  tailMidMesh.castShadow = true;
  tailMid.add(tailMidMesh);

  const tailTip = new THREE.Group();
  tailTip.position.y = 0.3;
  tailMid.add(tailTip);
  tailTip.rotation.x = Math.PI * 0.14;

  const tailTipMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.28, 14), accentMaterial);
  tailTipMesh.position.y = 0.14;
  tailTipMesh.castShadow = true;
  tailTip.add(tailTipMesh);

  const tailStripeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.11, 12, 1, true);
  tailStripeGeo.rotateX(Math.PI / 2);
  const tailStripe = new THREE.Mesh(tailStripeGeo, stripeMaterial);
  tailStripe.position.set(0, 0.12, 0);
  tailTipMesh.add(tailStripe);

  const tailPom = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), accentMaterial);
  tailPom.position.set(0, 0.16, 0);
  tailTipMesh.add(tailPom);

  const rig: CatRigData = {
    spine,
    spineBaseY: spine.position.y,
    spineBaseRotX: spine.rotation.x,
    spineBaseRotY: spine.rotation.y,
    headPivot,
    headBasePos: headPivot.position.clone(),
    headBaseRot: headPivot.rotation.clone(),
    tail: [
      { pivot: tailRoot, baseX: tailRoot.rotation.x, baseY: tailRoot.rotation.y },
      { pivot: tailMid, baseX: tailMid.rotation.x, baseY: tailMid.rotation.y },
      { pivot: tailTip, baseX: tailTip.rotation.x, baseY: tailTip.rotation.y },
    ],
    frontLeftLeg,
    frontRightLeg,
    backLeftLeg,
    backRightLeg,
    whiskers: [whiskerGroupLeft, whiskerGroupRight],
    whiskerBaseRot: whiskerGroupLeft.rotation.y,
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
