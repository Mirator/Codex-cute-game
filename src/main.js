import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const container = document.getElementById('experience');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0b1324, 0.02);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
const INITIAL_CAMERA_YAW = Math.PI * 0.8;
let cameraYaw = INITIAL_CAMERA_YAW;
let cameraPitch = 0.2;
camera.position.set(Math.sin(cameraYaw) * 6, 4, Math.cos(cameraYaw) * 6);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enabled = false;
orbitControls.enableDamping = true;
orbitControls.enablePan = false;
orbitControls.minDistance = 2.4;
orbitControls.maxDistance = 12;
orbitControls.maxPolarAngle = Math.PI / 2;

resizeRenderer();
window.addEventListener('resize', resizeRenderer);

const clock = new THREE.Clock();
const tmpVec1 = new THREE.Vector3();
const tmpVec2 = new THREE.Vector3();
const tmpVec3 = new THREE.Vector3();

class InputManager {
  constructor() {
    this.active = new Set();
    this.pressed = new Set();
    this.layout = this.#detectDefaultLayout();
    this.onLayoutChange = null;
    window.addEventListener('keydown', (event) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        event.preventDefault();
      }
      this.#handleKeyDown(event);
    });
    window.addEventListener('keyup', (event) => {
      this.#handleKeyUp(event);
    });
  }

  get usesAzerty() {
    return this.layout === 'azerty';
  }

  isDown(...identifiers) {
    return identifiers.some((identifier) => this.active.has(this.#normalizeIdentifier(identifier)));
  }

  consume(...identifiers) {
    for (const identifier of identifiers) {
      const normalised = this.#normalizeIdentifier(identifier);
      if (this.pressed.has(normalised)) {
        this.pressed.delete(normalised);
        return true;
      }
    }
    return false;
  }

  frameEnd() {
    this.pressed.clear();
  }

  #detectDefaultLayout() {
    if (typeof navigator !== 'undefined') {
      const locale = (navigator.language || '').toLowerCase();
      if (locale.startsWith('fr') || locale.startsWith('be')) {
        return 'azerty';
      }
    }
    return 'qwerty';
  }

  #handleKeyDown(event) {
    this.#updateLayout(event);
    const identifiers = this.#identifiersFromEvent(event);
    identifiers.forEach((identifier) => {
      if (!this.active.has(identifier)) {
        this.pressed.add(identifier);
      }
      this.active.add(identifier);
    });
  }

  #handleKeyUp(event) {
    const identifiers = this.#identifiersFromEvent(event);
    identifiers.forEach((identifier) => {
      this.active.delete(identifier);
    });
  }

  #identifiersFromEvent(event) {
    const identifiers = new Set();
    identifiers.add(this.#normalizeIdentifier(event.code));
    if (event.key && event.key.length === 1 && event.key !== ' ') {
      identifiers.add(this.#normalizeIdentifier(event.key));
    }
    return identifiers;
  }

  #normalizeIdentifier(identifier) {
    if (!identifier) return identifier;
    return identifier.length === 1 ? identifier.toLowerCase() : identifier;
  }

  #updateLayout(event) {
    const previousLayout = this.layout;
    const key = event.key ? event.key.toLowerCase() : '';
    if (event.code === 'KeyA') {
      if (key === 'q') this.layout = 'azerty';
      else if (key === 'a') this.layout = 'qwerty';
    } else if (event.code === 'KeyQ') {
      if (key === 'a') this.layout = 'azerty';
      else if (key === 'q') this.layout = 'qwerty';
    } else if (event.code === 'KeyW') {
      if (key === 'z') this.layout = 'azerty';
      else if (key === 'w') this.layout = 'qwerty';
    }
    if (previousLayout !== this.layout && typeof this.onLayoutChange === 'function') {
      this.onLayoutChange(this.layout);
    }
  }
}

const input = new InputManager();

function resizeRenderer() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function dampAngle(current, target, smoothing, delta) {
  const diff = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + diff * (1 - Math.exp(-smoothing * delta));
}

function getGroundHeight(x, z) {
  const distance = Math.sqrt(x * x + z * z);
  const hill = Math.cos(distance * 0.12) * 0.4;
  const ripple = Math.sin(x * 0.18) * Math.cos(z * 0.18) * 0.25;
  return hill + ripple * 0.6;
}

class PlayerController {
  constructor() {
    this.group = new THREE.Group();
    this.group.position.set(0, 1.1, 8);

    const robeMat = new THREE.MeshStandardMaterial({
      color: 0xffe5f4,
      roughness: 0.35,
      metalness: 0.08,
      emissive: 0x1d0d1f,
      emissiveIntensity: 0.4,
    });
    const bodyGeo = new THREE.CapsuleGeometry(0.38, 1.2, 16, 24);
    const body = new THREE.Mesh(bodyGeo, robeMat);
    body.castShadow = true;
    body.receiveShadow = true;
    body.position.y = 1.05;
    this.group.add(body);

    const skirtGeo = new THREE.CylinderGeometry(0.9, 0.55, 1.4, 32, 1, true);
    const skirtMat = new THREE.MeshStandardMaterial({
      color: 0xfad0ff,
      roughness: 0.5,
      metalness: 0.1,
      emissive: 0x451b62,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.86,
      side: THREE.DoubleSide,
    });
    const skirt = new THREE.Mesh(skirtGeo, skirtMat);
    skirt.position.y = 0.4;
    skirt.castShadow = true;
    skirt.receiveShadow = true;
    this.group.add(skirt);

    const sashGeo = new THREE.TorusGeometry(0.55, 0.08, 24, 64);
    const sashMat = new THREE.MeshStandardMaterial({
      color: 0xfff6b7,
      roughness: 0.25,
      metalness: 0.35,
      emissive: 0x745a16,
      emissiveIntensity: 0.4,
    });
    const sash = new THREE.Mesh(sashGeo, sashMat);
    sash.rotation.x = Math.PI / 2;
    sash.position.y = 1.02;
    sash.castShadow = true;
    this.group.add(sash);

    const pendantGeo = new THREE.CircleGeometry(0.14, 32);
    const pendantMat = new THREE.MeshStandardMaterial({
      color: 0xfff3fb,
      emissive: 0x5feaff,
      emissiveIntensity: 1.2,
      metalness: 0.6,
      roughness: 0.18,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    });
    const pendant = new THREE.Mesh(pendantGeo, pendantMat);
    pendant.position.set(0, 0.35, 0.36);
    pendant.rotation.y = Math.PI;
    body.add(pendant);

    const capeGeo = new THREE.ConeGeometry(1.2, 2.6, 48, 1, true);
    const capeMat = new THREE.MeshStandardMaterial({
      color: 0x7fe2ff,
      emissive: 0x2566ad,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.62,
      side: THREE.DoubleSide,
    });
    const cape = new THREE.Mesh(capeGeo, capeMat);
    cape.position.set(0, 1.6, 0.18);
    cape.rotation.x = Math.PI;
    cape.castShadow = true;
    this.group.add(cape);

    const headGeo = new THREE.SphereGeometry(0.34, 32, 24);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xfff7f0,
      roughness: 0.3,
      metalness: 0.05,
      emissive: 0x2d1236,
      emissiveIntensity: 0.2,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.75, 0.12);
    head.castShadow = true;
    this.group.add(head);

