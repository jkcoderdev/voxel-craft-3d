import { queryCanvasBySelector } from '@/shared/dom';
import type { WebGPUContext } from '@/engine/graphics/webgpu/WebGPUContext';

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<T>;

export class WebGPUSurface {
  constructor(
    public readonly canvas: HTMLCanvasElement,
    public readonly context: GPUCanvasContext,
    public readonly format: GPUTextureFormat,
  ) {}

  static create(
    canvas: HTMLCanvasElement | string,
    gpu: WebGPUContext,
    options?: Optional<Omit<GPUCanvasConfiguration, 'device'>, 'format'>,
  ) {
    const _canvas = canvas instanceof HTMLCanvasElement ? canvas : queryCanvasBySelector(canvas);

    const context = _canvas.getContext('webgpu');
    if (!context) {
      throw new Error('WebGPU API is not supported in your browser.');
    }

    const config: GPUCanvasConfiguration = Object.assign(
      { device: gpu.device, format: gpu.preferredCanvasFormat },
      options,
    );

    context.configure(config);

    return new WebGPUSurface(_canvas, context, config.format);
  }

  get texture(): GPUTexture {
    return this.context.getCurrentTexture();
  }

  /**
   * Creates a new GPUTextureView
   */
  get view(): GPUTextureView {
    return this.context.getCurrentTexture().createView();
  }

  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0 || !Number.isInteger(width) || !Number.isInteger(height)) {
      throw new Error('Surface dimensions must be positive integers');
    }

    this.canvas.width = width;
    this.canvas.height = height;
  }
}
