import { queryCanvasBySelector } from '@/shared/dom';

export class FlatSurface {
  constructor(
    public readonly canvas: HTMLCanvasElement,
    public readonly context: CanvasRenderingContext2D,
  ) {}

  static create(canvas: HTMLCanvasElement | string, options?: CanvasRenderingContext2DSettings): FlatSurface {
    const _canvas = canvas instanceof HTMLCanvasElement ? canvas : queryCanvasBySelector(canvas);

    const context = _canvas.getContext('2d', options);
    if (!context) {
      throw new Error('Canvas 2D API is not supported in your browser.');
    }

    return new FlatSurface(_canvas, context);
  }

  resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  get width(): number {
    return this.canvas.width;
  }

  get height(): number {
    return this.canvas.height;
  }

  clear(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawImage(image: CanvasImageSource, x: number, y: number): void {
    this.context.drawImage(image, x, y);
  }
}
