import { KeyboardInput } from '../input/keyboard';
import { InputComponent } from '../ecs/components';
import { World } from '../ecs/world';

export function updateInput(world: World, keyboard: KeyboardInput): void {
  const frame = keyboard.snapshot();
  world.store.input.forEach((input: InputComponent) => {
    input.move.copy(frame.move);
    input.sprint = frame.sprint;
    input.jumpPressed = frame.jump;
    input.interactPressed = frame.interact;
    input.scratchPressed = frame.scratch;
  });
  keyboard.frameEnd();
}
