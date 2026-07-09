import chunkShader from '@/shaders/chunk.wgsl?raw';
import type { RenderQueue } from '@/engine/rendering/RenderQueue';
import { BindGroupManager } from '@/webgpu/BindGroupManager';
import type { DepthTexture } from '@/webgpu/DepthTexture';
import type { StaticMesh } from '@/webgpu/StaticMesh';
import type { WebGPUContext } from '@/webgpu/WebGPUContext';

export class ChunkRenderer {
  private readonly meshes: StaticMesh[] = [];

  private readonly pipeline: GPURenderPipeline;

  constructor(
    gpu: WebGPUContext,
    private readonly bindGroups: BindGroupManager,
    depthTexture: DepthTexture,
  ) {
    const chunkShaderModule = gpu.device.createShaderModule({
      label: 'Chunk Shader Module',
      code: chunkShader,
    });

    const pipelineLayout = gpu.device.createPipelineLayout({
      bindGroupLayouts: [bindGroups.getBindGroupLayout('common')],
    });

    const pipeline = gpu.device.createRenderPipeline({
      label: 'ChunkRenderer Render Pipeline',

      layout: pipelineLayout,

      vertex: {
        module: chunkShaderModule,
        entryPoint: 'vsMain',
        buffers: [
          {
            arrayStride: 24,
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x3' },
              { shaderLocation: 1, offset: 12, format: 'float32x3' },
            ],
          },
        ],
      },

      fragment: {
        module: chunkShaderModule,
        entryPoint: 'fsMain',
        targets: [{ format: gpu.preferredCanvasFormat }],
      },

      primitive: {
        topology: 'triangle-list',
        cullMode: 'back',
      },

      depthStencil: {
        depthCompare: 'less',
        depthWriteEnabled: true,
        format: depthTexture.format,
      },
    });

    this.pipeline = pipeline;
  }

  addMesh(mesh: StaticMesh) {
    this.meshes.push(mesh);
  }

  update(queue: RenderQueue): void {
    for (const mesh of this.meshes) {
      queue.push({
        kind: 'drawMesh',
        pipeline: this.pipeline,
        vertexBuffer: mesh.vertexBuffer,
        indexBuffer: mesh.indexBuffer,
        indexCount: mesh.indexCount,
        indexFormat: mesh.indexFormat,
        bindGroups: [{ index: 0, bindGroup: this.bindGroups.getBindGroup('common') }],
        priority: 0,
      });
    }
  }
}