    const faceGlowGeo = new THREE.CircleGeometry(0.18, 32);
    const faceGlowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 });
    const faceGlow = new THREE.Mesh(faceGlowGeo, faceGlowMat);
    faceGlow.position.set(0, 0.02, 0.34);
    head.add(faceGlow);

    const eyeMat = new THREE.SpriteMaterial({ color: 0x9cfaff, transparent: true, opacity: 0.9 });
    const leftEye = new THREE.Sprite(eyeMat.clone());
    leftEye.position.set(-0.11, 0.06, 0.35);
    leftEye.scale.set(0.12, 0.18, 0.12);
    head.add(leftEye);
    const rightEye = new THREE.Sprite(eyeMat.clone());
    rightEye.position.set(0.11, 0.06, 0.35);
    rightEye.scale.set(0.12, 0.18, 0.12);
    head.add(rightEye);

    const hoodGeo = new THREE.SphereGeometry(0.66, 36, 22, 0, Math.PI * 2, 0, Math.PI / 1.35);
    const hoodMat = new THREE.MeshStandardMaterial({
      color: 0x413f93,
      roughness: 0.35,
      metalness: 0.22,
      emissive: 0x181445,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const hood = new THREE.Mesh(hoodGeo, hoodMat);
    hood.position.set(0, 1.58, 0.02);
    hood.rotation.x = Math.PI * 0.08;
    hood.castShadow = true;
    this.group.add(hood);

    const hairGeo = new THREE.ConeGeometry(0.2, 0.9, 18, 1, true);
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0xffa6e6,
      roughness: 0.4,
      metalness: 0.1,
      emissive: 0x4a134f,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 1.35, -0.2);
    hair.rotation.x = Math.PI;
    this.group.add(hair);

    const armGeo = new THREE.CapsuleGeometry(0.12, 0.5, 12, 18);
    const armMat = new THREE.MeshStandardMaterial({
      color: 0xfff1fb,
      roughness: 0.35,
      metalness: 0.12,
      emissive: 0x432053,
      emissiveIntensity: 0.25,
    });
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.52, 1.08, 0.18);
    leftArm.rotation.z = Math.PI / 1.9;
    leftArm.castShadow = true;
    this.group.add(leftArm);
    const rightArm = leftArm.clone();
    rightArm.material = armMat.clone();
    rightArm.position.x = 0.52;
    rightArm.rotation.z = -Math.PI / 1.9;
    this.group.add(rightArm);

    const bracerGeo = new THREE.TorusGeometry(0.18, 0.05, 16, 48);
    const bracerMat = new THREE.MeshStandardMaterial({
      color: 0xfff2c9,
      roughness: 0.2,
      metalness: 0.6,
      emissive: 0x7c5915,
      emissiveIntensity: 0.4,
    });
    const leftBracer = new THREE.Mesh(bracerGeo, bracerMat);
    leftBracer.rotation.x = Math.PI / 2;
    leftBracer.position.set(0, 0.16, 0);
    leftArm.add(leftBracer);
    const rightBracer = leftBracer.clone();
    rightBracer.material = bracerMat.clone();
    rightArm.add(rightBracer);

    const bootGeo = new THREE.CylinderGeometry(0.28, 0.34, 0.42, 24, 1, true);
    const bootMat = new THREE.MeshStandardMaterial({
      color: 0x30296e,
      roughness: 0.5,
      metalness: 0.22,
      emissive: 0x130a33,
      emissiveIntensity: 0.5,
      side: THREE.DoubleSide,
    });
    const leftBoot = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.position.set(-0.22, 0.14, 0.12);
    leftBoot.castShadow = true;
    leftBoot.receiveShadow = true;
    this.group.add(leftBoot);
    const rightBoot = leftBoot.clone();
    rightBoot.material = bootMat.clone();
    rightBoot.position.x = 0.22;
    this.group.add(rightBoot);

    const bootGemGeo = new THREE.OctahedronGeometry(0.08);
    const bootGemMat = new THREE.MeshStandardMaterial({
      color: 0xaefbff,
      emissive: 0x7cf3ff,
      emissiveIntensity: 1.4,
      transparent: true,
      opacity: 0.9,
    });
    const leftBootGem = new THREE.Mesh(bootGemGeo, bootGemMat);
    leftBootGem.position.set(0, 0.22, 0.32);
    leftBoot.add(leftBootGem);
    const rightBootGem = leftBootGem.clone();
    rightBootGem.material = bootGemMat.clone();
    rightBootGem.position.set(0, 0.22, 0.32);
    rightBoot.add(rightBootGem);

    const staffGeo = new THREE.CylinderGeometry(0.05, 0.08, 1.8, 24);
    const staffMat = new THREE.MeshStandardMaterial({
      color: 0x262347,
      roughness: 0.35,
      metalness: 0.55,
      emissive: 0x121226,
      emissiveIntensity: 0.4,
    });
    const staff = new THREE.Mesh(staffGeo, staffMat);
    staff.position.set(0.48, 1.0, 0.12);
    staff.rotation.z = Math.PI / 5.2;
    staff.castShadow = true;
    this.group.add(staff);

    const staffBraceGeo = new THREE.TorusGeometry(0.14, 0.025, 12, 48);
    const staffBraceMat = new THREE.MeshStandardMaterial({
      color: 0xfff4c2,
      roughness: 0.18,
      metalness: 0.7,
      emissive: 0x725c1f,
      emissiveIntensity: 0.5,
    });
    const staffBrace = new THREE.Mesh(staffBraceGeo, staffBraceMat);
    staffBrace.rotation.x = Math.PI / 2;
    staffBrace.position.y = 0.3;
    staff.add(staffBrace);

    const staffGemGeo = new THREE.OctahedronGeometry(0.24, 1);
    const staffGemMat = new THREE.MeshStandardMaterial({
      color: 0xbef7ff,
      emissive: 0x74f4ff,
      emissiveIntensity: 1.8,
      transparent: true,
      opacity: 0.9,
      roughness: 0.1,
    });
    const staffGem = new THREE.Mesh(staffGemGeo, staffGemMat);
    staffGem.position.set(0, 0.96, 0);
    staff.add(staffGem);

    const staffHaloGeo = new THREE.TorusGeometry(0.3, 0.03, 16, 64);
    const staffHaloMat = new THREE.MeshBasicMaterial({
      color: 0xcffbff,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const staffHalo = new THREE.Mesh(staffHaloGeo, staffHaloMat);
    staffHalo.rotation.x = Math.PI / 2;
    staffHalo.position.y = 0.96;
    staff.add(staffHalo);

    this.velocity = new THREE.Vector3();
    this.heading = INITIAL_CAMERA_YAW;
    this.onGround = true;
    this.glideGrace = 0;
    this.dodgeCooldown = 0;
    this.breathTime = 0;
    this.body = body;
    this.cape = cape;
    this.head = head;
    this.hood = hood;
    this.skirt = skirt;
    this.sash = sash;
    this.leftArm = leftArm;
    this.rightArm = rightArm;
    this.staff = staff;
    this.staffGem = staffGem;
    this.staffHalo = staffHalo;
    this.bootGems = [leftBootGem, rightBootGem];
  }

  update(delta, context) {
    const { input, cameraYaw: camYaw, moodBoost } = context;

    const desired = new THREE.Vector3();
    const forwardKeys = input.usesAzerty ? ['KeyW', 'ArrowUp', 'z'] : ['KeyW', 'ArrowUp'];
    const backwardKeys = input.usesAzerty ? ['KeyS', 'ArrowDown', 's'] : ['KeyS', 'ArrowDown'];
    const leftKeys = input.usesAzerty ? ['KeyA', 'ArrowLeft', 'q'] : ['KeyA', 'ArrowLeft'];
    const rightKeys = input.usesAzerty ? ['KeyD', 'ArrowRight', 'd'] : ['KeyD', 'ArrowRight'];

    if (input.isDown(...forwardKeys)) desired.z += 1;
    if (input.isDown(...backwardKeys)) desired.z -= 1;
    if (input.isDown(...leftKeys)) desired.x -= 1;
    if (input.isDown(...rightKeys)) desired.x += 1;

    if (desired.lengthSq() > 0) desired.normalize();

    const forward = tmpVec1.set(Math.sin(camYaw), 0, Math.cos(camYaw));
    const right = tmpVec2.set(forward.z, 0, -forward.x);
    const moveDirection = tmpVec3.set(0, 0, 0);
    moveDirection.addScaledVector(forward, desired.z);
    moveDirection.addScaledVector(right, desired.x);

    const maxSpeed = 5.6 + moodBoost * 3.4;

    if (moveDirection.lengthSq() > 0) {
      moveDirection.normalize();
      this.velocity.x = THREE.MathUtils.damp(this.velocity.x, moveDirection.x * maxSpeed, 7, delta);
      this.velocity.z = THREE.MathUtils.damp(this.velocity.z, moveDirection.z * maxSpeed, 7, delta);
      const targetHeading = Math.atan2(moveDirection.x, moveDirection.z);
      this.heading = dampAngle(this.heading, targetHeading, 10, delta);
      this.group.rotation.y = this.heading;
    } else {
      this.velocity.x = THREE.MathUtils.damp(this.velocity.x, 0, 6, delta);
      this.velocity.z = THREE.MathUtils.damp(this.velocity.z, 0, 6, delta);
    }

    if (this.onGround) {
      this.velocity.y = 0;
      this.glideGrace = 0.2;
    } else {
      this.velocity.y -= 24 * delta;
      this.glideGrace = Math.max(0, this.glideGrace - delta);
    }

    const jumpPressed = input.consume('Space');
    if (jumpPressed && (this.onGround || this.glideGrace > 0)) {
      this.velocity.y = 9.5 + moodBoost * 2.2;
      this.onGround = false;
      this.glideGrace = 0;
    }

    const gliding = !this.onGround && input.isDown('Space');
    if (gliding) {
      this.velocity.y = Math.max(this.velocity.y, -3.2);
      this.velocity.x = THREE.MathUtils.damp(this.velocity.x, this.velocity.x * 1.05, 1.5, delta);
      this.velocity.z = THREE.MathUtils.damp(this.velocity.z, this.velocity.z * 1.05, 1.5, delta);
    }

    if (input.consume('ShiftLeft') && this.dodgeCooldown <= 0 && moveDirection.lengthSq() > 0.01) {
      const dodgeVector = moveDirection.clone().normalize().multiplyScalar(11);
      this.velocity.add(dodgeVector);
      this.dodgeCooldown = 1.1;
    }

    this.group.position.addScaledVector(this.velocity, delta);

    const groundLevel = getGroundHeight(this.group.position.x, this.group.position.z) + 0.9;
    if (this.group.position.y <= groundLevel) {
      this.group.position.y = groundLevel;
      if (this.velocity.y < 0) this.velocity.y = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    if (this.dodgeCooldown > 0) this.dodgeCooldown -= delta;

    this.breathTime += delta;
    const breath = Math.sin(this.breathTime * 1.6) * 0.04;
    this.head.position.y = 1.75 + breath * 0.5;
    this.hood.position.y = 1.58 + breath * 0.3;
    this.cape.material.opacity = THREE.MathUtils.clamp(0.58 + Math.sin(this.breathTime * 0.8) * 0.08 + moodBoost * 0.12, 0.4, 0.95);
    const capeTarget = gliding ? 0.35 : (this.onGround ? 0 : 0.15);
    this.cape.rotation.z = THREE.MathUtils.damp(this.cape.rotation.z, capeTarget, 5, delta);
    this.sash.rotation.z = Math.sin(this.breathTime * 2.2) * 0.25;
    this.skirt.material.emissiveIntensity = THREE.MathUtils.lerp(0.45, 1.05, THREE.MathUtils.clamp(moodBoost * 0.5 + (gliding ? 0.2 : 0), 0, 1));
    const stride = THREE.MathUtils.clamp(this.velocity.length() / maxSpeed, 0, 1);
    const swing = Math.sin(this.breathTime * 6) * 0.4 * stride;
    const armTarget = gliding ? -0.6 : swing - 0.1;
    const armTargetOpp = gliding ? -0.6 : -swing - 0.1;
    this.leftArm.rotation.x = THREE.MathUtils.damp(this.leftArm.rotation.x, armTarget, 8, delta);
    this.rightArm.rotation.x = THREE.MathUtils.damp(this.rightArm.rotation.x, armTargetOpp, 8, delta);
    this.staff.rotation.y += delta * 0.4;
    this.staffGem.rotation.x += delta * 1.2;
    this.staffHalo.material.opacity = 0.45 + Math.sin(this.breathTime * 2.4) * 0.1;
    this.bootGems.forEach((gem, index) => {
      const glow = Math.sin(this.breathTime * 3 + index) * 0.2 + stride * 0.8 + (this.onGround ? 0 : 0.3);
      gem.material.emissiveIntensity = THREE.MathUtils.lerp(1.0, 2.1, THREE.MathUtils.clamp(glow, 0, 1));
      gem.material.opacity = THREE.MathUtils.lerp(0.7, 1, THREE.MathUtils.clamp(glow, 0, 1));
    });
  }
}

class CompanionSpirit {
  constructor() {
    this.group = new THREE.Group();

    const coreGeo = new THREE.SphereGeometry(0.42, 32, 24);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xcafaff,
      emissive: 0x62d9ff,
      emissiveIntensity: 1.6,
      transparent: true,
      opacity: 0.82,
      roughness: 0.28,
    });
    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.core);

    const heartGeo = new THREE.OctahedronGeometry(0.18, 0);
    const heartMat = new THREE.MeshStandardMaterial({
      color: 0xffb4ff,
      emissive: 0xff7bff,
      emissiveIntensity: 1.3,
      transparent: true,
      opacity: 0.9,
    });
    this.heart = new THREE.Mesh(heartGeo, heartMat);
    this.heart.rotation.y = Math.PI / 4;
    this.group.add(this.heart);

    const ringGeo = new THREE.TorusGeometry(0.7, 0.06, 24, 80);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf9baff, transparent: true, opacity: 0.6 });
    this.ring = new THREE.Mesh(ringGeo, ringMat);
    this.ring.rotation.x = Math.PI / 2;
    this.group.add(this.ring);

    const haloGeo = new THREE.TorusGeometry(0.95, 0.04, 18, 80);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xcffeff,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
    });
    this.halo = new THREE.Mesh(haloGeo, haloMat);
    this.halo.rotation.x = Math.PI / 2;
    this.halo.position.y = 0.08;
    this.group.add(this.halo);

    const trailGeo = new THREE.CylinderGeometry(0.02, 0.18, 1.4, 16, 1, true);
    const trailMat = new THREE.MeshStandardMaterial({
      color: 0x9ef7ff,
      emissive: 0x4bb4ff,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    this.trail = new THREE.Mesh(trailGeo, trailMat);
    this.trail.position.set(0, -0.9, 0);
    this.group.add(this.trail);

    const auraGeo = new THREE.SphereGeometry(0.78, 20, 16);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xe0feff,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.aura = new THREE.Mesh(auraGeo, auraMat);
    this.group.add(this.aura);

    const petalGeo = new THREE.ConeGeometry(0.18, 0.7, 16, 1, true);
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xffd8ff,
      emissive: 0x7d42ff,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    this.petals = [];
    for (let i = 0; i < 6; i += 1) {
      const petal = new THREE.Mesh(petalGeo, petalMat.clone());
      const angle = (i / 6) * Math.PI * 2;
      petal.position.set(Math.cos(angle) * 0.6, Math.sin(i) * 0.1, Math.sin(angle) * 0.6);
      petal.lookAt(0, 0, 0);
      petal.rotation.z += Math.PI;
      this.group.add(petal);
      this.petals.push(petal);
    }

    this.light = new THREE.PointLight(0x94e7ff, 2.8, 20, 1.8);
    this.group.add(this.light);

    this.orbitTime = 0;
    this.mood = 84;
    this.maxMood = 100;
  }

  update(delta, playerPosition, orientation) {
    this.orbitTime += delta;
    const desired = tmpVec1
      .set(-Math.sin(orientation) * 1.6, 1.8 + Math.sin(this.orbitTime * 2) * 0.2, -Math.cos(orientation) * 1.6)
      .add(playerPosition);
    this.group.position.lerp(desired, 1 - Math.exp(-delta * 4));
    this.ring.rotation.z += delta * 1.2;
    this.halo.rotation.z -= delta * 0.6;
    this.heart.rotation.x += delta * 1.5;
    this.petals.forEach((petal, index) => {
      petal.rotation.y += delta * 0.6;
      petal.material.opacity = 0.65 + Math.sin(this.orbitTime * 2 + index) * 0.1;
    });
    this.trail.scale.setScalar(0.8 + Math.sin(this.orbitTime * 3) * 0.1);
    this.aura.material.opacity = 0.2 + Math.sin(this.orbitTime * 1.5) * 0.05;
    const moodRatio = this.mood / this.maxMood;
    this.light.intensity = THREE.MathUtils.lerp(1.4, 3.4, moodRatio);
    this.core.material.emissiveIntensity = THREE.MathUtils.lerp(1.1, 3.1, moodRatio);
    this.core.material.opacity = THREE.MathUtils.lerp(0.6, 0.92, moodRatio);
    this.ring.material.opacity = THREE.MathUtils.lerp(0.36, 0.78, moodRatio);
    this.halo.material.opacity = THREE.MathUtils.lerp(0.2, 0.55, moodRatio);
    this.trail.material.opacity = THREE.MathUtils.lerp(0.45, 0.9, moodRatio);
    this.petals.forEach((petal) => {
      petal.material.emissiveIntensity = THREE.MathUtils.lerp(0.6, 1.4, moodRatio);
    });
  }

  adjustMood(amount) {
    this.mood = THREE.MathUtils.clamp(this.mood + amount, 0, this.maxMood);
  }

  get moodRatio() {
    return this.mood / this.maxMood;
  }
}

