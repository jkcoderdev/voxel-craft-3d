import { queryCanvasBySelector } from '@/shared/dom';
import type { WebGPUContext } from '@/webgpu/WebGPUContext';

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
    options?: Optional<GPUCanvasConfiguration, 'device' | 'format'>,
  ) {
    const _canvas = canvas instanceof HTMLCanvasElement ? canvas : queryCanvasBySelector(canvas);

    const context = _canvas.getContext('webgpu');
    if (!context) {
      throw new Error('WebGPU is not supported in your browser.');
    }

    const device = gpu.device;
    const format = gpu.preferredCanvasFormat;
    const config: GPUCanvasConfiguration = Object.assign({ device, format }, options);

    context.configure(config);

    return new WebGPUSurface(_canvas, context, format);
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
