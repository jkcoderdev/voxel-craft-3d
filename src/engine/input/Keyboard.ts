export class Keyboard {
  private readonly pressedKeys = new Set<string>();

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    this.pressedKeys.add(event.code);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.pressedKeys.delete(event.code);
  };

  private readonly onBlur = (): void => {
    this.pressedKeys.clear();
  };

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  isKeyDown(code: string): boolean {
    return this.pressedKeys.has(code);
  }

  isAnyKeyDown(codes: string[]) {
    for (const code of codes) {
      if (this.pressedKeys.has(code)) {
        return true;
      }
    }

    return false;
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.pressedKeys.clear();
  }
}
