import * as THREE from 'three';

export type KeyboardLayout = 'qwerty' | 'azerty';

export interface FrameInput {
  move: THREE.Vector2;
  sprint: boolean;
  jump: boolean;
  interact: boolean;
  scratch: boolean;
}

const MOVE_KEYS = {
  qwerty: { forward: 'KeyW', backward: 'KeyS', left: 'KeyA', right: 'KeyD' },
  azerty: { forward: 'KeyZ', backward: 'KeyS', left: 'KeyQ', right: 'KeyD' },
} as const;

export class KeyboardInput {
  private down = new Set<string>();
  private pressed = new Set<string>();
  private _layout: KeyboardLayout = 'qwerty';

  constructor() {
    window.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      this.handleLayout(event);
      this.down.add(event.code);
      this.pressed.add(event.code);
      if (event.key && event.key.length === 1) {
        this.down.add(event.key.toLowerCase());
        this.pressed.add(event.key.toLowerCase());
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
    });
    window.addEventListener('keyup', (event) => {
      this.down.delete(event.code);
      if (event.key && event.key.length === 1) {
        this.down.delete(event.key.toLowerCase());
      }
    });
  }

  get layout(): KeyboardLayout {
    return this._layout;
  }

  private handleLayout(event: KeyboardEvent): void {
    const key = event.key?.toLowerCase();
    if (event.code === 'KeyA' && key === 'q') this._layout = 'azerty';
    if (event.code === 'KeyQ' && key === 'a') this._layout = 'azerty';
    if (event.code === 'KeyW' && key === 'w') this._layout = 'qwerty';
    if (event.code === 'KeyZ' && key === 'z') this._layout = 'azerty';
  }

  consume(code: string): boolean {
    if (this.pressed.has(code)) {
      this.pressed.delete(code);
      return true;
    }
    return false;
  }

  snapshot(): FrameInput {
    const layout = MOVE_KEYS[this._layout];
    const forward = this.down.has(layout.forward);
    const backward = this.down.has(layout.backward);
    const left = this.down.has(layout.left);
    const right = this.down.has(layout.right);
    const move = new THREE.Vector2(
      (right ? 1 : 0) - (left ? 1 : 0),
      (backward ? 1 : 0) - (forward ? 1 : 0),
    );
    if (move.lengthSq() > 1) move.normalize();

    const jump = this.consume('Space') || this.consume('space');
    const interact = this.consume('KeyE') || this.consume('e');
    const scratch = this.consume('KeyF') || this.consume('f');

    return {
      move,
      sprint: this.down.has('ShiftLeft') || this.down.has('ShiftRight'),
      jump,
      interact,
      scratch,
    };
  }

  frameEnd(): void {
    this.pressed.clear();
  }
}
