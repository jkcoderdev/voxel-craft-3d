import { Keyboard } from '@/engine/input/Keyboard';
import { PointerLockHandler } from '@/engine/input/PointerLockHandler';

export class InputManager {
  public readonly keyboard: Keyboard;
  public readonly pointerLockHandler: PointerLockHandler;

  constructor(element: HTMLElement) {
    this.keyboard = new Keyboard();
    this.pointerLockHandler = new PointerLockHandler(element);
  }
}
