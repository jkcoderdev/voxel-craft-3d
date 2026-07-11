export interface FrameData {
  timestamp: number;
  deltaTime: number;
}

export type FrameLoopFunction = (frame: FrameData) => void;

export class FrameLoop {
  private readonly handler: FrameLoopFunction;
  private readonly boundLoop: FrameRequestCallback;

  private _running = false;
  private animationFrameId: number | null = null;

  private lastTimestamp: number | null = null;

  constructor(handler: FrameLoopFunction) {
    this.handler = handler;
    this.boundLoop = (timestamp: number) => this.loop(timestamp);
  }

  start(): void {
    if (this._running) return;

    this._running = true;
    this.lastTimestamp = null;

    this.animationFrameId = requestAnimationFrame(this.boundLoop);
  }

  stop(): void {
    this._running = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  get running(): boolean {
    return this._running;
  }

  private loop(timestamp: number): void {
    if (!this._running) return;

    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp;
    }

    const deltaTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    try {
      this.handler({ timestamp, deltaTime });
    } catch (e) {
      this._running = false;
      throw e;
    }

    if (this._running) {
      this.animationFrameId = requestAnimationFrame(this.boundLoop);
    }
  }
}
