export interface ResizeInfo {
  virtualWidth: number;
  virtualHeight: number;

  physicalWidth: number;
  physicalHeight: number;
}

export type ResizeTrackerFunction = (info: ResizeInfo) => void;

export class ResizeTracker {
  private lastWidth: number;
  private lastHeight: number;
  private lastDpr: number;

  private currentWidth: number;
  private currentHeight: number;

  private readonly handler: ResizeTrackerFunction;
  private readonly observer: ResizeObserver;

  constructor(element: HTMLElement, handler: ResizeTrackerFunction) {
    const rect = element.getBoundingClientRect();

    this.lastWidth = -1;
    this.lastHeight = -1;
    this.lastDpr = -1;

    this.currentWidth = rect.width;
    this.currentHeight = rect.height;

    this.handler = handler;

    this.observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      this.currentWidth = width;
      this.currentHeight = height;
    });

    this.observer.observe(element);
  }

  update(): void {
    const dpr = window.devicePixelRatio || 1;

    if (this.currentWidth !== this.lastWidth || this.currentHeight !== this.lastHeight || dpr !== this.lastDpr) {
      this.lastWidth = this.currentWidth;
      this.lastHeight = this.currentHeight;
      this.lastDpr = dpr;

      const virtualWidth = Math.max(1, Math.floor(this.currentWidth));
      const virtualHeight = Math.max(1, Math.floor(this.currentHeight));

      const physicalWidth = Math.max(1, Math.floor(this.currentWidth * dpr));
      const physicalHeight = Math.max(1, Math.floor(this.currentHeight * dpr));

      this.handler({
        virtualWidth,
        virtualHeight,
        physicalWidth,
        physicalHeight,
      });
    }
  }

  destroy(): void {
    this.observer.disconnect();
  }
}
