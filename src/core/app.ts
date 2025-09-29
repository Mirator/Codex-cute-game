import * as THREE from 'three';
import { FixedTime } from './time';
import { EventBus } from './events';
import { World } from '../ecs/world';
import { buildEnvironment } from '../scene/environment';
import { KeyboardInput } from '../input/keyboard';
import { updateInput } from '../systems/inputSystem';
import { updatePlayer, syncCatMesh } from '../systems/playerController';
import { simulatePhysics } from '../systems/physicsSystem';
import { handleInteractions } from '../systems/interactionSystem';
import { ScoreSystem } from '../systems/scoreSystem';
import { HeatSystem } from '../systems/heatSystem';
import { AiSystem } from '../systems/aiSystem';
import { updateChains } from '../systems/chainSystem';
import { Hud } from '../ui/hud';
import { CONFIG } from './config';

export class App {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 120);
  private readonly world = new World();
  private readonly bus = new EventBus();
  private readonly hud = new Hud();
  private readonly keyboard = new KeyboardInput();
  private readonly time = new FixedTime(1 / 60);
  private readonly scoreSystem = new ScoreSystem(this.world, this.hud, this.bus);
  private readonly heatSystem = new HeatSystem(this.world, this.hud, this.bus);
  private readonly aiSystem = new AiSystem(this.world, this.bus);
  private readonly catMesh: THREE.Group;
  private readonly player: number;
  private lastTime = 0;
  private running = false;
  private cameraYaw = Math.PI * 0.8;
  private pointerLocked = false;
  private readonly mouseSensitivity = 0.0025;
  private readonly handleMouseMove = (event: MouseEvent) => {
    if (!this.pointerLocked) return;
    this.cameraYaw -= event.movementX * this.mouseSensitivity;
  };
  private readonly handlePointerLockChange = () => {
    this.pointerLocked = document.pointerLockElement === this.renderer.domElement;
  };
  private readonly handleCanvasClick = () => {
    if (document.pointerLockElement !== this.renderer.domElement) {
      this.renderer.domElement.requestPointerLock();
    }
  };

  constructor(private readonly container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
    this.renderer.domElement.addEventListener('click', this.handleCanvasClick);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
    document.addEventListener('mousemove', this.handleMouseMove);
    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
    const result = buildEnvironment(this.world, this.scene, this.bus);
    this.player = result.player;
    this.catMesh = result.catMesh;
    this.hud.onRestart = () => window.location.reload();
    this.bus.on('chainProgress', (event) => {
      if (event.key === 'alleyCascade' && event.stage >= 4) {
        this.finishRun();
      }
    });
    this.bus.on('heatChanged', (event) => {
      if (event.value >= CONFIG.heat.maxHeat) {
        this.finishRun();
      }
    });
    this.onResize();
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now() / 1000;
    const loop = () => {
      if (!this.running) return;
      const now = performance.now() / 1000;
      const delta = now - this.lastTime;
      this.lastTime = now;
      updateInput(this.world, this.keyboard);
      this.time.advance(delta, (step) => this.step(step));
      this.updateCamera();
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  dispose(): void {
    this.running = false;
    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock();
    }
    this.renderer.domElement.removeEventListener('click', this.handleCanvasClick);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
    document.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    this.bus.clear();
  }

  private step(delta: number): void {
    updatePlayer(this.world, delta, this.cameraYaw);
    simulatePhysics(this.world, this.bus, delta);
    handleInteractions(this.world, this.bus, this.hud, delta);
    this.aiSystem.update(delta);
    this.bus.flush();
    this.heatSystem.update(delta);
    this.scoreSystem.update(delta);
    updateChains(this.world, this.bus, delta);
    this.bus.flush();
  }

  private updateCamera(): void {
    const transform = this.world.get(this.player, 'transform');
    if (!transform) return;
    const target = transform.position.clone();
    const offset = new THREE.Vector3(Math.sin(this.cameraYaw) * 6, 3.6, Math.cos(this.cameraYaw) * 6);
    const desired = target.clone().add(offset);
    this.camera.position.lerp(desired, 0.12);
    this.camera.lookAt(target.x, target.y + 0.5, target.z);
    syncCatMesh(transform, this.catMesh);
  }

  private render(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.render(this.scene, this.camera);
  }

  private onResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private finishRun(): void {
    if (!this.running) return;
    this.running = false;
    const summary = {
      score: this.getScore(),
      combo: this.scoreSystem.summary().maxCombo,
      heat: this.heatSystem.summary().peakHeat,
    };
    this.bus.emit({ type: 'runEnded', ...summary });
    this.bus.flush();
    this.hud.showSummary(summary);
  }

  private getScore(): number {
    const tracker = this.world.get(this.player, 'score');
    return tracker ? tracker.score : 0;
  }
}
