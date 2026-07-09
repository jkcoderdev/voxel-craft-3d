import type { Camera } from '@/engine/core/Camera';
import { ChunkRenderer } from '@/engine/rendering/ChunkRenderer';
import type { RenderQueue } from '@/engine/rendering/RenderQueue';
import { BindGroupManager } from '@/webgpu/BindGroupManager';
import type { DepthTexture } from '@/webgpu/DepthTexture';
import type { StaticMesh } from '@/webgpu/StaticMesh';
import { UniformBufferManager } from '@/webgpu/UniformBufferManager';
import type { WebGPUContext } from '@/webgpu/WebGPUContext';
import type { WebGPUSurface } from '@/webgpu/WebGPUSurface';

const CLEAR_COLOR: GPUColor = { r: 0.0, g: 0.0, b: 0.0, a: 1.0 };

export class WorldRenderer {
  private readonly bindGroups: BindGroupManager;
  private readonly uniformBuffers: UniformBufferManager;

  private readonly uniformData: Float32Array;

  private readonly chunkRenderer: ChunkRenderer;

  constructor(
    private readonly gpu: WebGPUContext,
    private readonly surface: WebGPUSurface,
    private readonly depthTexture: DepthTexture,
  ) {
    this.bindGroups = new BindGroupManager(gpu);
    this.uniformBuffers = new UniformBufferManager(gpu);

    this.uniformData = new Float32Array(17);

    const commonUniformBuffer = this.uniformBuffers.create('common', {
      label: 'Common Uniform Buffer',
      size: 80,
    });

    this.bindGroups.create('common', {
      label: 'Common Bind Group',
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          config: {
            type: 'uniform',
            buffer: commonUniformBuffer,
          },
        },
      ],
    });

    this.chunkRenderer = new ChunkRenderer(gpu, this.bindGroups, this.depthTexture);
  }

  private updateCommonBindGroup(camera: Camera, timestamp: number): void {
    const viewProjectionMatrix = camera.viewProjectionMatrix;
    const uniformBuffer = this.uniformBuffers.get('common');

    this.uniformData.set(viewProjectionMatrix, 0);
    this.uniformData[16] = timestamp / 1000;

    this.gpu.queue.writeBuffer(
      uniformBuffer,
      0,
      this.uniformData.buffer,
      this.uniformData.byteOffset,
      this.uniformData.byteLength,
    );
  }

  addMesh(mesh: StaticMesh): void {
    this.chunkRenderer.addMesh(mesh);
  }

  render(camera: Camera, timestamp: number, queue: RenderQueue): void {
    this.updateCommonBindGroup(camera, timestamp);

    this.chunkRenderer.update(queue);

    const encoder = this.gpu.device.createCommandEncoder({
      label: 'WorldRenderer Command Encoder',
    });

    const pass = encoder.beginRenderPass({
      label: 'WorldRenderer Render Pass',

      colorAttachments: [
        {
          view: this.surface.view,
          clearValue: CLEAR_COLOR,
          loadOp: 'load',
          storeOp: 'store',
        },
      ],

      depthStencilAttachment: {
        view: this.depthTexture.view,
        depthClearValue: 1.0,
        depthLoadOp: 'load',
        depthStoreOp: 'store',
      },
    });

    queue.execute(pass);

    pass.end();
    this.gpu.queue.submit([encoder.finish()]);

    queue.clear();
  }
}
