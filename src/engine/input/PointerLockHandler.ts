import { Dispatcher } from '@/engine/core/Dispatcher';

export interface PointerLockMoveDelta {
  deltaX: number;
  deltaY: number;
}

export type PointerLockEvents = {
  change: [locked: boolean];
  move: [delta: PointerLockMoveDelta];
  error: [];
};

export class PointerLockHandler extends Dispatcher<PointerLockEvents> {
  private locked = false;
  private lockRequestPending = false;

  private readonly onPointerLockChange = (): void => {
    const locked = document.pointerLockElement === this.element;
    if (locked == this.locked) return;

    this.locked = locked;

    this.emit('change', locked);
  };

  private readonly onPointerLockError = (): void => {
    this.emit('error');
  };

  private readonly onMouseMove = (event: MouseEvent): void => {
    if (!this.locked) return;

    const delta: PointerLockMoveDelta = {
      deltaX: event.movementX,
      deltaY: event.movementY,
    };

    this.emit('move', delta);
  };

  constructor(private readonly element: HTMLElement) {
    super();

    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('pointerlockerror', this.onPointerLockError);
    document.addEventListener('mousemove', this.onMouseMove);
  }

  static isSupported(): boolean {
    return (
      typeof document !== 'undefined' &&
      'pointerLockElement' in document &&
      typeof HTMLElement.prototype.requestPointerLock === 'function'
    );
  }

  async lock(): Promise<void> {
    if (this.locked || this.lockRequestPending) return;

    this.lockRequestPending = true;

    try {
      await this.element.requestPointerLock({ unadjustedMovement: true });
    } finally {
      this.lockRequestPending = false;
    }
  }

  unlock(): void {
    if (this.locked) {
      document.exitPointerLock();
    }
  }

  destroy(): void {
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    document.removeEventListener('pointerlockerror', this.onPointerLockError);
    document.removeEventListener('mousemove', this.onMouseMove);

    this.removeAllListeners();

    if (this.locked) {
      document.exitPointerLock();
    }
  }
}
