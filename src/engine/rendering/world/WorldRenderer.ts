import type { Camera } from '@/engine/core/Camera';
import { ResizableTexture } from '@/engine/graphics/webgpu/ResizableTexture';
import type { WebGPUContext } from '@/engine/graphics/webgpu/WebGPUContext';
import { WebGPUSurface } from '@/engine/graphics/webgpu/WebGPUSurface';
import { SharedUniforms } from '@/engine/rendering/world/SharedUniforms';
import type { SubRenderer } from '@/engine/rendering/world/SubRenderer';

export interface RendererResources {
  gpu: WebGPUContext;
  surface: WebGPUSurface;
  depthTexture: ResizableTexture;
  sharedUniforms: SharedUniforms;
}

export class WorldRenderer {
  private readonly surface: WebGPUSurface;
  private readonly subRenderers: SubRenderer[] = [];

  private readonly depthTexture: ResizableTexture;
  private readonly sharedUniforms: SharedUniforms;

  public readonly resources: RendererResources;

  constructor(
    private readonly gpu: WebGPUContext,
    canvasElement: HTMLCanvasElement,
  ) {
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

    this.sharedUniforms = new SharedUniforms(gpu);

    this.resources = {
      gpu,
      surface: this.surface,
      depthTexture: this.depthTexture,
      sharedUniforms: this.sharedUniforms,
    };
  }

  register(subRenderer: SubRenderer): void {
    this.subRenderers.push(subRenderer);
  }

  render(camera: Camera, timestamp: number): void {
    this.sharedUniforms.update(camera, timestamp);

    const encoder = this.gpu.device.createCommandEncoder({
      label: 'Renderer Command Encoder',
    });

    const pass = encoder.beginRenderPass({
      label: 'Main Render Pass',
      colorAttachments: [
        {
          view: this.surface.view,
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture.view,
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    });

    for (const subRenderer of this.subRenderers) {
      subRenderer.render(pass, this.sharedUniforms, camera, timestamp);
    }

    pass.end();
    this.gpu.queue.submit([encoder.finish()]);
  }

  resize(width: number, height: number): void {
    this.surface.resize(width, height);
    this.depthTexture.resize(width, height);
  }
}
