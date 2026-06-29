export type FrameLoopFunction = (timestamp: number) => void;

export class FrameLoop {
  private readonly handler: FrameLoopFunction;
  private readonly boundLoop: FrameRequestCallback;

  private isRunning = false;
  private animationFrameId: number | null = null;

  constructor(handler: FrameLoopFunction) {
    this.handler = handler;
    this.boundLoop = (timestamp: number) => this.loop(timestamp);
  }

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.animationFrameId = requestAnimationFrame(this.boundLoop);
  }

  stop(): void {
    this.isRunning = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  get running(): boolean {
    return this.isRunning;
  }

  private loop(timestamp: number) {
    if (!this.isRunning) return;

    this.handler(timestamp);

    if (this.isRunning) {
      this.animationFrameId = requestAnimationFrame(this.boundLoop);
    }
  }
}
