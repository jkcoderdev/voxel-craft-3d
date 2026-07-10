import type { Camera } from '@/engine/core/Camera';
import { ResizableTexture } from '@/engine/graphics/webgpu/ResizableTexture';
import type { WebGPUContext } from '@/engine/graphics/webgpu/WebGPUContext';
import { WebGPUSurface } from '@/engine/graphics/webgpu/WebGPUSurface';

export class WorldRenderer {
  private readonly surface: WebGPUSurface;
  private readonly depthTexture: ResizableTexture;

  constructor(gpu: WebGPUContext, canvasElement: HTMLCanvasElement) {
    this.surface = WebGPUSurface.create(canvasElement, gpu, {
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
      format: gpu.preferredCanvasFormat,
      alphaMode: 'opaque',
      colorSpace: 'srgb',
    });

    this.depthTexture = new ResizableTexture(gpu, {
      label: 'Depth Texture',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
      format: 'depth24plus',
    });
  }

  resize(width: number, height: number): void {
    this.surface.resize(width, height);
    this.depthTexture.resize(width, height);
  }

  render(camera: Camera): void {}
}