function createGround() {
  const geometry = new THREE.PlaneGeometry(140, 140, 120, 120);
  const positionAttr = geometry.attributes.position;
  const colors = [];
  const lowColor = new THREE.Color(0x0f2a1f);
  const midColor = new THREE.Color(0x1f5f4a);
  const highColor = new THREE.Color(0x6df2c2);
  for (let i = 0; i < positionAttr.count; i += 1) {
    const x = positionAttr.getX(i);
    const z = positionAttr.getY(i);
    const height = getGroundHeight(x, z);
    positionAttr.setZ(i, height);
    const t = THREE.MathUtils.clamp((height + 1.2) / 2.4, 0, 1);
    const color = lowColor.clone().lerp(midColor, THREE.MathUtils.smoothstep(t, 0, 0.7)).lerp(highColor, THREE.MathUtils.smoothstep(t, 0.5, 1));
    const sparkle = Math.sin(x * 0.2) * Math.sin(z * 0.2) * 0.04;
    color.lerp(new THREE.Color(0x8fffe8), Math.max(0, sparkle));
    colors.push(color.r, color.g, color.b);
  }
  geometry.computeVertexNormals();
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.82,
    metalness: 0.08,
    emissive: 0x061b14,
    emissiveIntensity: 0.45,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function createWater() {
  const geo = new THREE.CircleGeometry(16, 120);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x1a5a83,
    metalness: 0.12,
    roughness: 0.05,
    transmission: 0.78,
    transparent: true,
    opacity: 0.92,
    emissive: 0x081c2a,
    emissiveIntensity: 0.55,
    thickness: 2.4,
    ior: 1.33,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    specularIntensity: 0.9,
    specularColor: new THREE.Color(0x8cd8ff),
    iridescence: 0.35,
    iridescenceIOR: 1.2,
  });
  const water = new THREE.Mesh(geo, mat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = getGroundHeight(0, 0) + 0.05;
  water.receiveShadow = true;

  const causticGeo = new THREE.CircleGeometry(10, 96);
  const causticMat = new THREE.MeshBasicMaterial({
    color: 0x9dfbff,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const caustics = new THREE.Mesh(causticGeo, causticMat);
  caustics.rotation.x = -Math.PI / 2;
  caustics.position.y = 0.02;
  water.add(caustics);

  scene.add(water);
  return water;
}

function createRibbons() {
  const group = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(1.2, 3.4, -0.4),
    new THREE.Vector3(-1.8, 6.6, 1.4),
    new THREE.Vector3(0.4, 9.2, 0.6),
  ]);
  const ribbonGeo = new THREE.TubeGeometry(curve, 64, 0.18, 12, false);
  const ribbonMat = new THREE.MeshStandardMaterial({
    color: 0x7dfbff,
    emissive: 0x3cd6ff,
    emissiveIntensity: 1.2,
    roughness: 0.35,
    metalness: 0.1,
    transparent: true,
    opacity: 0.65,
  });
  const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
  ribbon.castShadow = true;
  group.add(ribbon);

  const ribbon2 = ribbon.clone();
  ribbon2.rotation.y = Math.PI * 0.6;
  group.add(ribbon2);

  return {
    group,
    update(delta, harmony) {
      group.rotation.y += delta * 0.4;
      ribbon.material.opacity = THREE.MathUtils.lerp(0.3, 0.7, harmony);
      ribbon2.material.opacity = THREE.MathUtils.lerp(0.2, 0.6, harmony);
    },
  };
}

