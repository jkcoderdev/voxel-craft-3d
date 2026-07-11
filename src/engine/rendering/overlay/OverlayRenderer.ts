import { FlatSurface } from '@/engine/graphics/2d/FlatSurface';

export class OverlayRenderer {
  private readonly surface: FlatSurface;

  constructor(canvasElement: HTMLCanvasElement) {
    this.surface = FlatSurface.create(canvasElement, {
      alpha: true,
      // desynchronized: true,
      // willReadFrequently: false,
      // colorSpace: 'srgb',
    });
  }

  resize(width: number, height: number): void {
    this.surface.resize(width, height);
  }

  render(): void {
    this.surface.clear();
    this.surface.context.fillRect(0, 0, 100, 100);
  }
}
