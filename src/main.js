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
    this.keys = new Set();
    this.pressed = new Set();
    window.addEventListener('keydown', (event) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        event.preventDefault();
      }
      if (!this.keys.has(event.code)) {
        this.pressed.add(event.code);
      }
      this.keys.add(event.code);
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
    });
  }

  isDown(code) {
    return this.keys.has(code);
  }

  consume(code) {
    if (this.pressed.has(code)) {
      this.pressed.delete(code);
      return true;
    }
    return false;
  }

  frameEnd() {
    this.pressed.clear();
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

    const bodyGeo = new THREE.CapsuleGeometry(0.35, 1, 6, 12);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xffdbe7,
      roughness: 0.45,
      metalness: 0.05,
      emissive: 0x111111,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    body.position.y = 0.9;
    this.group.add(body);

    const capeGeo = new THREE.ConeGeometry(0.9, 1.4, 24, 1, true);
    const capeMat = new THREE.MeshStandardMaterial({
      color: 0x83e5ff,
      emissive: 0x1c4a8f,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });
    const cape = new THREE.Mesh(capeGeo, capeMat);
    cape.position.set(0, 0.8, 0.15);
    cape.rotation.x = Math.PI;
    cape.castShadow = true;
    this.group.add(cape);

    const staffGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.6, 12);
    const staffMat = new THREE.MeshStandardMaterial({ color: 0x3c3a6b, roughness: 0.3 });
    const staff = new THREE.Mesh(staffGeo, staffMat);
    staff.position.set(0.45, 0.8, 0.1);
    staff.rotation.z = Math.PI / 6;
    staff.castShadow = true;
    this.group.add(staff);

    const staffGemGeo = new THREE.OctahedronGeometry(0.22);
    const staffGemMat = new THREE.MeshStandardMaterial({
      color: 0xaef6ff,
      emissive: 0x64f0ff,
      emissiveIntensity: 1.6,
      transparent: true,
      opacity: 0.85,
    });
    const staffGem = new THREE.Mesh(staffGemGeo, staffGemMat);
    staffGem.position.set(0, 0.9, 0);
    staff.add(staffGem);

    this.velocity = new THREE.Vector3();
    this.heading = INITIAL_CAMERA_YAW;
    this.onGround = true;
    this.glideGrace = 0;
    this.dodgeCooldown = 0;
  }

  update(delta, context) {
    const { input, cameraYaw: camYaw, moodBoost } = context;

    const desired = new THREE.Vector3();
    if (input.isDown('KeyW')) desired.z -= 1;
    if (input.isDown('KeyS')) desired.z += 1;
    if (input.isDown('KeyA')) desired.x -= 1;
    if (input.isDown('KeyD')) desired.x += 1;

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
  }
}