function createPrismTree() {
  const group = new THREE.Group();
  const trunkGeo = new THREE.CylinderGeometry(1.2, 2.4, 8, 24);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x2a2b44,
    roughness: 0.55,
    metalness: 0.2,
    emissive: 0x151326,
    emissiveIntensity: 0.5,
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 4;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  const trunkInlayGeo = new THREE.CylinderGeometry(0.9, 1.8, 8.4, 32, 1, true);
  const trunkInlayMat = new THREE.MeshStandardMaterial({
    color: 0x3b2b78,
    roughness: 0.45,
    metalness: 0.6,
    emissive: 0x1a1144,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
  });
  const trunkInlay = new THREE.Mesh(trunkInlayGeo, trunkInlayMat);
  trunkInlay.position.y = 3.8;
  group.add(trunkInlay);

  const rootGeo = new THREE.ConeGeometry(0.9, 2.2, 6, 1, true);
  const rootMat = new THREE.MeshStandardMaterial({
    color: 0x1d1e36,
    roughness: 0.7,
    metalness: 0.12,
    side: THREE.DoubleSide,
  });
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2;
    const root = new THREE.Mesh(rootGeo, rootMat);
    root.position.set(Math.cos(angle) * 1.6, 0.2, Math.sin(angle) * 1.6);
    root.rotation.set(Math.PI, angle, 0);
    root.castShadow = true;
    group.add(root);
  }

  const canopyGeo = new THREE.IcosahedronGeometry(4.6, 2);
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0x52f0c1,
    roughness: 0.32,
    metalness: 0.35,
    emissive: 0x1d7a58,
    emissiveIntensity: 0.85,
    transparent: true,
    opacity: 0.95,
  });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.y = 9.8;
  canopy.castShadow = true;
  group.add(canopy);

  const canopyInnerGeo = new THREE.IcosahedronGeometry(3.4, 1);
  const canopyInnerMat = new THREE.MeshStandardMaterial({
    color: 0x8fffe1,
    emissive: 0x4bf0d0,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.7,
    roughness: 0.2,
  });
  const canopyInner = new THREE.Mesh(canopyInnerGeo, canopyInnerMat);
  canopyInner.position.y = 9.8;
  group.add(canopyInner);

  const canopyEdgesGeo = new THREE.EdgesGeometry(canopyGeo, 40);
  const canopyEdgesMat = new THREE.LineBasicMaterial({ color: 0xbdfcff, transparent: true, opacity: 0.35 });
  const canopyEdges = new THREE.LineSegments(canopyEdgesGeo, canopyEdgesMat);
  canopyEdges.position.y = 9.8;
  group.add(canopyEdges);

  const prismGeo = new THREE.OctahedronGeometry(2.1, 1);
  const prismMat = new THREE.MeshStandardMaterial({
    color: 0xbdf9ff,
    emissive: 0x87f6ff,
    emissiveIntensity: 2.2,
    transparent: true,
    opacity: 0.92,
    roughness: 0.12,
  });
  const prism = new THREE.Mesh(prismGeo, prismMat);
  prism.position.y = 12.8;
  prism.castShadow = true;
  group.add(prism);

  const prismRingGeo = new THREE.TorusGeometry(2.4, 0.08, 20, 96);
  const prismRingMat = new THREE.MeshBasicMaterial({ color: 0xffd8ff, transparent: true, opacity: 0.4 });
  const prismRing = new THREE.Mesh(prismRingGeo, prismRingMat);
  prismRing.rotation.x = Math.PI / 2;
  prismRing.position.y = 11.5;
  group.add(prismRing);

  const haloGeo = new THREE.TorusGeometry(5.4, 0.16, 24, 128);
  const haloMat = new THREE.MeshBasicMaterial({ color: 0xa8f0ff, transparent: true, opacity: 0.4 });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 8.6;
  group.add(halo);

  const bloomRingGeo = new THREE.TorusGeometry(3.8, 0.12, 24, 96);
  const bloomRingMat = new THREE.MeshBasicMaterial({ color: 0xffb8ff, transparent: true, opacity: 0.45 });
  const bloomRing = new THREE.Mesh(bloomRingGeo, bloomRingMat);
  bloomRing.rotation.x = Math.PI / 2;
  bloomRing.position.y = 9.6;
  group.add(bloomRing);

  const light = new THREE.PointLight(0xa8f7ff, 5.4, 44, 1.4);
  light.position.y = 12.6;
  light.castShadow = true;
  group.add(light);

  const sprites = new THREE.Group();
  const spriteGeo = new THREE.SphereGeometry(0.22, 16, 12);
  for (let i = 0; i < 8; i += 1) {
    const spriteMat = new THREE.MeshStandardMaterial({
      color: 0xfff9ff,
      emissive: 0xffc2ff,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.7,
    });
    const orb = new THREE.Mesh(spriteGeo, spriteMat);
    const angle = (i / 8) * Math.PI * 2;
    orb.position.set(Math.cos(angle) * 4.2, 10.4 + Math.sin(i) * 0.4, Math.sin(angle) * 4.2);
    orb.castShadow = true;
    sprites.add(orb);
  }
  group.add(sprites);

  const leaves = new THREE.Group();
  const leafGeo = new THREE.ConeGeometry(0.35, 1.4, 10, 1, true);
  for (let i = 0; i < 14; i += 1) {
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x76ffd1,
      emissive: 0x32c9a0,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    const radius = 3.6 + Math.random() * 0.8;
    const angle = (i / 14) * Math.PI * 2;
    leaf.position.set(Math.cos(angle) * radius, 8.8 + Math.random() * 1.2, Math.sin(angle) * radius);
    leaf.lookAt(0, 11, 0);
    leaves.add(leaf);
  }
  group.add(leaves);

  const ribbons = createRibbons();
  group.add(ribbons.group);

  group.position.set(0, getGroundHeight(0, 0), 0);
  scene.add(group);

  let time = 0;

  return {
    group,
    prism,
    halo,
    ribbons,
    canopy,
    canopyInner,
    canopyEdges,
    prismRing,
    bloomRing,
    sprites,
    leaves,
    light,
    update(delta, harmony) {
      time += delta;
      const intensity = THREE.MathUtils.lerp(0.8, 2.4, harmony);
      prism.rotation.y += delta * 0.9;
      prism.material.emissiveIntensity = THREE.MathUtils.lerp(1.5, 3.6, harmony);
      prismRing.rotation.z += delta * 0.6;
      halo.rotation.z += delta * 0.3;
      bloomRing.rotation.z -= delta * 0.2;
      canopy.rotation.y += delta * 0.1;
      canopy.material.emissiveIntensity = THREE.MathUtils.lerp(0.8, 1.4, harmony);
      canopyInner.rotation.y -= delta * 0.18;
      canopyInner.material.opacity = THREE.MathUtils.lerp(0.6, 0.92, harmony);
      canopyEdges.material.opacity = THREE.MathUtils.lerp(0.25, 0.6, harmony);
      sprites.children.forEach((orb, index) => {
        const orbit = 0.4 + harmony * 0.3;
        orb.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), delta * (0.3 + harmony * 0.6));
        orb.position.y = 10.2 + Math.sin(time * 2 + index) * 0.6;
        orb.material.opacity = 0.5 + Math.sin(time * 3 + index) * 0.2;
        orb.scale.setScalar(1 + Math.sin(time * 2.4 + index) * 0.15 * orbit);
      });
      leaves.children.forEach((leaf, index) => {
        leaf.rotation.z = Math.sin(time * 2 + index) * 0.2;
        leaf.material.opacity = 0.6 + Math.sin(time * 1.3 + index) * 0.15;
      });
      light.intensity = THREE.MathUtils.lerp(3.2, 6.2, intensity / 3);
      light.color.lerpColors(new THREE.Color(0xa8f7ff), new THREE.Color(0xffc8ff), THREE.MathUtils.clamp(harmony, 0, 1));
      ribbons.update(delta, harmony);
    },
  };
}

