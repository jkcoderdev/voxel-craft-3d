import { queryCanvasBySelector } from '@/shared/dom';

export class FlatSurface {
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly context: CanvasRenderingContext2D,
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
}