class CompanionSpirit {
  constructor() {
    this.group = new THREE.Group();

    const coreGeo = new THREE.SphereGeometry(0.4, 24, 18);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xbdf5ff,
      emissive: 0x4bc5ff,
      emissiveIntensity: 1.4,
      transparent: true,
      opacity: 0.78,
      roughness: 0.3,
    });
    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.core);

    const ringGeo = new THREE.TorusGeometry(0.66, 0.07, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf9baff, transparent: true, opacity: 0.5 });
    this.ring = new THREE.Mesh(ringGeo, ringMat);
    this.ring.rotation.x = Math.PI / 2;
    this.group.add(this.ring);

    this.light = new THREE.PointLight(0x94e7ff, 2.4, 20, 1.8);
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
    this.ring.rotation.z += delta;
    const moodRatio = this.mood / this.maxMood;
    this.light.intensity = THREE.MathUtils.lerp(1.4, 3.4, moodRatio);
    this.core.material.emissiveIntensity = THREE.MathUtils.lerp(0.9, 2.8, moodRatio);
    this.core.material.opacity = THREE.MathUtils.lerp(0.55, 0.9, moodRatio);
    this.ring.material.opacity = THREE.MathUtils.lerp(0.3, 0.72, moodRatio);
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
  for (let i = 0; i < positionAttr.count; i += 1) {
    const x = positionAttr.getX(i);
    const z = positionAttr.getY(i);
    const height = getGroundHeight(x, z);
    positionAttr.setZ(i, height);
  }
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    color: 0x1c4639,
    roughness: 0.85,
    metalness: 0.05,
    emissive: 0x072015,
    emissiveIntensity: 0.3,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function createWater() {
  const geo = new THREE.CircleGeometry(16, 64);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x184a62,
    metalness: 0.2,
    roughness: 0.12,
    transmission: 0.65,
    transparent: true,
    opacity: 0.85,
    emissive: 0x061828,
    emissiveIntensity: 0.5,
  });
  const water = new THREE.Mesh(geo, mat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = getGroundHeight(0, 0) + 0.05;
  water.receiveShadow = true;
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
  const trunkGeo = new THREE.CylinderGeometry(1.2, 2, 8, 12);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x2a2b44,
    roughness: 0.6,
    metalness: 0.15,
    emissive: 0x10122a,
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 4;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  const canopyGeo = new THREE.SphereGeometry(4.5, 48, 24);
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0x4ad0ad,
    roughness: 0.4,
    metalness: 0.2,
    emissive: 0x1e885f,
    emissiveIntensity: 0.8,
  });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.y = 9.5;
  canopy.castShadow = true;
  group.add(canopy);

  const prismGeo = new THREE.OctahedronGeometry(1.8, 1);
  const prismMat = new THREE.MeshStandardMaterial({
    color: 0xaee8ff,
    emissive: 0x75f3ff,
    emissiveIntensity: 1.8,
    transparent: true,
    opacity: 0.9,
    roughness: 0.15,
  });
  const prism = new THREE.Mesh(prismGeo, prismMat);
  prism.position.y = 12.3;
  prism.castShadow = true;
  group.add(prism);

  const haloGeo = new THREE.TorusGeometry(5, 0.14, 16, 64);
  const haloMat = new THREE.MeshBasicMaterial({ color: 0xa8f0ff, transparent: true, opacity: 0.35 });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 8.6;
  group.add(halo);

  const light = new THREE.PointLight(0xa8f7ff, 5, 40, 1.5);
  light.position.y = 12;
  light.castShadow = true;
  group.add(light);

  group.position.set(0, getGroundHeight(0, 0), 0);
  scene.add(group);

  const ribbons = createRibbons();
  group.add(ribbons.group);

  return {
    group,
    prism,
    halo,
    ribbons,
    update(delta, harmony) {
      prism.rotation.y += delta * 0.8;
      halo.rotation.z += delta * 0.4;
      const intensity = THREE.MathUtils.lerp(0.8, 2.2, harmony);
      prism.material.emissiveIntensity = intensity;
      halo.material.opacity = THREE.MathUtils.lerp(0.2, 0.55, harmony);
      light.intensity = THREE.MathUtils.lerp(3.2, 5.8, harmony);
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

    const pillarGeo = new THREE.CylinderGeometry(0.7, 0.9, 2.6, 16, 1);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x1b1b2c,
      emissive: 0x0b0a1d,
      roughness: 0.65,
      metalness: 0.2,
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    pillar.position.y = 1.3;
    group.add(pillar);

    const crystalGeo = new THREE.OctahedronGeometry(0.7, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x5557aa,
      emissive: 0x1f1f4a,
      emissiveIntensity: 1.1,
      transparent: true,
      opacity: 0.85,
      roughness: 0.25,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.y = 2.5;
    crystal.castShadow = true;
    group.add(crystal);

    const haloGeo = new THREE.RingGeometry(0.7, 1.1, 32);
    const haloMat = new THREE.MeshBasicMaterial({ color: gloomColor.clone(), transparent: true, opacity: 0.38, side: THREE.DoubleSide });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 1.1;
    group.add(halo);

    const particlesGeo = new THREE.BufferGeometry();
    const particleCount = 100;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 1.6;
      particlePositions[i * 3 + 1] = Math.random() * 2.4;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particlesMat = new THREE.PointsMaterial({
      color: 0x7570ff,
      size: 0.06,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    group.add(particles);

    const sparkle = new THREE.PointLight(0x5f6aff, 1.3, 8, 2.5);
    sparkle.position.y = 2.3;
    group.add(sparkle);

    scene.add(group);

    return {
      group,
      crystal,
      halo,
      particles,
      pillar,
      sparkle,
      cleansed: false,
      pulseTime: 0,
      update(delta, elapsed) {
        const pulse = this.cleansed ? 0.8 : Math.max(0, this.pulseTime * 2.2);
        const t = THREE.MathUtils.clamp(pulse, 0, 1);
        halo.material.color.copy(gloomColor).lerp(glowColor, t);
        halo.material.opacity = 0.32 + t * 0.38 + Math.sin(elapsed * 2 + index) * 0.05;
        crystal.rotation.y += delta * (this.cleansed ? 1.2 : 0.6);
        particles.rotation.y += delta * 0.25;
        particles.material.opacity = THREE.MathUtils.lerp(0.55, 0.9, this.cleansed ? 1 : t * 0.7);
        particles.material.color.lerpColors(new THREE.Color(0x7570ff), glowColor, this.cleansed ? 1 : t * 0.8);
        sparkle.intensity = THREE.MathUtils.lerp(0.8, 2.6, this.cleansed ? 1 : t * 0.7);
        if (this.pulseTime > 0) {
          this.pulseTime = Math.max(0, this.pulseTime - delta);
        }
      },
      cleanse() {
        if (this.cleansed) return false;
        this.cleansed = true;
        this.pillar.material.color.set(0x264f3e);
        this.pillar.material.emissive.set(0x102b1f);
        this.crystal.material.color.set(glowColor);
        this.crystal.material.emissive.set(glowColor.clone().multiplyScalar(0.9));
        this.crystal.material.emissiveIntensity = 2.2;
        this.crystal.material.opacity = 0.95;
        this.sparkle.color.set(glowColor);
        this.sparkle.intensity = 3.2;
        this.pulseTime = 0.8;
        return true;
      },
    };
  });
}

function createStoneDetails() {
  const stones = new THREE.Group();
  const stoneGeo = new THREE.DodecahedronGeometry(0.6, 0);
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x273746, roughness: 0.8, metalness: 0.1 });
  for (let i = 0; i < 24; i += 1) {
    const stone = new THREE.Mesh(stoneGeo, stoneMat.clone());
    const angle = Math.random() * Math.PI * 2;
    const radius = 8 + Math.random() * 24;
    stone.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    stone.position.y = getGroundHeight(stone.position.x, stone.position.z) + Math.random() * 0.3;
    stone.scale.multiplyScalar(0.6 + Math.random() * 0.8);
    stone.castShadow = true;
    stone.receiveShadow = true;
    stones.add(stone);
  }
  scene.add(stones);
}

function createBloomingPlants() {
  const group = new THREE.Group();
  const petalGeo = new THREE.ConeGeometry(0.15, 0.6, 6, 1, true);
  for (let i = 0; i < 70; i += 1) {
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xffb9f9,
      emissive: 0x612c83,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const petal = new THREE.Mesh(petalGeo, petalMat);
    const angle = Math.random() * Math.PI * 2;
    const radius = 4 + Math.random() * 22;
    const baseHeight = getGroundHeight(Math.cos(angle) * radius, Math.sin(angle) * radius);
    petal.position.set(Math.cos(angle) * radius, baseHeight + 0.2, Math.sin(angle) * radius);
    petal.rotation.x = Math.PI;
    petal.rotation.y = Math.random() * Math.PI;
    petal.castShadow = true;
    group.add(petal);
  }
  scene.add(group);
  return {
    update(delta, elapsed) {
      group.children.forEach((petal, index) => {
        petal.rotation.z = Math.sin(elapsed * 1.5 + index) * 0.3;
        petal.position.y += Math.sin(elapsed * 1.2 + index) * 0.002;
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