function createGladeLights() {
  const fireflyCount = 180;
  const positions = [];
  const basePositions = [];
  for (let i = 0; i < fireflyCount; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 6 + Math.random() * 24;
    const height = 1 + Math.random() * 6;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    basePositions.push({ x, y: height, z, speed: 0.6 + Math.random() * 1.4 });
    positions.push(x, height, z);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xaeeaff,
    size: 0.18,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  return {
    update(delta, elapsed) {
      const attr = geometry.attributes.position;
      for (let i = 0; i < basePositions.length; i += 1) {
        const base = basePositions[i];
        const sway = Math.sin(elapsed * base.speed + i) * 0.4;
        const bob = Math.sin(elapsed * (base.speed * 1.5) + i * 0.3) * 0.6;
        attr.setXYZ(
          i,
          base.x + Math.cos(elapsed * 0.1 + i) * 0.3 + sway * 0.2,
          base.y + bob,
          base.z + Math.sin(elapsed * 0.1 + i) * 0.3 - sway * 0.2,
        );
      }
      attr.needsUpdate = true;
    },
  };
}

function createAurora() {
  const geometry = new THREE.PlaneGeometry(40, 14, 60, 16);
  const basePositions = geometry.attributes.position.array.slice();
  const colors = [];
  const colorA = new THREE.Color(0x8feaff);
  const colorB = new THREE.Color(0xffa8ff);
  for (let i = 0; i < geometry.attributes.position.count; i += 1) {
    const v = geometry.attributes.position.getY(i) / 14 + 0.5;
    const color = colorA.clone().lerp(colorB, THREE.MathUtils.clamp(v, 0, 1));
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.42, depthWrite: false });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(-6, 18, -22);
  mesh.rotation.set(Math.PI / 2.4, Math.PI * 0.07, 0);
  scene.add(mesh);

  return {
    update(delta, elapsed) {
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i += 1) {
        const originalY = basePositions[i * 3 + 1];
        const originalZ = basePositions[i * 3 + 2];
        const wave = Math.sin(elapsed * 0.6 + originalZ * 0.2 + i * 0.05) * 0.8;
        const pulse = Math.sin(elapsed * 1.4 + originalY * 0.3) * 0.4;
        pos.setY(i, originalY + wave + pulse);
      }
      pos.needsUpdate = true;
      material.opacity = 0.32 + Math.sin(elapsed * 0.5) * 0.08;
    },
  };
}

