import { FlatSurface } from '@/engine/graphics/2d/FlatSurface';
import crosshairUrl from '@/assets/textures/crosshair.png';

export class OverlayRenderer {
  private readonly surface: FlatSurface;
  private readonly crosshair: HTMLImageElement;

  constructor(canvasElement: HTMLCanvasElement) {
    this.surface = FlatSurface.create(canvasElement, {
      alpha: true,
      desynchronized: true,
      willReadFrequently: false,
      colorSpace: 'srgb',
    });

    this.crosshair = new Image();
    this.crosshair.src = crosshairUrl;
  }

  resize(width: number, height: number): void {
    this.surface.resize(width, height);
  }

  render(): void {
    this.surface.clear();

    this.renderCrosshair();
  }

  private renderCrosshair(): void {
    const x = Math.floor((this.surface.width - this.crosshair.width) / 2);
    const y = Math.floor((this.surface.height - this.crosshair.height) / 2);

    this.surface.drawImage(this.crosshair, x, y);
  }
}