function createShrineNetwork() {
  const gloomColor = new THREE.Color(0x4a4676);
  const glowColor = new THREE.Color(0xaefbff);
  const positions = [
    new THREE.Vector3(-8, 0, -5),
    new THREE.Vector3(10, 0, -4),
    new THREE.Vector3(6, 0, 9),
    new THREE.Vector3(-10, 0, 8),
    new THREE.Vector3(0, 0, 14),
    new THREE.Vector3(-2, 0, -14),
  ];

  return positions.map((basePosition, index) => {
    const group = new THREE.Group();
    const worldY = getGroundHeight(basePosition.x, basePosition.z);
    group.position.set(basePosition.x, worldY, basePosition.z);

    const baseGeo = new THREE.CylinderGeometry(1.8, 2.2, 0.6, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x141424,
      roughness: 0.7,
      metalness: 0.15,
      emissive: 0x060614,
      emissiveIntensity: 0.4,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.3;
    base.receiveShadow = true;
    group.add(base);

    const stepGeo = new THREE.CylinderGeometry(1.3, 1.6, 0.3, 32);
    const stepMat = new THREE.MeshStandardMaterial({
      color: 0x1d1b36,
      roughness: 0.6,
      metalness: 0.22,
      emissive: 0x0a081c,
      emissiveIntensity: 0.45,
    });
    const step = new THREE.Mesh(stepGeo, stepMat);
    step.position.y = 0.75;
    step.receiveShadow = true;
    group.add(step);

    const runeRingGeo = new THREE.TorusGeometry(1.2, 0.06, 18, 64);
    const runeRingMat = new THREE.MeshBasicMaterial({
      color: 0x82f5ff,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    const runeRing = new THREE.Mesh(runeRingGeo, runeRingMat);
    runeRing.rotation.x = Math.PI / 2;
    runeRing.position.y = 0.92;
    group.add(runeRing);

    const pillarGeo = new THREE.CylinderGeometry(0.6, 0.9, 2.8, 24, 1);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x1b1b2c,
      emissive: 0x0b0a1d,
      roughness: 0.58,
      metalness: 0.25,
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    pillar.position.y = 1.7;
    group.add(pillar);

    const pillarInlayGeo = new THREE.CylinderGeometry(0.4, 0.7, 2.9, 24, 1, true);
    const pillarInlayMat = new THREE.MeshStandardMaterial({
      color: 0x3e2e6f,
      emissive: 0x1b1340,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.5,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const pillarInlay = new THREE.Mesh(pillarInlayGeo, pillarInlayMat);
    pillarInlay.position.y = 1.7;
    group.add(pillarInlay);

    const crownGeo = new THREE.TorusGeometry(0.9, 0.07, 16, 64);
    const crownMat = new THREE.MeshStandardMaterial({
      color: 0x3a3564,
      roughness: 0.4,
      metalness: 0.45,
      emissive: 0x161234,
      emissiveIntensity: 0.6,
    });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.rotation.x = Math.PI / 2;
    crown.position.y = 3.1;
    group.add(crown);

    const crystalGeo = new THREE.OctahedronGeometry(0.72, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x5557aa,
      emissive: 0x1f1f4a,
      emissiveIntensity: 1.1,
      transparent: true,
      opacity: 0.88,
      roughness: 0.22,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.y = 3.2;
    crystal.castShadow = true;
    group.add(crystal);

    const crystalCageGeo = new THREE.RingGeometry(0.6, 0.95, 48);
    const crystalCageMat = new THREE.MeshBasicMaterial({ color: gloomColor.clone(), transparent: true, opacity: 0.42, side: THREE.DoubleSide });
    const crystalCage = new THREE.Mesh(crystalCageGeo, crystalCageMat);
    crystalCage.rotation.x = Math.PI / 2;
    crystalCage.position.y = 2.4;
    group.add(crystalCage);

    const haloGeo = new THREE.TorusGeometry(1.35, 0.04, 18, 80);
    const haloMat = new THREE.MeshBasicMaterial({ color: gloomColor.clone(), transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 2.2;
    group.add(halo);

    const shards = new THREE.Group();
    const shardGeo = new THREE.TetrahedronGeometry(0.2);
    for (let i = 0; i < 8; i += 1) {
      const shardMat = new THREE.MeshStandardMaterial({
        color: 0x6c6bff,
        emissive: 0x3a3aff,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.7,
      });
      const shard = new THREE.Mesh(shardGeo, shardMat);
      const angle = (i / 8) * Math.PI * 2;
      shard.position.set(Math.cos(angle) * 1.1, 2.2 + Math.sin(i) * 0.2, Math.sin(angle) * 1.1);
      shards.add(shard);
    }
    group.add(shards);

    const particlesGeo = new THREE.BufferGeometry();
    const particleCount = 120;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleOffsets = [];
    for (let i = 0; i < particleCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.2 + Math.random() * 1.1;
      const height = 0.2 + Math.random() * 2.8;
      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = height;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
      particleOffsets.push({ angle, radius, height });
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particlesMat = new THREE.PointsMaterial({
      color: 0x7570ff,
      size: 0.065,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    group.add(particles);

    const beamGeo = new THREE.CylinderGeometry(0.12, 0.3, 6, 24, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: glowColor.clone(),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 4.5;
    beam.visible = false;
    group.add(beam);

    const sparkle = new THREE.PointLight(0x5f6aff, 1.5, 9, 2.4);
    sparkle.position.y = 3.2;
    group.add(sparkle);

    scene.add(group);

    return {
      group,
      crystal,
      halo,
      particles,
      pillar,
      pillarInlay,
      crown,
      runeRing,
      crystalCage,
      shards,
      particleOffsets,
      beam,
      sparkle,
      cleansed: false,
      pulseTime: 0,
      update(delta, elapsed) {
        const pulse = this.cleansed ? 0.8 : Math.max(0, this.pulseTime * 2.2);
        const t = THREE.MathUtils.clamp(pulse, 0, 1);
        const aura = this.cleansed ? 1 : THREE.MathUtils.clamp(Math.sin(elapsed * 1.4 + index) * 0.2 + t, 0, 1);
        halo.material.color.copy(gloomColor).lerp(glowColor, this.cleansed ? 1 : t);
        halo.material.opacity = 0.26 + aura * 0.45;
        runeRing.material.opacity = 0.25 + aura * 0.5;
        runeRing.material.color.lerpColors(gloomColor, glowColor, this.cleansed ? 1 : t * 0.8);
        this.pillarInlay.material.opacity = THREE.MathUtils.lerp(0.5, 0.88, this.cleansed ? 1 : t);
        this.pillarInlay.material.emissiveIntensity = THREE.MathUtils.lerp(0.6, 1.5, this.cleansed ? 1 : t);
        this.crystalCage.material.color.copy(gloomColor).lerp(glowColor, this.cleansed ? 1 : t * 0.7);
        crystal.rotation.y += delta * (this.cleansed ? 1.4 : 0.8);
        this.crown.rotation.z += delta * 0.35;
        particles.rotation.y += delta * 0.35;
        const attr = particles.geometry.attributes.position;
        for (let i = 0; i < this.particleOffsets.length; i += 1) {
          const offset = this.particleOffsets[i];
          const y = offset.height + Math.sin(elapsed * 2 + i) * 0.2;
          const radius = offset.radius + Math.sin(elapsed * 1.6 + i) * 0.05;
          const angle = offset.angle + elapsed * 0.9;
          attr.setXYZ(i, Math.cos(angle) * radius, y, Math.sin(angle) * radius);
        }
        attr.needsUpdate = true;
        particles.material.opacity = THREE.MathUtils.lerp(0.5, 0.95, this.cleansed ? 1 : t * 0.8);
        particles.material.color.lerpColors(new THREE.Color(0x7570ff), glowColor, this.cleansed ? 1 : t * 0.9);
        this.shards.children.forEach((shard, i) => {
          shard.rotation.x += delta * 0.8;
          shard.rotation.y += delta * 0.6;
          shard.position.y = 2.1 + Math.sin(elapsed * 2 + i) * 0.4;
          shard.material.emissiveIntensity = THREE.MathUtils.lerp(0.8, 1.6, this.cleansed ? 1 : t);
        });
        this.beam.visible = this.cleansed || t > 0.1;
        this.beam.material.opacity = THREE.MathUtils.lerp(0.0, 0.6, this.cleansed ? 1 : t);
        this.beam.scale.y = 0.9 + Math.sin(elapsed * 1.6 + index) * 0.05;
        sparkle.intensity = THREE.MathUtils.lerp(0.9, 3.2, this.cleansed ? 1 : t * 0.7);
        sparkle.color.lerpColors(new THREE.Color(0x5f6aff), glowColor, this.cleansed ? 1 : t);
        if (this.pulseTime > 0) {
          this.pulseTime = Math.max(0, this.pulseTime - delta);
        }
      },
      cleanse() {
        if (this.cleansed) return false;
        this.cleansed = true;
        this.pillar.material.color.set(0x264f3e);
        this.pillar.material.emissive.set(0x102b1f);
        this.pillarInlay.material.color.set(0x39d4b2);
        this.crystal.material.color.set(glowColor);
        this.crystal.material.emissive.set(glowColor.clone().multiplyScalar(0.9));
        this.crystal.material.emissiveIntensity = 2.4;
        this.crystal.material.opacity = 0.97;
        this.sparkle.color.set(glowColor);
        this.sparkle.intensity = 3.2;
        this.beam.material.color.copy(glowColor);
        this.pulseTime = 0.8;
        return true;
      },
    };
  });
}

function createStoneDetails() {
  const stones = new THREE.Group();
  const stoneGeometries = [
    new THREE.DodecahedronGeometry(0.6, 0),
    new THREE.IcosahedronGeometry(0.5, 0),
    new THREE.CylinderGeometry(0.35, 0.5, 0.8, 6),
  ];
  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x273746, roughness: 0.78, metalness: 0.12, emissive: 0x0c141c });
  for (let i = 0; i < 28; i += 1) {
    const geo = stoneGeometries[i % stoneGeometries.length].clone();
    const stone = new THREE.Mesh(geo, baseMaterial.clone());
    const angle = Math.random() * Math.PI * 2;
    const radius = 8 + Math.random() * 24;
    stone.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    stone.position.y = getGroundHeight(stone.position.x, stone.position.z) + Math.random() * 0.3;
    const scale = 0.5 + Math.random() * 0.9;
    stone.scale.setScalar(scale);
    stone.castShadow = true;
    stone.receiveShadow = true;
    if (Math.random() > 0.6) {
      stone.material.color.offsetHSL(Math.random() * 0.05, 0.1, Math.random() * 0.05);
      stone.material.emissiveIntensity = 0.2 + Math.random() * 0.3;
    }
    if (Math.random() > 0.7) {
      const runeGeo = new THREE.CircleGeometry(0.16 + Math.random() * 0.08, 32);
      const runeMat = new THREE.MeshBasicMaterial({
        color: 0x8cf3ff,
        transparent: true,
        opacity: 0.5 + Math.random() * 0.3,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const rune = new THREE.Mesh(runeGeo, runeMat);
      rune.position.set(0, scale * 0.6, 0);
      rune.rotation.x = -Math.PI / 2;
      stone.add(rune);
    }
    if (Math.random() > 0.5) {
      const gemGeo = new THREE.OctahedronGeometry(0.08 + Math.random() * 0.05);
      const gemMat = new THREE.MeshStandardMaterial({
        color: 0xaefbff,
        emissive: 0x6cecff,
        emissiveIntensity: 1.1,
        transparent: true,
        opacity: 0.8,
      });
      const gem = new THREE.Mesh(gemGeo, gemMat);
      gem.position.set(0, scale * 0.7 + 0.05, 0);
      stone.add(gem);
    }
    stones.add(stone);
  }
  scene.add(stones);
}

function createBloomingPlants() {
  const group = new THREE.Group();
  const blooms = [];
  const stemGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.6, 6);
  const petalGeo = new THREE.ConeGeometry(0.18, 0.4, 6, 1, true);
  for (let i = 0; i < 42; i += 1) {
    const bloom = new THREE.Group();
    const angle = Math.random() * Math.PI * 2;
    const radius = 4 + Math.random() * 22;
    const baseHeight = getGroundHeight(Math.cos(angle) * radius, Math.sin(angle) * radius);
    bloom.position.set(Math.cos(angle) * radius, baseHeight + 0.1, Math.sin(angle) * radius);

    const stemMat = new THREE.MeshStandardMaterial({ color: 0x1f4736, roughness: 0.7, metalness: 0.1, emissive: 0x0c2418, emissiveIntensity: 0.4 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.3;
    stem.castShadow = true;
    bloom.add(stem);

    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xffb9f9,
      emissive: 0x612c83,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    });
    const petals = [];
    for (let p = 0; p < 6; p += 1) {
      const petal = new THREE.Mesh(petalGeo, petalMat.clone());
      const pAngle = (p / 6) * Math.PI * 2;
      petal.position.set(Math.cos(pAngle) * 0.22, 0.55, Math.sin(pAngle) * 0.22);
      petal.rotation.set(Math.PI, pAngle, 0);
      petal.castShadow = true;
      bloom.add(petal);
      petals.push(petal);
    }

    const coreGeo = new THREE.SphereGeometry(0.13, 16, 12);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xfff5c8,
      emissive: 0xffd27d,
      emissiveIntensity: 1.2,
      metalness: 0.25,
      roughness: 0.35,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 0.55;
    bloom.add(core);

    const glowGeo = new THREE.SphereGeometry(0.22, 12, 8);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffc9ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.y = 0.55;
    bloom.add(glow);

    group.add(bloom);
    blooms.push({ bloom, petals, core, glow, baseY: bloom.position.y });
  }
  scene.add(group);
  return {
    update(delta, elapsed) {
      blooms.forEach((entry, index) => {
        const sway = Math.sin(elapsed * 1.5 + index) * 0.15;
        entry.bloom.rotation.y = sway * 0.4;
        entry.bloom.position.y = entry.baseY + Math.sin(elapsed * 1.1 + index) * 0.08;
        entry.petals.forEach((petal, pIndex) => {
          petal.rotation.z = Math.sin(elapsed * 1.8 + pIndex + index * 0.2) * 0.3;
          petal.material.opacity = 0.75 + Math.sin(elapsed * 1.6 + pIndex) * 0.1;
        });
        entry.core.material.emissiveIntensity = 1 + Math.sin(elapsed * 2 + index) * 0.3;
        entry.glow.material.opacity = 0.25 + Math.sin(elapsed * 1.4 + index) * 0.1;
        entry.glow.scale.setScalar(1 + Math.sin(elapsed * 1.7 + index) * 0.08);
      });
    },
  };
}

function createCleanseBurst() {
  const geometry = new THREE.SphereGeometry(1, 32, 16);
  const material = new THREE.MeshBasicMaterial({
    color: 0xaefbff,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.visible = false;
  scene.add(mesh);
  return { mesh, active: false, life: 0 };
}

const player = new PlayerController();
scene.add(player.group);

const companion = new CompanionSpirit();
scene.add(companion.group);

createGround();
createWater();
const tree = createPrismTree();
createStoneDetails();
const plants = createBloomingPlants();
const fireflies = createGladeLights();
const aurora = createAurora();
const shrines = createShrineNetwork();
const cleanseBurstPool = Array.from({ length: 5 }, () => createCleanseBurst());

const ambientLight = new THREE.AmbientLight(0x6ab7ff, 0.45);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0xb1d7ff, 1.1);
moonLight.position.set(14, 22, 10);
moonLight.castShadow = true;
moonLight.shadow.camera.top = 40;
moonLight.shadow.camera.bottom = -40;
moonLight.shadow.camera.left = -40;
moonLight.shadow.camera.right = 40;
moonLight.shadow.bias = -0.0005;
scene.add(moonLight);

const rimLight = new THREE.PointLight(0xffb3ff, 1.2, 40, 1.5);
rimLight.position.set(-16, 12, -12);
scene.add(rimLight);

const moodFill = document.getElementById('moodFill');
const progressFill = document.getElementById('progressFill');
const objectiveText = document.getElementById('objective');
const statusMessage = document.getElementById('statusMessage');
const prompt = document.getElementById('interactionPrompt');
const narration = document.getElementById('narration');
const photoOverlay = document.getElementById('photoOverlay');
const loadingPanel = document.getElementById('loading');
const controlMove = document.getElementById('controlMove');
const controlEmpathy = document.getElementById('controlEmpathy');

function refreshControlHints() {
  if (!controlMove || !controlEmpathy) return;
  if (input.usesAzerty) {
    controlMove.innerHTML = '<strong>ZQSD</strong> — Move Mira';
    controlEmpathy.innerHTML = '<strong>A</strong> — Empathy pulse';
  } else {
    controlMove.innerHTML = '<strong>WASD</strong> — Move Mira';
    controlEmpathy.innerHTML = '<strong>Q</strong> — Empathy pulse';
  }
}

refreshControlHints();
input.onLayoutChange = () => refreshControlHints();

let statusTimer = 0;
let photoMode = false;
let progressCount = 0;
const totalShrines = shrines.length;
let narrativeIndex = -1;
let lastObjectiveMessage = '';
const narrativeBeats = [
  { threshold: 0, text: 'Lumi hums a soft chord as the aurora stirs above the Prism Tree.' },
  { threshold: 0.33, text: 'The glade brightens, revealing hidden petals and playful Glowpuffs.' },
  { threshold: 0.66, text: 'Color ripples across the canopy; distant spirits echo Mira\'s song.' },
  { threshold: 1, text: 'Harmony restored! The Prism Tree sings with gratitude.' },
];

function updateObjectiveText(count) {
  let message;
  if (count >= totalShrines) {
    message = 'Return to the Prism Tree and bask in the restored harmony. Try gliding through the aurora!';
  } else {
    message = `Harmonize the corrupted shrines (${count}/${totalShrines}) to heal the Prism Tree. Glide with Space to cross the glade.`;
  }
  if (message !== lastObjectiveMessage) {
    objectiveText.textContent = message;
    lastObjectiveMessage = message;
  }
}

updateObjectiveText(0);
statusMessage.textContent = 'Follow Lumi and listen for the shrines\' whispers.';
narration.textContent = narrativeBeats[0].text;
loadingPanel.classList.add('hidden');

const empathyPulse = {
  mesh: new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 16),
    new THREE.MeshBasicMaterial({
      color: 0x9cfaff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  ),
  active: false,
  life: 0,
  cooldown: 0,
};
empathyPulse.mesh.visible = false;
scene.add(empathyPulse.mesh);

const cheerSprites = [];

const canvas = renderer.domElement;
canvas.addEventListener('click', () => {
  if (!photoMode) {
    canvas.requestPointerLock();
  }
});

window.addEventListener('mousemove', (event) => {
  if (photoMode) return;
  if (document.pointerLockElement === canvas) {
    const sensitivity = 0.0022;
    cameraYaw -= event.movementX * sensitivity;
    cameraPitch -= event.movementY * sensitivity;
    cameraPitch = THREE.MathUtils.clamp(cameraPitch, -0.45, 0.6);
  }
});

function showStatus(message, colour = '#9cd2ff', duration = 4) {
  statusMessage.textContent = message;
  statusMessage.style.color = colour;
  statusTimer = duration;
}

function updateStatus(delta) {
  if (statusTimer > 0) {
    statusTimer -= delta;
    if (statusTimer <= 0) {
      statusMessage.textContent = '';
      statusMessage.style.color = '#9cd2ff';
    }
  }
}

function updateNarration(progress) {
  let nextIndex = narrativeIndex;
  for (let i = narrativeBeats.length - 1; i >= 0; i -= 1) {
    if (progress >= narrativeBeats[i].threshold) {
      nextIndex = Math.max(nextIndex, i);
      break;
    }
  }
  if (nextIndex !== narrativeIndex) {
    narrativeIndex = nextIndex;
    narration.textContent = narrativeBeats[narrativeIndex].text;
  }
}

function updateUI(progress, mood) {
  const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1);
  const clampedMood = THREE.MathUtils.clamp(mood, 0, 1);
  progressFill.style.width = `${(clampedProgress * 100).toFixed(0)}%`;
  moodFill.style.width = `${(clampedMood * 100).toFixed(0)}%`;
  if (clampedMood < 0.3) {
    moodFill.style.background = 'linear-gradient(90deg, #ff8aa3 0%, #ffd0a8 100%)';
  } else if (clampedMood > 0.7) {
    moodFill.style.background = 'linear-gradient(90deg, #73eaff 0%, #b6ffea 100%)';
  } else {
    moodFill.style.background = 'linear-gradient(90deg, #73eaff 0%, #ff9dff 100%)';
  }
}

function createEmojiSprite(emoji) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 96px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(emoji, size / 2, size / 2 + 12);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 1 });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.2, 1.2, 1.2);
  return { sprite, texture };
}

function spawnCheerSprite(position) {
  const { sprite, texture } = createEmojiSprite('✨');
  sprite.position.copy(position);
  scene.add(sprite);
  cheerSprites.push({ sprite, texture, life: 0 });
}

function updateCheerSprites(delta) {
  for (let i = cheerSprites.length - 1; i >= 0; i -= 1) {
    const item = cheerSprites[i];
    item.life += delta;
    item.sprite.position.y += delta * 1.6;
    item.sprite.material.opacity = Math.max(0, 1 - item.life / 1.6);
    if (item.life > 1.6) {
      scene.remove(item.sprite);
      item.texture.dispose();
      item.sprite.material.map.dispose();
      item.sprite.material.dispose();
      cheerSprites.splice(i, 1);
    }
  }
}

function spawnCleanseBurst(position) {
  const burst = cleanseBurstPool.find((item) => !item.active);
  if (!burst) return;
  burst.active = true;
  burst.life = 0;
  burst.mesh.visible = true;
  burst.mesh.position.copy(position);
  burst.mesh.scale.setScalar(0.2);
  burst.mesh.material.opacity = 0.8;
}

function updateCleanseBursts(delta) {
  cleanseBurstPool.forEach((burst) => {
    if (!burst.active) return;
    burst.life += delta;
    const scale = 0.2 + burst.life * 6;
    burst.mesh.scale.setScalar(scale);
    burst.mesh.material.opacity = Math.max(0, 0.7 - burst.life * 0.7);
    if (burst.life > 1) {
      burst.active = false;
      burst.mesh.visible = false;
    }
  });
}

function triggerEmpathyPulse() {
  empathyPulse.active = true;
  empathyPulse.life = 0;
  empathyPulse.cooldown = 6;
  empathyPulse.mesh.visible = true;
  empathyPulse.mesh.scale.setScalar(0.01);
  empathyPulse.mesh.material.opacity = 0.75;
  empathyPulse.mesh.position.copy(player.group.position).add(new THREE.Vector3(0, 1.4, 0));
  companion.adjustMood(12);
  showStatus('Lumi radiates a soothing empathy pulse.', '#c5f9ff', 4.5);
}

function updateEmpathyPulse(delta) {
  if (!empathyPulse.active) return;
  empathyPulse.life += delta;
  const radius = 1 + empathyPulse.life * 6;
  empathyPulse.mesh.scale.setScalar(radius);
  tmpVec1.copy(player.group.position).add(new THREE.Vector3(0, 1.4, 0));
  empathyPulse.mesh.position.lerp(tmpVec1, 1 - Math.exp(-delta * 8));
  empathyPulse.mesh.material.opacity = THREE.MathUtils.lerp(0.75, 0, empathyPulse.life / 1.2);
  shrines.forEach((shrine) => {
    if (!shrine.cleansed) {
      const distance = shrine.group.position.distanceTo(empathyPulse.mesh.position);
      if (distance < radius * 1.2) {
        shrine.pulseTime = 0.9;
      }
    }
  });
  if (empathyPulse.life >= 1.2) {
    empathyPulse.active = false;
    empathyPulse.mesh.visible = false;
  }
}

function triggerCheer() {
  companion.adjustMood(6);
  spawnCheerSprite(player.group.position.clone().add(new THREE.Vector3(0, 2.2, 0)));
  showStatus('Mira and Lumi cheer, lifting the glade\'s spirits!', '#d1ffe1', 4);
}

function togglePhotoMode() {
  photoMode = !photoMode;
  document.body.classList.toggle('photo-mode', photoMode);
  photoOverlay.classList.toggle('hidden', !photoMode);
  if (photoMode) {
    document.exitPointerLock();
    orbitControls.enabled = true;
    orbitControls.target.copy(player.group.position).add(new THREE.Vector3(0, 1.2, 0));
    orbitControls.update();
    showStatus('Photo mode engaged. Capture the harmony!', '#f0e2ff', 3);
  } else {
    orbitControls.enabled = false;
    showStatus('Returning to exploration.', '#9cd2ff', 2.5);
  }
}

function updateCamera(delta) {
  const target = tmpVec1.copy(player.group.position).add(new THREE.Vector3(0, 1.4, 0));
  const distance = 6 - companion.moodRatio * 0.8;
  const direction = tmpVec2.set(
    Math.sin(cameraYaw) * Math.cos(cameraPitch),
    Math.sin(cameraPitch),
    Math.cos(cameraYaw) * Math.cos(cameraPitch),
  );
  const desiredPos = tmpVec3.copy(target).addScaledVector(direction, -distance);
  desiredPos.y += 1.2;
  camera.position.lerp(desiredPos, 1 - Math.exp(-delta * 6));
  camera.lookAt(target);
}

function tick() {
  requestAnimationFrame(tick);
  const delta = clock.getDelta();
  const elapsed = clock.elapsedTime;

  const progressRatio = totalShrines === 0 ? 1 : progressCount / totalShrines;
  const drainRate = 0.03 + (1 - progressRatio) * 0.05;
  companion.adjustMood(-delta * drainRate);
  if (progressCount === totalShrines) {
    companion.adjustMood(delta * 0.02);
  }
  const moodRatio = companion.moodRatio;

  player.update(delta, { input, cameraYaw, moodBoost: moodRatio });
  companion.update(delta, player.group.position, cameraYaw);

  plants.update(delta, elapsed);
  fireflies.update(delta, elapsed);
  aurora.update(delta, elapsed);
  tree.update(delta, progressRatio);
  shrines.forEach((shrine) => shrine.update(delta, elapsed));

  let nearestShrine = null;
  let nearestDistance = Infinity;
  const playerPos = player.group.position;

  shrines.forEach((shrine) => {
    const dist = playerPos.distanceTo(shrine.group.position);
    if (!shrine.cleansed && dist < 5 && dist < nearestDistance) {
      nearestShrine = shrine;
      nearestDistance = dist;
    }
  });

  if (nearestShrine) {
    prompt.textContent = 'Press E to Harmonize';
    prompt.classList.remove('hidden');
    if (input.consume('KeyE')) {
      if (nearestShrine.cleanse()) {
        progressCount += 1;
        companion.adjustMood(18);
        spawnCleanseBurst(nearestShrine.group.position.clone().add(new THREE.Vector3(0, 2.6, 0)));
        showStatus('Shrine harmonized! Lumi sparkles brighter.', '#b8f5ff', 5);
      }
    }
  } else {
    prompt.classList.add('hidden');
  }

  if (input.consume('KeyQ') && empathyPulse.cooldown <= 0) {
    triggerEmpathyPulse();
  }

  if (input.consume('KeyR')) {
    triggerCheer();
  }

  if (input.consume('KeyP')) {
    togglePhotoMode();
  }

  if (empathyPulse.cooldown > 0) {
    empathyPulse.cooldown -= delta;
  }
  updateEmpathyPulse(delta);
  updateCheerSprites(delta);
  updateCleanseBursts(delta);
  updateStatus(delta);
  updateNarration(progressRatio);
  updateObjectiveText(progressCount);
  updateUI(progressRatio, moodRatio);

  if (!photoMode) {
    updateCamera(delta);
  } else {
    orbitControls.update();
  }

  if (moodRatio < 0.2 && statusTimer <= 0) {
    showStatus('Lumi is weary. Cleanse a shrine or cheer with R to lift the mood!', '#ffd6a8', 4.5);
  } else if (moodRatio > 0.85 && statusTimer <= 0) {
    showStatus('Lumi is radiant! Mira moves with effortless grace.', '#cbffed', 4.5);
  }

  renderer.render(scene, camera);
  input.frameEnd();
}

tick();
